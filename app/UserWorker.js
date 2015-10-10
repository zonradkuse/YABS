/** @module Misc/UserWorker */

var session = require('express-session');
var sessionStore = require('connect-redis')(session);
var logger = require('./Logger.js');
sessionStore = new sessionStore();
var l2p = require('./RWTH/L2PRequests.js');
var Room = require('../models/Room.js');
var User = require('../models/User.js');
var campusReq = require('./RWTH/CampusRequests.js');
var config = require('../config.json');
var querystring = require('querystring');
var panicDAO = require('./Panic.js');
var roles = require('../config/UserRoles.json');

/** sets needed object attributes.
 * @constructor
 * @param {SessionId} sId - user SessionId
 * @param {Websocket} ws - user specific websocket
 * @param {User} user - user data access object
 * @param {Object} wsFrame
 * @param {Boolean} initialBool
 */
var UserWorker = function (req, res, user, initialBool) {
	var self = this;
	this.req = req;
	this.res = res;
	this.res.reusable = true;
    this.sId = req.sId;
	this.ws = res.ws;
	this.user = user;
	this.initialized = initialBool;
    this.sessionUser = req.session.user;
    logger.debug("new user worker: " + self);
    sessionStore.get(this.sId, function (err, session) {
        self.session = session;
    });
};

/** Checks if there are new rooms that need to be added to the database and adds them.
 * @param {String} refId - request refId
 * @param {UserWorker~callback} next - callback function
 */
UserWorker.prototype.fetchRooms = function (refId, next) {
	var self = this;
	this.checkSession(function (err, value) {
		if (err) {
			self.res.setError(err).send();
			logger.warn("could not fetch rooms: " + err);
		} else if (value) {
			// valid session existing - check access token
			self.refreshAccessToken(function (err) {
				if (err) {
					logger.warn("could not refresh access token: " + err);
					return self.res.setError(new Error("Could not refresh your token.")).send();
				}
                var request = new l2p.l2pRequest(self.user.rwth.token);
                request.getAllCourses(function (err, courses) {
					if (err.message === 'Parse error') {
						logger.warn("L2P courselist was not valid json: " + courses.toString());
						return;
					} else if (err) {
                        self.res.setError(new Error("Something bad happened")).send();
                        logger.warn('unexpected error: ' + err);
                        return;
                    }
					if (courses.Status) {
						var _addRoom = function (err, user, room) {
							if (err) {
								logger.warn("error on adding room to user: " + err);
								return;
							}
							if (user) {
								panicDAO.hasUserPanic(self.user, room, function (err, panicEvent) {
									panicDAO.isRoomRegistered(room, function (isRegistered) {
										var r = room.toObject();
										r.hasUserPanic = (!err && panicEvent) ? true : false;
										r.isRoomRegistered = isRegistered;
										r.questions = [];
										self.res.sendCommand("room:add", { 'room': r });
										logger.info("added new room: " + r.l2pID);
                                        process.nextTick(function () {
                                            self.processRoleByRoom(room);
                                        });
									});
								});
							}
						};
						for (var el in courses.dataSet) {
							var _room = new Room.Room();
							_room.l2pID = courses.dataSet[ el ].uniqueid;
							_room.name = courses.dataSet[ el ].courseTitle;
							_room.description = courses.dataSet[ el ].description;
							_room.url = courses.dataSet[ el ].url;
							_room.status = courses.dataSet[ el ].status;
							_room.semester = courses.dataSet[ el ].semester;

                            // results in findOrCreate, the room will be saved here
							User.addRoomToUser(self.user, _room, _addRoom);
						}
					} else {
						self.res.setError(new Error("L2P returned bad things.")).send();
						logger.warn("Bad L2P answer: " + courses.toString());
					}
					if (next) {
						next();
					}
				});
			});
		} else if (!value) {
			self.res.setError(new Error("Your session is invalid.")).send();
		}
	});
};

/** Sets next true if the user session is still valid.
 * @param {UserWorker~boolCallback} next - callback function
 */
UserWorker.prototype.checkSession = function (next) {
	var self = this;
	sessionStore.get(self.sId, function (err, session) {
		if (err) {
			self.res.setError(err).send();
			logger.warn("error on session retrieving: " + err);
			return next(err);
		} else if (!session) {
			return next(null, false);
		} else {
            self.sessionUser = session.user;
            self.session = session;
			return next(null, true);
		}
	});
};

UserWorker.prototype.addRoomToSessionRights = function (roomId, accessLevel, next) {
    var self = this;
    sessionStore.get(self.sId, function (err, session) {
        if (err) {
            self.res.setError(err).send();
            logger.warn("error on session retrieving: " + err);
            return next(err);
        } else if (!session) {
            return next(null, false);
        } else {
            if (!self.hasRightsEntry(roomId)) {
                session.user.rights.push({roomId: roomId.toString(), accessLevel: accessLevel});
                self.sessionUser = session.user;
                self.session = session;
                sessionStore.set(self.sId, session, next);
            }
        }
    });
};

/** 
 * Renews the Campus access_token if called and the user is still logged in/has a valid session.
 * @param {UserWorker~errorCallback} next - callback function
 */
