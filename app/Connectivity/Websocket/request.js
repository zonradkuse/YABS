var session = require('express-session');
var sessionStore = require('connect-redis')(session);
var sessionStore = new sessionStore();

function Request(message, session, dispatchRequest) {
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

Request.prototype.saveSession = function () {
    var self = this;
    sessionStore.get(self.sId, function (err, session) {
        if (err) {
            // take notice
            return;
        }

        // copy keys of new session
        for (var key in self.session) {
            session[ key ] = self.session[ key ];
        }

        sessionStore.set(self.sId, self.session);
    });
};

module.exports = Request;
