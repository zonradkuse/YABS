module.exports = function DispatchRequestAdapter (message, ws, rest) {
    if (ws && rest) {
        throw new Error("Whooops, ws and app can not be set at the same time.")
    }
    this.preHook = this.postHook = noop;

    if (ws) {
        this.remoteAddress = ws.ws.upgradeReq.connection.remoteAddress;
        this.send = ws.ws.send;
        this.sessionId = ws.ws.upgradeReq.signedCookies[ "connect.sid" ];
        this.message = message;
        this.ws = ws.ws;
        this.wss = ws.wss;
    } else if (rest) {
        this.used = false;
        this.remoteAddress = rest.req.ip;
        this.send = function (message ) {
            rest.res.send(message);
        };
        this.sessionId = rest.req.sessionID;
        this.rest = rest;

        // parameter ordering:  1. url is only uri identifier
        //                      2. /uri?identifier2=value2
        //                      3. body json text, this is most important, 2 is less important thus and can be overridden by 3.

        var urlSplit = rest.req.params[0].split('/');
        this.message = {
            uri : urlSplit[0],
            refId : urlSplit[1],
            parameters : {}
        };

        for (var key in rest.req.query) {
            this.message.parameters[key] = rest.req.query[key];
        }

    } else {
        throw new Error("Not all cases were catched. Check request methods.")
    }
    // remoteAdress
    // session
    // sessionId
    // send
    // preHook
    // postHook
};

function noop () {}