UserWorker.prototype.refreshAccessToken = function (next) {
	var self = this;
	logger.debug("refreshing with token: " + self.user.rwth.refresh_token);
	if (!self.user.rwth.refresh_token) {
		return next();
	}
	this.checkToken(function (err, expires) {
		if (err) {
			return next(err);
		}

		if (!expires || expires < 300) {
			campusReq.postReqCampus('token', querystring.stringify({
				"client_id": config.login.l2p.clientID,
				"refresh_token": self.user.rwth.refresh_token,
				"grant_type": "refresh_token"
			}), function (err, res) {
				if (err) {
					return next(err);
				} else {
					var answer;
					try {
						answer = JSON.parse(res);
					} catch (e) {
						return next(e);
					}
					if (answer.status === "ok") {
						User.get(self.user._id, function (err, _user) {
							if (err) {
								return next(err);
							}
							if (_user) {
								_user.rwth.token = answer.access_token;
								self.user = _user;
								self.user.save(function (e, savedUser) {
									if (e) {
										return logger.warn("could not save a user: " + e);
									}
                                    self.setSessionUser(savedUser, function (err) {
                                        if (err) {
                                            return next(err);
                                        } else {
                                            return next(null);
                                        }
                                    });
                                    self.user.rwth.token = answer.access_token;
								});
							} else {
								logger.warn("user should have existed: " + self.user);
								return next(new Error("You do not exist."));
							}

						});

					} else if (answer.error === "authorization invalid.") {
						return next(new Error("Your refresh_token is invalid."));
					} else if (answer.status === "error: refresh token invalid.") {
						// destroy session
						sessionStore.destroy(self.sId);
						return next(new Error("Your refresh_token is invalid."));
					}
				}
			});
		} else {
			return next(null);
		}

	});
};

UserWorker.prototype.setSessionUser = function (sessionUser, next) {
    var self = this;
    if (!sessionUser) {
        throw new Error('Session not set');
    }
    sessionStore.get(self.sId, function (err, sessionObj) {
        if (err) {
            return next(err);
        } else {
            sessionObj.user = sessionUser;
            sessionStore.set(self.sId, sessionObj, function (err) {
                next(err);
            });
        }

    });

};

/** 
 * Check token.
 * @param {UserWorker~tokenCallback} next - callback function
 */
UserWorker.prototype.checkToken = function (next) {
	var self = this;

	campusReq.postReqCampus('tokeninfo', querystring.stringify({
		"client_id": config.login.l2p.clientID,
		"access_token": self.user.rwth.token
	}), function (err, res) {
		if (err) {
			return next(err);
		} else {
			var answer;
			try {
				answer = JSON.parse(res);
			} catch (e) {
				return next(e);
			}

			if (answer.status === "ok") {
				next(null, answer.expires_in);
			} else {
				next(null, null);
			}
		}
	});

};

/** Get all rooms. And send them out to the client via ws. */
UserWorker.prototype.getRooms = function () {
	var self = this;
	if (self.user && self.user._id) {
        User.getRoomAccess(self.user, { population: 'quiz.questions' }, function (err, rooms) {
			var _roomSend = function (room) {
                self.processRoleByRoom(room);

				panicDAO.hasUserPanic(self.user, room, function (err, panicEvent) {
					panicDAO.isRoomRegistered(room, function (isRegistered) {
						room.hasUserPanic = (!err && panicEvent) ? true : false;
						room.isRoomRegistered = isRegistered;
						room.questions = [];
						self.res.sendCommand("room:add", { 'room': room });
					});
				});
			};
			for (var room in rooms) {
				if (rooms[ room ].l2pID !== undefined) {
					var r = rooms[ room ].toObject();
					_roomSend(r);
				}
			}
		});
	} else {
		self.res.setError(new Error("Your session is invalid.")).send();
	}
};

/**
 * Does the processing of the userRole in the specified room.
 *
 * @param {Room} room - a room object that needs to be checked
 */
UserWorker.prototype.processRoleByRoom = function (room) {
    var self = this;
    var request = new l2p.l2pRequest(self.user.rwth.token);
    if (!self.hasRightsEntry(room._id) && !config.hackfix.userRoleWorkaround) {
        request.getUserRole(room.l2pID, function (err, userRole) {
            // data is well formatted if error not set.
            if (err) {
                logger.warn("Error getting userRole: " + err); // do not warn user: he is probably a student
            } else {
                logger.debug("userRole: " + userRole.toString());
                if (userRole && (userRole.indexOf('manager') > -1 || userRole.indexOf('tutors') > -1)) {
                    // as soon as this is really works in l2p (not working since february 2015), this should work here, too.
                    self.addRoomToSessionRights(room._id, roles.defaultAdmin, function (err) {
                        if (err) {
                            logger.warn("Could not add to user rights: " + err);
                        }
                    });
                } else if (userRole.indexOf('students') > -1) {
                    self.addRoomToSessionRights(room._id, roles.defaultLoggedIn, function (err) {
                        if (err) {
                            logger.warn("Could not add to user rights: " + err);
                        }
                    });
                }
            }
        });
    } else {
        logger.debug("no need to fetch userRole");
    }
};

/**
 * Checks if there is an entry to the given room id in session rights array
 * @param roomId
 */
UserWorker.prototype.hasRightsEntry = function (roomId) {
    var self = this;
    for (var right in self.sessionUser.rights) {
        if (self.sessionUser.rights[ right ].roomId === roomId.toString()) {
            return true;
        }
    }
    return false;
};

//------ Helper section.


module.exports = UserWorker;


/**
 * @callback UserWorker~callback
 */

/**
 * @callback UserWorker~errorCallback
 * @param {Error} err - if an error occurs
 */

/**
 * @callback UserWorker~boolCallback
 * @param {Error} err - if an error occurs
 * @param {Boolean} bool - true on success
 */

/**
 * @callback UserWorker~tokenCallback
 * @param {Error} err - if an error occurs
 * @param {Number} expires_in - time it will be expired
 */
