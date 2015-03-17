/**
 *  Websocket.js manages the websocket events emittet by einaros/ws. It also checks
 *   if the called uri is okay and emits those events for easy handling.
 */
var logger = require('./Logger.js');
var local = require('./RPC/Local.js');
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


// ------------- begin Websocket Server init with helper functions

var wss = new WebSocketServer({
    server: app
});

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        client.send(data);
    });
};
wss.roomBroadcast = function (data, roomId, refId){
    wss.clients.forEach(function each(client){
        //check if user is currently active room member.
        var sId = client.upgradeReq.signedCookies["connect.sid"];
        sessionStore.get(sId, function(err, sess){
            if(err) logger.warn("An error occured on getting the user session: " + err);
            if(sess.room){
                if(session.room === roomId){
                    WebsocketHandler.build(client, data, refId);
                }
            } else {
                logger.warn("A room was unset in session: " + session);
                WebsocketHandler.build(client, new Error("Your current room is not set."));
            }
        });
    });
};

// ------------ begin WebsocketHandler Object extending EventEmitter.
var WebsocketHandler = function() {
    events.EventEmitter.call(this);
    var self = this;
    this.start = function(){
        logger.info('Initializing Websockets');
        //logger.info("Initializing Local Interface and function attaching");
        //local();
        wss.on('connection', function(ws) {
            // Upgrade ws to request in order to get the user out of session
            cookieParser(config.general.cookie.secret)(ws.upgradeReq, null, function(err) {
                var session;
                sessionID = ws.upgradeReq.signedCookies["connect.sid"];
                sessionStore.get(sessionID, function(err, sess) {
                    if (err) ws.send(err); // TODO HANDLE ERROR CORRECTLY
                    session = sess;
                    self.emit('system:open', wss, ws, session, ws.upgradeReq.signedCookies["connect.sid"]);
                });
                //check for binary data
                //parse message string and call the attached functions in the interface
                ws.on('message', function(message) {
                    logger.debug('received new message from ' + ws.upgradeReq.connection.remoteAddress + ' : ' + message);
                    // lets process the message.
                    // check if uri is existing
                    try{
                        message = (typeof message === 'object' ? message : JSON.parse(message));
                    } catch(e){
                        ws.send(self.build(ws, new Error("no valid json or not a string"), null, message.refId));
                        return;
                    }
                    if(message && message.uri){
                        for(var i = 0; i<interf.data.length; i++){
                            if(interf.data[i].uri === message.uri){ //uri exists
                                if(message.parameters){ //parameters set
                                    var obj = interf.data[i].parameters;
                                    var c = 0;
                                    for(var key in obj){ // check structure
                                        //check if interface is made like specified in the interface file.
                                        if(key !== Object.getOwnPropertyNames(message.parameters)[c]) {
                                            ws.send(self.build(new Error("missing or bad parameter."), null, message.refId));
                                            return;
                                        }
                                        c += 1;
                                    }
                                    /**
                                     * whoa. that have been a lot of checks. now emit the event. Optionals need
                                     *  to be checked by the event handler. They will maybe build into the interface
                                    **/
                                    self.emit(message.uri, wss, ws, session, message.parameters,
                                        interf.data[i], message.refId, ws.upgradeReq.signedCookies["connect.sid"]);
                                    logger.info('emitted ' + message.uri + ' WSAPI event.');
                                    return;
                                }
                            }
                        }
                        ws.send(self.build(ws, new Error("uri not existing."), null, message.refId));
                    } else {
                        ws.send(self.build(ws, new Error("missing parameter."), null, message.refId));
                    }
                    //check if message.parameters structure is same or if optional
                    //local.checkAndCall(session, ws, wss, message); //deprecated
                });
                ws.on('close', function(code, message){
                    // emit the close event and give some more information.
                    self.emit('system:close', ws, ws.upgradeReq.signedCookies["connect.sid"]);
                });
                ws.on('error', function(err){
                    logger.warn("An error occured on socket connection. " + err); // TODO What to handle here?
                });
            });
        });
    };
    // build the response object as string
    this.build = function(ws, err, data, refId, uri, param){
        if(!ws || !ws.send) throw new Error("Websocket not set.");
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
                "parameters": param,
            };
        }
        ws.send(JSON.stringify(json));
    };
};

util.inherits(WebsocketHandler, events.EventEmitter);
module.exports = WebsocketHandler;