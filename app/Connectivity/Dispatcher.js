/**
 * Websocket.js manages the websocket events emittet by einaros/ws. It also checks
 * if the called uri is okay and emits those events for easy handling.
 * @module Websocket
 */

var logger = require('./../Logger.js');
var config = require('../../config.json');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
var interf = require('./RPC/LocalInterface.js');
sessionStore = new sessionStore();
var util = require('util');
var events = require('events');
var accessManager = require('./../AccessManagement.js');
var websocketRequest = require('./Websocket/request.js');
var websocketResponse = require('./Websocket/response.js');
var dispatchRequestAdapter = require('./DispatchRequestAdapter.js');

// ------------ begin WebsocketHandler Object extending EventEmitter.
/** Dispatcher catching websocket and restful events
 * @constructor
 */
var Dispatcher = function (wss, app) {
	events.EventEmitter.call(this);
	var self = this;
	this.start = function () {
        if (!wss) {
            throw new Error("wss not yet initialized!");
        }
		logger.info('Initializing Websockets');

		websocketHandling.call(self, wss);
		restHandling.call(self, app, wss);
	};
};

function restHandling (app, wss) {
	var self = this;

	app.all('/api/*', function (req, res, next) {
		defaultMessageProcessing.call(self, new dispatchRequestAdapter(null, { wss : wss }, { req : req, res : res }));
	});
}

function websocketHandling (wss) {
	var self = this;
	wss.on('connection', function (ws) {
		// Upgrade ws to request in order to get the user out of session
		cookieParser(config.general.cookie.secret)(ws.upgradeReq, null, function (err) {
			var session;
			var sessionID = ws.upgradeReq.signedCookies[ "connect.sid" ];
			sessionStore.get(sessionID, function (err, sess) {
				var message = {};
				message.uri = "system:open";
				var req = new websocketRequest(message, sess, new dispatchRequestAdapter(null, { ws : ws, wss : wss }, null));
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

				defaultMessageProcessing.call(self, new dispatchRequestAdapter(message, { ws : ws, wss : wss }, null));

			});
			ws.on('close', function (code, message) {
				// emit the close event and give some more information.
				sessionStore.get(ws.upgradeReq.signedCookies[ "connect.sid" ], function (err, sess) {
					var req = new websocketRequest(message, sess, new dispatchRequestAdapter(null, { ws : ws, wss : wss }, null));
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
}

function defaultMessageProcessing (dispatchRequest) {
	var self = this;
	var message = dispatchRequest.message;
	try {
		message = (typeof message === 'object' ? message : JSON.parse(dispatchRequest.message));
	} catch (e) {
		return dispatchRequest.send(self.build(dispatchRequest.ws, new Error("no valid json or not a string"), null, message.refId));
	}
	sessionStore.get(dispatchRequest.sessionId, function (err, sess) {
		var req = new websocketRequest(message, sess, dispatchRequest);
		var res = new websocketResponse(req);
		if (err) {
			logger.warn(err);
			return res.setError(new Error("Could not get session from store")).send();
		} else if (sess) {
			if (message && message.uri) {
				for (var i = 0; i < interf.data.length; i++) {
					if (interf.data[ i ].uri === message.uri && message.parameters) {
						var obj = interf.data[ i ].parameters;
						for (var key in obj) { // check structure
							//check if interface is made like specified in the interface file.
							if (typeof message.parameters === 'object' && !(key in message.parameters) && !message.parameters[ key ]) {
								return res.setError(new Error("missing or bad parameter.")).send();
							}
						}
						/*
						 * whoa. that have been a lot of checks. now emit the event. Optionals need
						 *  to be checked by the event handler. They will maybe build into the interface
						 */

						/*jshint -W083 */
						accessManager.checkAccessBySId(req.uri, req.sId, req.params.roomId, function (err, access, accessLevel) {
							req.accessLevel = accessLevel;
							logger.debug("accesslevel: " + accessLevel +  " access: " + access);
							if (access) {
								logger.info('emitted ' + message.uri + ' WSAPI event.');
								self.emit(message.uri, req, res);
							} else {
								logger.warn("Detected unprivileged access try by user " + req.sId);
							}
						});
						return;
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
}

util.inherits(Dispatcher, events.EventEmitter);
module.exports = Dispatcher;

