/**
 * Websocket.js manages the websocket events emittet by einaros/ws. It also checks
 * if the called uri is okay and emits those events for easy handling.
 * @module Websocket
 */
var logger = require('./Logger.js');
var config = require('../config.json');
var app = require('../server.js').app;
var WebSocketServer = require('ws').Server;
var cookieParser = require('cookie-parser');
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
var interf = require('./RPC/LocalInterface.json');
sessionStore = new sessionStore();
var util = require('util');
var events = require('events');
var roomWSControl = require('./WebsocketAPI/Room.js');
var accessManager = require('./AccessManagement.js');
var websocketRequest = require('./Websocket/request.js');
var websocketResponse = require('./Websocket/response.js');

// ------------- begin Websocket Server init with helper functions
var wss = new WebSocketServer({
	server: app
});

/** Send a broadcast to all clients.
 * @param {Object} data - data which should have sent to the user
 */
wss.broadcast = function broadcast(data) {
	wss.clients.forEach(function each(client) {
		client.send(data);
	});
};

/** Count all active users.
 * @memberof! wss#
 * @returns {Number} count of users
 */
wss.getActiveUsers = function () {
	return wss.clients.length;
};

/** Count active users of a room.
 * @returns {Number} count of users
 * @todo async count
 */
wss.getActiveUsersByRoom = function (roomId, next) {
	var c = 0;
	var _countFunc = function (p) {
		sessionStore.get(wss.clients[ p ].upgradeReq.signedCookies[ "connect.sid" ], function (err, sess) {
			if (err) {
				next(err);
			}
			if (sess && sess.room && sess.room == roomId) {
				c++;
			}
			if (p === 0) { // this is bad and i should feel bad.
				next(null, c);
			}
		});
	};
	for (var i = wss.clients.length - 1; i >= 0; i--) {
		var pos = i;
		(_countFunc)(pos);
	}
};

/** Send a broadcast to all users in a room.
 * @param {Websocket} ws - ws object of initiator
 * @param {String} uri - rpc uri
 * @param {Object} data - data which should have sent to the user
 * @param {ObjectId} roomId - ObjectId of target room
 */
wss.roomBroadcast = function (ws, uri, data, roomId, accessLevel) {
	var oldQ;
	if (data && data.question) {
		oldQ = JSON.parse(JSON.stringify(data.question));
	}
	wss.clients.forEach(function each(client) {
		//check if user is currently active room member.
		var sId = client.upgradeReq.signedCookies[ "connect.sid" ];
		sessionStore.get(sId, function (err, sess) {
			if (err) {
				return logger.err("An error occurred on getting the user session: " + err);
			}
			if (sess) {
				if (sess.room) {
					if (sess.room == roomId) {
						if (data.question) {
							data.question = JSON.parse(JSON.stringify(oldQ));
							data.question.hasVote = roomWSControl.createVotesFields(sess.user, data.question).hasVote;
							logger.debug(data.question);
						}
						if (accessLevel) {
							accessManager.checkAccessLevel(sId, { requiredAccess : accessLevel }, roomId, function (err, access) {
								build(client, null, null, null, uri, data);
							});
						} else {
							logger.debug("broadcast message to " + sess.user._id);
							build(client, null, null, null, uri, data);
						}
					}
				} else {
					build(ws, new Error("Your current room is not set."));
				}
			} else {
				logger.warn("There is a sessionId without a session. sId: " + sId + 
					" session: " + JSON.stringify(sess) + " data to be sent: " + JSON.stringify(data));
			}
		});
	});
};

/** Send a broadcast to all users, in a room, which have a required access level or higher.
 * @param {Websocket} ws - ws object of initiator
 * @param {String} uri - rpc uri
 * @param {Object} data - data which should have sent to the user
 * @param {ObjectId} roomId - ObjectId of target room
 * @param {Object} options - options
 * @param {Boolean} options.requiredAccess - equals true then user must have this access level or higher
 * @param {Boolean} [options.roomMember] - equals true then user have to be active room member
 */
wss.roomAccessLevelBroadcast = function (ws, uri, data, roomId, options) {
	var oldQ;
	if (data.question) {
		oldQ = JSON.parse(JSON.stringify(data.question));
	}
	wss.clients.forEach(function each(client) {
		var sId = client.upgradeReq.signedCookies[ "connect.sid" ];
		accessManager.checkAccessLevel(sId, options, roomId, function (err, access) {
			if (err) {
				// just terminate
				return;
			}
			if (access) {
				if (data.question) {
					data.question = JSON.parse(JSON.stringify(oldQ));
					data.question.hasVote = roomWSControl.createVotesFields(sess.user, data.question).hasVote;
				}
				build(client, null, null, null, uri, data);
			} else {
				if (ws === client) {
					build(ws, new Error("Access denied."));
				}
			}

		});
	});
};

// ------------ begin WebsocketHandler Object extending EventEmitter.
/** Handler for websockets. Receive requests, check uri and parameters of rpc event, etc.
 * @constructor
 */
