function WebsocketResponse (request, build) {
	var self = this;
	this.request = request;

	this.authed = false;
	this.error = null;

	this.setError = function (err) {
		res.error = err;
        return res;
	};

	this.send = function (data) {
        if (!data && !self.error) {
            throw new Error("Empty Message creation.");
        }
		build(self.request.ws, self.error, data, self.request.refId);
	};

	this.sendCommand = function (uri, data) {
		build(self.request.wss, self.error, null, null, uri, data);
	};

	this.roomBroadcastAdmins = function (roomId, uri, data) {
		self.request.wss.roomBroadcast(self.request.ws, uri, data, roomId, 2);
	};

	this.roomBroadcastUser = function (roomId, uri, data) {
		self.request.wss.roomBroadcast(self.request.ws, uri, data, roomId, 1);
	};

	this.roomBroadcast = function (data) {
		self.request.wss.broadcast(data);
	};
}

module.exports = WebsocketResponse;