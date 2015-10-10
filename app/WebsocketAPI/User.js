/** @module WSAPI/User */

var system = require('./System.js');
var questionDAO = require('../../models/Question.js');
var userDAO = require('../../models/User.js');
var roomDAO = require('../../models/Room.js');
var panicDAO = require('../Panic.js');
var answerDAO = require('../../models/Answer.js');
var logger = require('../Logger.js');
var roomWSControl = require('./Room.js');
var roles = require('../../config/UserRoles.json');
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
var sessionStore = new sessionStore();
var imageDAO = require('../../models/Image.js');

module.exports = function (wsControl) {
	wsControl.on("user:vote", function (req, res) {
		if (req.authed) {
			if (req.params.questionId) {
				userDAO.hasAccessToQuestion(req.session.user, { _id : req.params.roomId }, { _id : req.params.questionId }, { population: 'author images author.avatar answers.images answers answers.author answers.author.avatar' }, function (err, user, question) {
					if (err) {
						return logger.warn("could not check user access: " + err);
					}
					if (roomWSControl.createVotesFields(req.session.user, question).hasVote) {
						return res.setError(new Error("You already voted for this Question!")).send();
					}
					questionDAO.vote(question, req.session.user, function (err, quest) {
						if (err) {
							logger.warn('Could not vote: ' + err);
							return res.setError(new Error('Could not vote.')).send();
						} else if (quest) {
							question = JSON.parse(JSON.stringify(question));
							question.author = roomWSControl.removeAuthorFields(question.author);
							question.author.avatar = question.author.avatar.path;
							question.votes = quest.votes;
							question.images = roomWSControl.removeOwnerFields(question.images);
							for (var i = question.answers.length - 1; i >= 0; i--) {
								question.answers[ i ].images = roomWSControl.removeOwnerFields(question.answers[ i ].images);
								question.answers[ i ].author.avatar = question.answers[ i ].author.avatar.path;
							}
							question.answers = roomWSControl.removeAuthorTokens(question.answers);
							logger.debug("broadcast question:add in room " + req.params.roomId);
							logger.debug(question);
							res.roomBroadcastUser('question:add', {
								'roomId': req.params.roomId,
								'question': question
							}, req.params.roomId);
						} else {
							res.setError(new Error('Could not vote.')).send();
						}
					});
				});
			} else {
				res.setError(new Error("Malformed Parameters.")).send();
			}
		} else {
			res.setError(new Error("Permission denied.")).send();
		}
	});

	wsControl.on('user:fetchRooms', function (req, res) {
		if (req.authed) {
			var worker = system.getWorkerMap()[ req.sId ];
			if (worker) {
				worker.fetchRooms(req.refId);
			} else {
				res.setError(new Error("Your worker is invalid.")).send();
			}
		} else {
			res.setError(new Error("Your req.session is invalid.")).send();
		}
	});
    
	wsControl.on('user:getRooms', function (req, res) {
		if (req.authed) {
			userDAO.getRoomAccess(req.session.user, {population: ''}, function (err, rooms) {
				if (err) {
					return logger.warn("could not get rooms: " + err);
				}
				rooms = rooms.toObject();
				var _roomSend = function (room) {
					panicDAO.hasUserPanic(req.session.user, room, function (err, panicEvent) {
						panicDAO.isRoomRegistered(room, function (isRegistered) {
							room.hasUserPanic = (!err && panicEvent) ? true : false;
							room.isRoomRegistered = isRegistered;
							res.sendCommand("room:add", {
								'room': room
							});
						});
					});
				};
				for (var i = rooms.length - 1; i >= 0; i--) {
					var r = rooms[ i ].toObject();
					(_roomSend)(r);
				}                    
			});
		} else {
			res.setError(new Error("Your req.session is invalid.")).send();
		}
	});

	wsControl.on('user:ask', function (req, res) {
		if (req.authed) {
			if (req.params && req.params.question && req.params.roomId) {

				if (req.params.question === "" || typeof req.params.question !== 'string') {
					return res.setError(new Error("invalid question format")).send();
				}
				userDAO.getRoomAccess(req.session.user, {population: ''}, function (err, access) {
					if (err) {
						logger.warn("error on getting room access array " + err);
					} else {
						var _answerSaveSend = function (err, images) {
							//images = images.toObject();
							var aCopy = JSON.parse(JSON.stringify(q)); // to send
							q.images = req.params.images;// to save
							aCopy.images = images;
							for (var key in aCopy.images) {
								aCopy.images[ key ].owner = undefined; // delete own user id
							}
							sendAndSaveQuestion(res, req.params.roomId, q, aCopy);
						};
						for (var i = access.length - 1; i >= 0; i--) {
							if (access[ i ]._id.toString() === req.params.roomId) {
								var q = new questionDAO.Question();
								q.author = req.session.user._id;
								q.content = req.params.question;
								q.votes = req.session.user._id;
								q.answers = [];
                                    
								if (req.params.images && req.params.images !== [] && Object.prototype.toString.call(req.params.images) === '[object Array]') {
									//check if valid image ids
									imageDAO.Image.find({_id: { $in : req.params.images }}, _answerSaveSend);
								} else {
									sendAndSaveQuestion(res, req.params.roomId, q, q);
								}      
								return;
							}
						}
						res.setError(new Error("Access Denied.")).send();
					}
				});
			} else {
				res.setError(new Error("Malformed Parameters.")).send();
			}
		} else {
			res.setError(new Error("Permission denied.")).send();
		}
	});

	wsControl.on("user:answer", function (req, res) {
		if (req.authed) {
			if (req.params && req.params.roomId && req.params.questionId && req.params.answer) {
				if (req.params.answer === "" || typeof req.params.answer !== 'string') {
					return res.setError(new Error("invalid question format")).send();
				}
				userDAO.getRoomAccess(req.session.user, {population: 'questions'}, function (err, access) {
					var hasAccess = false;
					var _answerSend = function (err, q) {
						if (q) {
							var a = new answerDAO.Answer();
							a.author = req.session.user._id;
							a.content = req.params.answer;
							if (req.params.images && req.params.images !== [] && Object.prototype.toString.call(req.params.images) === '[object Array]') {
								//check if valid image ids
								imageDAO.Image.find({_id: { $in : req.params.images }}, function (err, images) {
									//images = images.toObject();
									var aCopy = JSON.parse(JSON.stringify(a)); // to send
									a.images = req.params.images;// to save
									aCopy.images = images;
									for (var key in aCopy.images) {
										aCopy.images[ key ].owner = undefined; // delete own user id
									}
									sendAndSaveAnswer(res, q, a, room, aCopy);
								});
                                
							} else {
								sendAndSaveAnswer(res, q, a, room, a);
							}
							return;
						}
					};
					for (var i = access.length - 1; i >= 0; i--) {
						if (access[ i ]._id == req.params.roomId) {
							hasAccess = true;
							var room = access[ i ];
                            
							questionDAO.getByID(req.params.questionId, {population : ''}, _answerSend);
						}
					}
					if (!hasAccess) {
						res.setError(new Error("Access Denied.")).send();
					}
				});
			} else {
				res.setError(new Error("malformed req.params")).send();
			}
		} else {
			res.setError(new Error("Permission denied.")).send();
		}
	});

	wsControl.on('user:getAccessLevel', function (req, res) {
		if (req.authed) {
			sessionStore.get(req.sId, function (err, sess) {
				if (sess.user && sess.user.rights) {
					for (var key in sess.user.rights) {
						if (sess.user.rights[ key ].roomId === req.params.roomId) {
							return res.send({ accessLevel: sess.user.rights[ key ].accessLevel});
						}
					}
				}
				res.send({ accessLevel: roles.defaultLoggedIn});
			});
		} else {
			res.send({ accessLevel: roles.default});
		}
	});

	wsControl.on('user:panic', function (req, res) {
		if (req.authed) {
			if (req.params && req.params.roomId) {
				userDAO.hasAccessToRoom(req.session.user, {_id: req.params.roomId}, {population: ''}, function (err) {
					if (err) {
						res.setError(new Error("Access denied.")).send();
						return logger.warn("could not check room access: " + err);
					}
					panicDAO.panic(req.session.user, {_id: req.params.roomId}, function (err) {
						if (err) {
							return res.setError(new Error("Cannot save user's panic.")).send();
						}
						res.send({'status': true});
					});                
				});
			} else {
				res.setError(new Error("Your req.session is invalid.")).send();
			}
		} else {
			res.setError(new Error("Your req.session is invalid.")).send();
		}
	});

	wsControl.on('user:unpanic', function (req, res) {
		if (req.authed) {
			if (req.params && req.params.roomId) {
				userDAO.hasAccessToRoom(req.session.user, {_id: req.params.roomId}, {population: ''}, function (err) {
					if (err) {
						res.setError(new Error("Access denied.")).send();
						return logger.warn("could not check room access: " + err);
					}
					panicDAO.unpanic(req.session.user, {_id: req.params.roomId}, function (err) {
						if (err) {
							return res.setError(new Error("Cannot delete user's panic.")).send();
						}
						res.send({'status': true});
					});                
				});
			} else {
				res.setError(new Error("Your req.session is invalid.")).send();
			}
		} else {
			res.setError(new Error("Your req.session is invalid.")).send();
		}
	});

	wsControl.on('user:changeName', function (req, res) {
		if (req.authed) {
			if (req.params.username) {
				req.session.user.name = req.params.username;
				//save the session and update the real user in database.
				sessionStore.set(req.sId, req.session, function (err) {
					if (err) {
						logger.warn("Saving Session Name failed.");
						res.send({ status : false });
					}
				});
				userDAO.get(req.session.user._id, function (err, user) {
					if (err) {
						logger.warn("Saving User Name failed.");
						res.send({ status : false });
					} else {
						user.name = req.params.username;
						user.save(function (err) {
							if (err) {
								logger.warn("Saving Username into Database failed.");
								res.setError(err).send();
							} else {
								res.send({ status : true });
							}
						});
					}
				});
			} else {
				res.send({ status : false });
			}
		} else {
			res.send({ status : false });
		}
	});
};

