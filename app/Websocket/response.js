var logger = require("../Logger.js");

function WebsocketResponse (request) {
	var self = this;
	this.request = request;
	this.reusable = false;
	this.authed = false;
	this.error = null;

	var roomBroadcast = function (uri, data, roomId, level) {
		self.request.wss.roomBroadcast(self.request.ws, uri, data, roomId, level);
	};

	this.setError = function (err) {
		self.error = err;
        return self;
	};

	this.send = function (data) {
        if (!data && !self.error) {
            logger.warn("empty message creation. somebody requested data that is not existing.");
            return self.setError(new Error("Not Found.")).send();
        }
		build(self.request.ws, self.error, data, self.request.refId);
		self.resetError();
		return self;
	};

	this.sendCommand = function (uri, data) {
		build(self.request.ws, self.error, null, null, uri, data);
		self.resetError();
		return self;
	};

	this.roomBroadcastAdmins = function (uri, data, roomId) {
		roomBroadcast(uri, data, roomId, 2);
		self.resetError();
		return self;
	};

	this.roomBroadcastUser = function (uri, data, roomId) {
		roomBroadcast(uri, data, roomId, 1);
		self.resetError();
		return self;
	};

	this.roomBroadcast = function (data) {
		self.request.wss.broadcast(data);
		self.resetError();
		return self;
	};

	this.resetError = function () {
		if (self.reusable) {
			self.error = null;
		}
		return self;
	};
}

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

module.exports = WebsocketResponse;
module.exports.build = build;
