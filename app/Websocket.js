/**
   Websocket.js manages
*/
var logger = require('./Logger.js');
var app = require('../server.js').app;
var local = require('./RPC/Local.js');
var config = require('../config.json');
var WebSocketServer = require('ws').Server
var cookieParser = require('cookie-parser');
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
sessionStore = new sessionStore();

/**
   this function will be called on initialization.
*/
module.exports = function(app) {
    logger.info('Initializing Websockets');
    var wss = new WebSocketServer({
        server: app
    });
    wss.broadcast = function broadcast(data) {
        wss.clients.forEach(function each(client) {
            client.send(data);
        });
    };
    logger.log("Initializing Local Interface and function attaching");
    local();
    wss.on('connection', function(ws) {
        // Upgrade ws to request in order to get the user out of session
        cookieParser(config.general.cookie.secret)(ws.upgradeReq, null, function(err) {
            var session;
            sessionID = ws.upgradeReq.signedCookies["connect.sid"];
            sessionStore.get(sessionID, function(err, sess) {
                if (err) ws.send(err); // TODO HANDLE ERROR CORRECTLY
                session = sess;

            });

            //check for binary data
            //parse message string and call the attached functions in the interface
            ws.on('message', function(message) {
                logger.info('received new message from ' + ws.upgradeReq.connection.remoteAddress);
                // lets process the message.
                local.checkAndCall(session, ws, wss, message);
            });

        });
    });
}