/**
 * Helper Function to broadcast questions.
 * @param  {type} wss - description
 * @param  {type} ws - description
 * @param  {type} roomId - description
 * @param  {type} q - description
 * @param  {type} qToSend - description
 * @return {type} description
 */
function sendAndSaveQuestion(res, roomId, q, qToSend) {

	roomDAO.addQuestion({ _id : roomId}, q, function (err, room, question) {
		if (err) {
			logger.warn("could not add or create question: " + err);
			res.setError(new Error("could not add or create question")).send();
		} else {
			questionDAO.getByID(question._id, {population : 'author author.avatar images'}, function (err, quest) {
				qToSend = JSON.parse(JSON.stringify(quest));
				qToSend.author = roomWSControl.removeAuthorFields(qToSend.author);
				qToSend.author.avatar = qToSend.author.avatar.path;
				qToSend.answers = roomWSControl.removeAuthorTokens(quest.answers);
				res.roomBroadcastUser("question:add", {
					'roomId': room._id,
					'question': qToSend
				}, room._id);
				logger.info("added new question to room " + room._id);
			});
		}
	});
}


/*
 * Helper Function to broadcast answers.
 * @param  {[type]} wss          [description]
 * @param  {[type]} ws           [description]
 * @param  {[type]} q            [description]
 * @param  {[type]} a            [description]
 * @param  {[type]} answerToSend [description]
 * @return {[type]}              [description]
 */
function sendAndSaveAnswer(res, q, a, room, answerToSend) {
	questionDAO.addAnswer(q, a, function (err, question, answer) {
		if (err) {
			logger.warn("could not add or create question: " + err);
			res.setError(new Error("could not add or create answer")).send();
		} else {
			answerDAO.getByID(answer._id, {population: 'author author.avatar images'}, function (err, ans) {
				//ans.toObject();
				answerToSend = JSON.parse(JSON.stringify(ans));
				answerToSend.author = roomWSControl.removeAuthorFields(answerToSend.author);
				answerToSend.images = roomWSControl.removeOwnerFields(answerToSend.images);
				answerToSend.author.avatar = ans.author.avatar.path;
				res.roomBroadcastUser('answer:add', {
					'roomId': room._id,
					'questionId': question._id,
					'answer': answerToSend
				}, room._id);
				logger.info("added new answer to room " + room.l2pID);
			});
		}
	});
}
