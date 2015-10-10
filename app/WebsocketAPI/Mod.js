/** @module WSAPI/Moderator */

var answerDAO = require('../../models/Answer.js');
var questionDAO = require('../../models/Question.js');
var roomDAO = require('../../models/Room.js');
var accessManager = require('../AccessManagement.js');
var roomWSControl = require('./Room.js');
var logger = require('../Logger.js');
var apiHelpers = require('./misc/Helpers.js');

module.exports = function (wsControl) {
	wsControl.on('mod:markAsGoodQuestion', function (req, res) {
		checkAccess(wsControl, req, res, function () {
			
		});
	});

    wsControl.on("mod:setRoomConfigDiscussion", function (req, res) {
        configurationChangePreparation(req, res, function (room) {
            room.config.components.discussions = req.params.status;
        });
    });

    wsControl.on("mod:setRoomConfigPanicbutton", function (req, res) {
        configurationChangePreparation(req, res, function (room) {
            room.config.components.panicbutton = req.params.status;
        });
    });

    wsControl.on("mod:setRoomConfigQuiz", function (req, res) {
        configurationChangePreparation(req, res, function (room) {
            room.config.components.quiz = req.params.status;
        });
    });

    wsControl.on("mod:userMayAnswerToQuestion", function (req, res) {
        configurationChangePreparation(req, res, function (room) {
            room.config.userMayAnswerToQuestion = req.params.status;
        });
    });

    wsControl.on("mod:questionerMayMarkAnswer", function (req, res) {
        configurationChangePreparation(req, res, function (room) {
            room.config.questionerMayMarkAnswer = req.params.status;
        });
    });

    wsControl.on("mod:mulitOptionPanicButton", function (req, res) {
        configurationChangePreparation(req, res, function (room) {
            room.config.mulitOptionPanicButton = req.params.status;
        });
    });

    wsControl.on("mod:thresholdForImportantQuestion", function (req, res) {
        configurationChangePreparation(req, res, function (room) {
            room.config.thresholdForImportantQuestion = req.params.val;
        });
    });

	wsControl.on("mod:deleteAnswer", function (req, res) {
		checkAccess(wsControl, req, res, function () {
			answerDAO.getByID(req.params.answerId, {population: 'author author.avatar'}, function (err, ans) {
				ans.images = [];
				ans.content = "Der Inhalt wurde gelöscht.";
				ans.deleted = true;
				ans.isAnswer = false;
				ans.save(function (err) {
					if (err) {
						res.setError(new Error("Could not save the new state.")).send();
						return logger.err("Could not save the new state: " + err);
					}
					var _ans = JSON.parse(JSON.stringify(ans));
					_ans.author.avatar = _ans.author.avatar.path;
					_ans.author = roomWSControl.removeAuthorFields(_ans.author);
					_ans.images = roomWSControl.removeOwnerFields(_ans.images);
					res.roomBroadcastUser("answer:add", {
						'roomId': req.params.roomId,
						'questionId' : req.params.questionId,
						'answer' : _ans
					}, req.params.roomId);
					answerDAO.remove(_ans, function (err) {
						if (err) logger.warn(err);
					});
				});
			});
		});
	});

	wsControl.on("mod:deleteQuestion", function (req, res) {
		checkAccess(wsControl, req, res, function () {
			questionDAO.getByID(req.params.questionId, {population: 'author author.avatar'}, function (err, q) {
				q.images = [];
				q.content = "Der Inhalt wurde gelöscht.";
				q.votes = [];
				q.answers = [];
				q.visible = false;
				q.save(function (err) {
					if (err) {
						res.setError(new Error("Could not save the new state.")).send();
						return logger.err("Could not save the new state: " + err);
					}
					var _q = JSON.parse(JSON.stringify(q));
					_q.author.avatar = _q.author.avatar.path;
					_q.author = roomWSControl.removeAuthorFields(_q.author);
					_q.images = roomWSControl.removeOwnerFields(_q.images);
					_q.answers = [];
					res.roomBroadcastUser("question:add", {
						'roomId': req.params.roomId,
						'question' : roomWSControl.createVotesFields(req.session.user, _q)
					}, req.params.roomId);
					questionDAO.remove(_q, function (err) {
						if (err) logger.warn(err);
					});
				});
			});
		});
	});
	
	wsControl.on("mod:markAsAnswer", function (req, res) {
		checkAccess(wsControl, req, res, function () {
			answerDAO.getByID(req.params.answerId, {population: 'author author.avatar images'}, function (err, ans) {
                ans.isAnswer = true;
				ans.save(function (err) {
					if (err) {
						wsControl.build(req.ws, new Error("Could not save the new state."), null, req.refId);
						return logger.err("Could not save the new state: " + err);
					}
					var toSend = JSON.parse(JSON.stringify(ans));
					toSend.author = roomWSControl.removeAuthorFields(toSend.author);
					toSend.author.avatar = toSend.author.avatar.path;
					res.roomBroadcastUser("answer:add", {
						'roomId': req.params.roomId,
						'questionId': req.params.questionId,
						'answer': toSend
					}, req.params.roomId);
				});
			});
		});
	});
    
	wsControl.on("mod:unmarkAsAnswer", function (req, res) {
		checkAccess(wsControl, req, res, function () {
			answerDAO.getByID(req.params.answerId, {population: 'author author.avatar images'}, function (err, ans) {
				ans.isAnswer = false;
                
				ans.save(function (err) {
					if (err) {
						res.setError(new Error("Could not save the new state.")).send();
						return logger.err("Could not save the new state: " + err);
					}
					var toSend = JSON.parse(JSON.stringify(ans));
					toSend.author = roomWSControl.removeAuthorFields(toSend.author);
					toSend.author.avatar = toSend.author.avatar.path;
					res.roomBroadcastUser("answer:add", {
						'roomId': req.params.roomId,
						'questionId': req.params.questionId,
						'answer': toSend
					}, req.params.roomId);
				});
			});
		});
	});

	wsControl.on("mod:question:markAsGood", function (req, res) {
		questionDAO.Question.findOne({ _id : req.questionId }).exec(function (err, q) {
			if (err) {
				logger.warn(err);
				return res.setError(new Error("cannot update question")).send();
			}
			q.markedAsGood = true;
			q.save();
		});
	});

	wsControl.on("mod:question:unmarkAsGood", function (req, res) {
		questionDAO.Question.findOne({ _id : req.questionId }).exec(function (err, q) {
			if (err) {
				logger.warn(err);
				return res.setError(new Error("cannot update question")).send();
			}
			q.markedAsGood = false;
			q.save();
		});
	});
};

