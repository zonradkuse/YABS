/** @module UserWorker */

var websocket = require('ws').WebSocket;
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
var logger = require('./Logger.js');
sessionStore = new sessionStore();
var l2p = require('./RWTH/L2PRequests.js');
var Room = require('../models/Room.js');
var User = require('../models/User.js');
var userDAO = require('../models/User.js');
var campusReq = require('./RWTH/CampusRequests.js');
var config = require('../config.json');
var querystring = require('querystring');
var panicDAO = require('./Panic.js');

/** sets needed object attributes.
 * @constructor
 * @param {SessionId} sId - user SessionId
 * @param {Websocket} ws - user specific websocket
 * @param {User} user - user data access object
 * @param {Object} wsFrame
 * @param {Boolean} initialBool
 */
var UserWorker = function (sId, ws, user, wsFrame, initialBool) {
	this.sId = sId;
	this.ws = ws;
	this.user = user;
	this.wsControl = wsFrame;
	this.initialized = initialBool;
};

/** Checks if there are new rooms that need to be added to the database and adds them.
 * @param {String} refId - request refId
 * @param {UserWorker~callback} next - callback function
 */
UserWorker.prototype.fetchRooms = function (refId, next) {
	var self = this;
	this.checkSession(function (err, value) {
		if (err) {
			self.wsControl.build(self.ws, err);
			logger.warn("could not fetch rooms: " + err);
		} else if (value) {
			// valid session existing - check access token
			self.refreshAccessToken(function (err) {
				if (err) {
					logger.warn("could not refresh access token: " + err);
					return self.wsControl.build(self.ws, new Error("Could not refresh your token."), null, refId);
				}
				l2p.getAllCourses(self.user.rwth.token, function (courses) {
					try {
						courses = JSON.parse(courses);
						logger.debug(courses);
					} catch (e) {
						self.wsControl.build(self.ws, new Error("L2P answer was invalid. Probably HTML code."), null, refId);
						logger.warn("L2P courselist was not valid json: " + courses.toString());
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
										self.wsControl.build(self.ws, null, null, null, "room:add", { 'room': r });
										logger.info("added new room: " + r.l2pID);
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

							User.addRoomToUser(self.user, _room, _addRoom);
						}
					} else {
						self.wsControl.build(self.ws, new Error("L2P returned bad things."), null, refId);
						logger.warn("Bad L2P answer: " + courses.toString());
					}
					if (next) {
						next();
					}
				});
			});
		} else if (!value) {
			self.wsControl.build(self.ws, new Error("Your session is invalid."));
		}
	});
};

/** Sets next true if the user session is still valid.
 * @param {UserWorker~boolCallback} next - callback function
 */
UserWorker.prototype.checkSession = function (next) {
	var self = this;
	sessionStore.get(self.sId, function (err, user) {
		if (err) {
			self.wsControl.build(self.ws, err);
			logger.warn("error on session retrieving: " + err);
			next(err);
		} else if (!user) {
			next(null, false);
		} else {
			next(null, true);
		}
	});
};

/** Renews the Campus access_token if called and the user is still logged in/has a valid session.
 * @param {UserWorker~errorCallback} next - callback function
 */
UserWorker.prototype.refreshAccessToken = function (next) {
	var self = this;
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
					next(err);
				} else {
					var answer;
					try {
						answer = JSON.parse(res);
					} catch (e) {
						return next(e);
					}
					if (answer.status === "ok") {
						userDAO.get(self.user._id, function (err, _user) {
							if (err) {
								return next(err);
							}
							if (_user) {
								_user.rwth.token = answer.access_token;
								self.user = _user;
								self.user.save(function (e) {
									if (e) {
										return logger.warn("could not save a user: " + e);
									}
									next(null);
								});
							} else {
								logger.warn("user should have existed: " + self.user);
								next(new Error("You do not exist."));
							}

						});

					} else if (answer.error === "authorization invalid.") {
						next(new Error("Your refresh_token is invalid."));
					} else if (answer.status === "error: refresh token invalid.") {
						next(new Error("Your refresh_token is invalid."));
					}
				}
			});
		} else {
			next(null);
		}

	});

};

/** Check token.
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
/** Merges this.user with the given userId and sets (err, mergedUser) as parameters in next.
 * @todo implement
 */
UserWorker.prototype.mergeWithUser = function (userId, next) {

};

/** Get all rooms. */
UserWorker.prototype.getRooms = function () {
	var self = this;
	if (self.user && self.user._id) {
		userDAO.getRoomAccess(self.user, { population: '' }, function (err, rooms) {
			var _roomSend = function (room) {
				panicDAO.hasUserPanic(self.user, room, function (err, panicEvent) {
					panicDAO.isRoomRegistered(room, function (isRegistered) {
						room.hasUserPanic = (!err && panicEvent) ? true : false;
						room.isRoomRegistered = isRegistered;
						room.questions = [];
						self.wsControl.build(self.ws, null, null, null, "room:add", { 'room': room });
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
		wsControl.build(ws, new Error("Your session is invalid."), null, refId);
	}
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