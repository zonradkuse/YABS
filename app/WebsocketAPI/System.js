/** @module WSAPI/System */

var infoCalls = require("./System/InfoCalls.js");
var roomEntrance = require('./System/RoomEntrance.js');
var logger = require('../Logger.js');
var config = require('../../config.json');
var querystring = require('querystring');
var UserModel = require('../../models/User.js');
var roomDAO = require('../../models/Room.js');
var User = require('../../models/User.js').User;
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
sessionStore = new sessionStore();
var userWorker = require('../UserWorker.js');
var campus = require('../RWTH/CampusRequests.js');
var panicDAO = require('../Panic.js');
var moniker = require('moniker');
var avatarGenerator = require('../ProfilePicture.js');
var imageDAO = require('../../models/Image.js');
var fancyNames = moniker.generator([ moniker.adjective, moniker.noun ], { glue: ' ' });
var workerMap = {};

module.exports = function (wsControl) {
	infoCalls(wsControl);
	roomEntrance(wsControl, workerMap);

	wsControl.on('system:close', function (req) {
		//workerMap[req.sId].stop();
		logger.info("a client disconnected.");
		process.nextTick(function () {
			logger.debug("disconnected client workerMap entry: " + workerMap[ req.sId ]);
			delete workerMap[ req.sId ];
		});
	});

	wsControl.on('system:open', function (req) {
		logger.info("new client arrived.");
		wsControl.build(req.ws, null, { message: 'welcome' }, null);
		process.nextTick(function () {
			setTimeout(function () {
				if (req.session && req.session.user && req.session.user._id) {
					UserModel.get(req.session.user._id, function (err, _user) {
						var worker = new userWorker(req.sId, req.session.user, req.ws, _user, wsControl, true);
						workerMap[ req.sId ] = worker;
						worker.fetchRooms(null, function () { //get new rooms
							worker.getRooms(); //send all rooms
						});
						process.nextTick(function () {
							worker.getRooms(); //send at least old rooms                            
						});
					});
				}
			}, 600);
		});
	});
    
	wsControl.on('system:login', function (req) {
		postReqCampus('code', querystring.stringify({
			"client_id": config.login.l2p.clientID,
			"scope": config.login.l2p.scope
		}), function (err, answer) {
			if (err) {
				wsControl.build(req.ws, err, null, req.refId);
				logger.warn(err);
				return;
			} else if (answer) {
				try {
					answer = JSON.parse(answer);
				} catch (e) {
					wsControl.build(req.ws, new Error("An error occured when communicating with Campus. lol."), null, req.refId);
					logger.warn('An error occured whon communicating with Campus OAuth. Response was: ' + answer);
					return;
				}
				var _url = answer.verification_url + '?q=verify&d=' + answer.user_code;
				logger.debug(_url);
				wsControl.build(req.ws, null, {
					message: "Please visit the provided url.",
					url: _url
				}, req.refId);
				var auth = false;
				var reqTime = 0;
				var timer = setInterval(function () {
					if (!auth && reqTime < answer.expires_in && req.ws.readyState === 1) {
						// poll
						postReqCampus('token', querystring.stringify({
							"client_id": config.login.l2p.clientID,
							"code": answer.device_code,
							"grant_type": "device"
						}), function (err, response) {
							if (err) {
								wsControl.build(req.ws, err, null, req.refId);
								logger.warn(err);
								return;
							} else if (response) {
								logger.debug(response);
								try {
									response = JSON.parse(response);
								} catch (e) {
									wsControl.build(req.ws, new Error("An error occured when communicating with Campus. lol."), null, req.refId);
									logger.warn('An error occured when communicating with Campus OAuth. Response was: ' + response);
								}
								if (response.status) {
									if (response.status === "ok") {
										// it's an access token. wuhsa!
										logger.debug(response);
										auth = true;
										clearInterval(timer);
										var gender = (Math.random() <= 0.5) ? 'male' : 'female';
										var _user = new User();
										avatarGenerator.generate(_user, gender, 70, function (err, avatar) {
											if (err) {
												logger.warn("User avatar could not be created");
											}
											_user.name = fancyNames.choose().replace(/\b(\w)/g, function (m) {
												return m.toUpperCase();
											});
											_user.avatar = avatar;
											_user.rwth.token = response.access_token;
											_user.rwth.refresh_token = response.refresh_token;
											_user.rwth.expires_in = response.expires_in;
											_user.save(function (err) {
												if (err) {
													wsControl.build(req.ws, err, null, req.refId);
													logger.warn(err);
													return;
												}
												if (req.session) {
													req.session.user = _user;
													sessionStore.set(req.sId, req.session, function (err) {
														if (err) {
															wsControl.build(req.ws, err, null, req.refId);
															return;
														}
														wsControl.build(req.ws, null, { status: true }, req.refId);
														// start a worker that fetches rooms.
														var worker = new userWorker(req.sId, req.session.user, req.ws, _user, wsControl, false);
														if (!workerMap[ req.sId ]) {
															workerMap[ req.sId ] = worker;
														} else {
															worker = workerMap[ req.sId ];
															worker.ws = req.ws; // this is necessary!
															worker.user = _user;
														}
														process.nextTick(function () {
															logger.info("starting new user worker.");
															worker.fetchRooms(); //start worker after this request.
														});
														logger.info("created new user.");
													});
												} else {
													wsControl.build(req.ws, new Error("Your req.session is invalid"), null, req.refId);
												}
											});
										});
									}
								} else {
									wsControl.build(req.ws, new Error("There was no status in Campus answer."), null, req.refId);
								}
							}
						});
					} else if (reqTime >= answer.expires_in) {
						wsControl.build(req.ws, new Error("Your authentication request failed. Please try again."), null, req.refId);
						clearInterval(timer);
					} else { // authenticated or connection was dumped
						clearInterval(timer);
					}
					reqTime += answer.interval;
				}, answer.interval * 1000);
				// Campus currently responds with 30 minutes polltime. srsly?
			} else {
				wsControl.build(req.ws, new Error("Campus Response not set."));
				logger.debug("Campus Response not set. Answer was " + answer); //yes, it must have been empty
			}
		});
	});


	wsControl.on("system:enterRoom", function (req) {
		if (req.authed && req.params.roomId !== undefined) {
            if (!workerMap[ req.sId ]) {
                var worker = new userWorker(req.sId, req.session.user, req.ws, req.session.user, wsControl, true);
                worker.session = req.session;
                workerMap[ req.sId ] = worker;
                worker.fetchRooms(function () {
                    worker.getRooms();
                });
            }
            var oldRoom = workerMap[ req.sId ].session.room;
            workerMap[ req.sId ].session.room = req.params.roomId;
			sessionStore.set(req.sId, workerMap[ req.sId ].session, function (err) {
				if (err) {
					wsControl.build(req.ws, err, null, req.refId);
				} else {
					var broadcastOld = function () {
						if (isNaN(oldRoom)) { 
							req.wss.getActiveUsersByRoom(oldRoom, function (err, count) {
								if (!err) {
									req.roomBroadcastAdmins(oldRoom, "room:userCount", { 
										roomId : oldRoom,
										count : count
									});
								} else {
									logger.warn(err);
								}
							});
						}
					};
					if (req.params.roomId == 1) {
						wsControl.build(req.ws, null, {
							status: true
						});
						broadcastOld();
					} else {
						panicDAO.isRoomRegistered({ _id: req.params.roomId }, function (isRegistered) {
							panicDAO.hasUserPanic(req.session.user, { _id: req.params.roomId }, function (err, panicEvent) {
								wsControl.build(req.ws, null, {
									status: true,
									hasRoomPanicRegistered: isRegistered,
									hasUserPanic: (panicEvent && !err) ? true : false
								}, req.refId);
							});
						});
						// broadcast new Room
						req.wss.getActiveUsersByRoom(req.params.roomId, function (err, count) {
							if (!err) {
								req.roomBroadcastAdmins(req.params.roomId, "room:userCount", { 
									roomId : req.params.roomId,
									count : count 
								});
							}
						});
						broadcastOld();	
					}
				}
			});
		} else {
			wsControl.build(req.ws, null, {
				status: false
			}, req.refId);
		}
	});

	wsControl.on("system:logout", function (req) {
        sessionStore.destroy(req.sId, function (err) {
            if (err) {
                wsControl.build(req.ws, new Error("Could not delete your req.session."), { status: false, message: "An error occured." }, req.refId);
                return logger.warn("could not delete req.session: " + err);
            }
            wsControl.build(req.ws, null, { status: true, message: "Goodbye." }, req.refId);
        });
	});

};

// @function
var postReqCampus = campus.postReqCampus;

module.exports.workerMap = workerMap;
module.exports.getWorkerMap = function () {
	return workerMap;
};