/**
 * Calls Callback iff all requirements are met. This is only for mod uris containing nswer or question as they are similar
 */
var checkAccess = function (wsControl, req, res, cb) {
	if (req.authed) {
		if ((req.uri.indexOf("nswer") > -1 && req.params.roomId && req.params.questionId && req.params.answerId) ||
			(req.uri.indexOf("uestion") > -1 && req.params.roomId && req.params.questionId)) {
			accessManager.checkAccessBySId("mod:markAsAnswer", req.sId, req.params.roomId, function (err, bool) {
				if (bool) {
					cb();
				} else {
					res.setError(new Error("Access Denied.")).send();
				}
			});
		} else {
			res.setError(new Error("Missing Parameters.")).send();
		}
	} else {
		res.setError(new Error("Access Denied.")).send();
	}
};
/**
 * This function performs default checks before setting some configuration. It is just existing in order to save code.
 * <strong>The callback has to be synchronous!!</strong>
 * @param req
 * @param cb
 */
function configurationChangePreparation(req, res, cb) {
    if (req.authed) {
        roomDAO.Room.findOne({ _id : req.params.roomId }).
            deepPopulate('questions.author.avatar questions.answers.author.avatar').
            exec(function (err, room) {
                if (err) {
                    logger.warn("Could not set room config! Error: " + err);
                    res.setError(new Error("An Error occured.")).send();
                } else {
                    cb(room);
                    process.nextTick(function () {
                        room.save(function (err) {
                            if (err) {
                                logger.warn(err);
                                res.setError(new Error("An Error occured.")).send();
                            } else {
                                room = apiHelpers.prepareRoom(req.session.user, room.toObject());
                                res.roomBroadcastUser("room:add", { room : room }, req.params.roomId);
                            }
                        });
                    });
                }
            });
    } else {
        res.setError(new Error("Access Denied.")).send();
    }
}
