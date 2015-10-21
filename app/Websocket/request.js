function WebsocketRequest (message, session, ws, wss) {
	this.authed = session && session.user && session.user._id;
	this.user = session ? session.user : null;
	this.session = session;
	this.uri = message.uri;
	this.wss = wss;
	this.ws = ws;
	this.params = message.parameters;
	this.refId = message.refId;
	this.sId = ws.upgradeReq.signedCookies[ "connect.sid" ];
	this.userId = this.session && this.session.user ? this.session.user._id : null;
}

module.exports = WebsocketRequest;
