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
var auth = require('../Authentication/Authentication.js');

module.exports = function (wsControl) {
	infoCalls(wsControl);
	roomEntrance(wsControl, workerMap);

	wsControl.on('system:close', function (req, res) {
		//workerMap[req.sId].stop();
		logger.info("a client disconnected.");
		process.nextTick(function () {
			logger.debug("disconnected client workerMap entry: " + workerMap[ req.sId ]);
			delete workerMap[ req.sId ];
		});
        if (req.session && isNaN(req.session.room)) {
            req.wss.getActiveUsersByRoom(req.session.room, function (err, count) {
                if (!err) {
                    res.roomBroadcastAdmins("room:userCount", {
                        roomId: req.session.room,
                        count: count
                    }, req.session.room);
                } else {
                    logger.warn(err);
                }
            });
        }
		res.send("Goodbye");
	});

	wsControl.on('system:open', function (req, res) {
		logger.info("new client arrived.");
		res.send({ message: 'welcome' });
		process.nextTick(function () {
			setTimeout(function () {
				if (req.session && req.session.user && req.session.user._id) {
					UserModel.get(req.session.user._id, function (err, _user) {
						var worker = new userWorker(req, res, _user, true);
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
    
	wsControl.on('system:login', function (req, res) {
		postReqCampus('code', querystring.stringify({
			"client_id": config.login.l2p.clientID,
			"scope": config.login.l2p.scope
		}), function (err, answer) {
			if (err) {
				res.setError(err).send();
				logger.warn(err);

			} else if (answer) {
				try {
					answer = JSON.parse(answer);
				} catch (e) {
					res.setError(new Error("An error occured when communicating with Campus. lol.")).send();
					logger.warn('An error occured whon communicating with Campus OAuth. Response was: ' + answer);
					return;
				}
				var _url = answer.verification_url + '?q=verify&d=' + answer.user_code;
				logger.debug(_url);
				res.send({
					message: "Please visit the provided url.",
					url: _url
				});
				var auth = false;
				var reqTime = 0;
				var timer = setInterval(function () {
					if (!auth && reqTime < answer.expires_in) {
						// poll
						postReqCampus('token', querystring.stringify({
							"client_id": config.login.l2p.clientID,
							"code": answer.device_code,
							"grant_type": "device"
						}), function (err, response) {
							if (err) {
								res.setError(err).send();
								logger.warn(err);

							} else if (response) {
								logger.debug(response);
								try {
									response = JSON.parse(response);
								} catch (e) {
									res.setError(new Error("An error occured when communicating with Campus. lol.")).send();
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
													res.setError(err).send();
													logger.warn(err);
													return;
												}
												if (req.session) {
													req.session.user = _user;
													sessionStore.set(req.sId, req.session, function (err) {
														if (err) {
															res.setError(err).send();
															return;
														}
														res.send({ status: true });
														// start a worker that fetches rooms.
														var worker = new userWorker(req, res, _user, false);
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
													res.setError(new Error("Your req.session is invalid")).send();
												}
											});
										});
									} else {
										logger.info("Bad answer: " + response.status);
										clearInterval(timer);
										return res.setError(new Error ("Bad answer: " + response.status)).send();
									}
								} else {
									res.setError(new Error("There was no status in Campus answer.")).send();
								}
							}
						});
					} else if (reqTime >= answer.expires_in) {
						res.setError(new Error("Your authentication request failed. Please try again.")).send();
						clearInterval(timer);
					} else { // authenticated or connection was dumped
						clearInterval(timer);
					}
					reqTime += answer.interval;
				}, answer.interval * 1000);
				// Campus currently responds with 30 minutes polltime. srsly?
			} else {
				res.setError(new Error("Campus Response not set.")).send();
				logger.debug("Campus Response not set. Answer was " + answer); //yes, it must have been empty
			}
		});
	});

	wsControl.on("system:logout", function (req, res) {
        sessionStore.destroy(req.sId, function (err) {
            if (err) {
                res.setError(new Error("Could not delete your req.session.")).send();
                return logger.warn("could not delete req.session: " + err);
            }
            res.send({ status: true, message: "Goodbye." });
        });
	});

	wsControl.on("local:login", function (req, res) {
		auth.loginLocal(req.params.email, req.params.password, function (err, user) {
			req.session.user = JSON.parse(JSON.stringify(user.toObject()));
            req.saveSession();
            return res.send(user);
		}, function (err) {
            return res.setError(err).send();
		});
	});

	wsControl.on("local:register", function (req, res) {
		auth.registerLocal(req.params.name, req.params.password, req.params.email, function (err, user) {
			if (err) {
				return res.setError(err).send();
			} else {
				// we should verify the email address
				return res.send(user);
			}
		});
	});

};

// @function
var postReqCampus = campus.postReqCampus;

module.exports.workerMap = workerMap;
module.exports.getWorkerMap = function () {
	return workerMap;
};