var WebsocketHandler = function () {
	events.EventEmitter.call(this);
	var self = this;
	this.start = function () {
		logger.info('Initializing Websockets');
		//logger.info("Initializing Local Interface and function attaching");
		//local();
		wss.on('connection', function (ws) {
			// Upgrade ws to request in order to get the user out of session
			cookieParser(config.general.cookie.secret)(ws.upgradeReq, null, function (err) {
				var session;
				var sessionID = ws.upgradeReq.signedCookies[ "connect.sid" ];
				sessionStore.get(sessionID, function (err, sess) {
					var message = {};
					message.uri = "system:open";
					var req = new websocketRequest(message, sess, ws, wss);
					var res = new websocketResponse(req);
					if (err) {	
						return res.setError(new Error("Error on session init.")).send(); // TODO HANDLE ERROR CORRECTLY
					}
					self.emit('system:open', req, res);
				});
				//check for binary data
				//parse message string and call the attached functions in the interface
				ws.on('message', function (message) {
					logger.debug('received new message from ' + ws.upgradeReq.connection.remoteAddress + ' : ' + message);
					// lets process the message.
					// check if uri is existing
					try {
						message = (typeof message === 'object' ? message : JSON.parse(message));
					} catch (e) {
						return ws.send(self.build(ws, new Error("no valid json or not a string"), null, message.refId));
					}
					sessionStore.get(ws.upgradeReq.signedCookies[ "connect.sid" ], function (err, sess) {
						var req = new websocketRequest(message, sess, ws, wss);
						var res = new websocketResponse(req);
						if (err) {
							logger.warn(err);
							return res.setError(new Error("Could not get session from store")).send();
						} else if (sess) {
							if (message && message.uri) {
								for (var i = 0; i<interf.data.length; i++) {
									if (interf.data[ i ].uri === message.uri) { //uri exists
										if (message.parameters) { //parameters set
											var obj = interf.data[ i ].parameters;
											var c = 0;
											for (var key in obj) { // check structure
												//check if interface is made like specified in the interface file.
												if (typeof message.parameters === 'object' && !(key in message.parameters)) {
													return self.build(ws, new Error("missing or bad parameter."), null, message.refId);
												}
												c += 1;
											}
											/**
	                                         * whoa. that have been a lot of checks. now emit the event. Optionals need
	                                         *  to be checked by the event handler. They will maybe build into the interface
	                                        **/

											/*jshint -W083 */
											accessManager.checkAccessBySId(req.uri, req.sId, req.params.roomId, function (err, access, accessLevel) {
												req.accessLevel = accessLevel;
												logger.debug("accesslevel: " + accessLevel +  " access: " + access);
												if (access) {
													self.emit(message.uri, req, res);
													logger.info('emitted ' + message.uri + ' WSAPI event.');
												} else {
													logger.warn("Detected unprivileged access try by user " + req.sId);
												}
											});
											return;
										}
									}
								}
								res.setError(new Error("uri not existing.")).send();
							} else {
								res.setError(new Error("missing parameter.")).send();
							}
						} else {
							res.setError(new Error("Your session is invalid.")).send();
						}
					});
					
					//check if message.parameters structure is same or if optional
					//local.checkAndCall(session, ws, wss, message); //deprecated
				});
				ws.on('close', function (code, message) {
					// emit the close event and give some more information.
                    sessionStore.get(ws.upgradeReq.signedCookies[ "connect.sid" ], function (err, sess) {
                        var req = new websocketRequest(message, sess, ws, wss);
                        var res = new websocketResponse(req);
                        if (err) {
                            return res.setError(ws, new Error("Error on session init.")).send(); // TODO HANDLE ERROR CORRECTLY
                        }
                        self.emit('system:close', req, res);
                    });
				});
				ws.on('error', function (err) {
					logger.warn("An error occured on socket connection. " + err); // TODO What to handle here?
				});
			});
		});
	};
	// build the response object as string
	this.build = function (ws, err, data, refId, uri, param) {
		build(ws, err, data, refId, uri, param);
	};
};

/** Build a json object for a response or a broadcast, which will be send via websocket.
 * @param {Websocket} ws - websocket of receiver
 * @param {Error} err - if an error should be send, otherwise null
 * @param {Object} data - data
 * @param {String} refId - refId of request, when needed
 * @param {String} uri - rpc uri
 * @param {Object} param - parameters for a broadcast
 */
function build(ws, err, data, refId, uri, param) {
	if (!ws || !ws.send) {
		throw new Error("Websocket not set.");
	}
	var json = {};
	if (refId || !uri) { // response
		json = {
			"error": (err ? err.message : null),
			"data": data,
			"refId": refId
		};
	} else { // broadcast TODO
		json = {
			"error": (err ? err.message : null),
			"uri": uri,
			"parameters": param
		};
	}
	json.status = (err || !data ? false : true); // if error occured set statulocals false, else true
	
	if (ws.readyState === 1) {
        logger.debug("Sending message: " + JSON.stringify(json));
		ws.send(JSON.stringify(json)); // TODO here we should do some queueing
	} else {
		// here should go logic for queuing messages for users.
		logger.info("A client disconnected but should receive a message.");
	}
}


util.inherits(WebsocketHandler, events.EventEmitter);
module.exports = WebsocketHandler;
