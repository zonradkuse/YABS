function WebsocketRequest (message, session, dispatchRequest) {
	this.authed = session && session.user && session.user._id;
	this.user = session ? session.user : null;
	this.session = session;
	this.uri = message.uri;
	this.wss = dispatchRequest.wss;
	this.ws = dispatchRequest.ws;
	this.params = message.parameters;
	this.refId = message.refId;
	this.sId = dispatchRequest.sessionId;
	this.userId = this.session && this.session.user ? this.session.user._id : null;
	this.adapter = dispatchRequest;
	if (this.ws && this.wss) {
		this.isWebsocket = true;
	} else {
		this.isWebsocket = false;
	}

	if (dispatchRequest.rest) {
		this.isRestful = true;
	} else {
		this.isRestful = false;
	}
}

module.exports = WebsocketRequest;
