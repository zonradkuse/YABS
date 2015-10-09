function WebsocketResponse (request, build) {
	var self = this;
	this.request = request;

	this.authed = false;
	this.error = null;

	this.setError = function (err) {
		self.error = err;
        return self;
	};

	this.send = function (data) {
        if (!data && !self.error) {
            throw new Error("Empty Message creation.");
        }
		build(self.request.ws, self.error, data, self.request.refId);
		return self;
	};

	this.sendCommand = function (uri, data) {
		build(self.request.wss, self.error, null, null, uri, data);
		return self;
	};

	this.roomBroadcastAdmins = function (roomId, uri, data) {
		self.request.wss.roomBroadcast(self.request.ws, uri, data, roomId, 2);
		return self;
	};

	this.roomBroadcastUser = function (roomId, uri, data) {
		self.request.wss.roomBroadcast(self.request.ws, uri, data, roomId, 1);
		return self;
	};

	this.roomBroadcast = function (data) {
		self.request.wss.broadcast(data);
		return self;
	};
}

module.exports = WebsocketResponse;