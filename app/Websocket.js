/**
   Websocket.js manages
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

var wss = new WebSocketServer({
    server: app
});
wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        client.send(data);
    });
};

var WebsocketHandler = function() {
    events.EventEmitter.call(this);
    var self = this;
    this.start = function(){
        logger.info('Initializing Websockets');
        logger.info("Initializing Local Interface and function attaching");
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
                    logger.info('received new message from ' + ws.upgradeReq.connection.remoteAddress + ' : ' + message);
                    // lets process the message.
                    // check if uri is existing
                    try{
                        message = JSON.parse(message);
                    } catch(e){
                        ws.send(e);
                        return;
                    }
                    if(message.uri){
                        logger.info('calling ' + message.uri)
                        for(var i = 0; i<interf.data.length; i++){
                            if(interf.data[i].uri === message.uri){ //uri exists
                                if(message.parameters){ //parameters set
                                    var obj = interf.data[i].parameters;
                                    var c = 0;
                                    for(var key in obj){ // check structure
                                        //check if interface is made like specified in the interface file.
                                        if(key !== Object.getOwnPropertyNames(message.parameters)[c]) {
                                            ws.send(JSON.stringify({error:"missing or bad parameter."}));
                                            return;
                                        }
                                        c += 1;
                                    }
                                    /** whoa. that has been a lot of checks. now emit the event. Optionals need
                                     *  to be checked by the event handler. They will maybe build into the interface
                                    **/
                                    self.emit(message.uri, wss, ws, session, message.parameters, interf.data[i]);
                                    return;
                                }
                            }
                        }
                        ws.send(JSON.stringify({error:"uri not existing."}));
                    } else {
                        ws.send(JSON.stringify({error:"missing parameter."}));
                    }
                    //check if message.parameters structure is same or if optional
                    //local.checkAndCall(session, ws, wss, message);
                });
    
            });
        });
    };
};

util.inherits(WebsocketHandler, events.EventEmitter);
//WebsocketHandler.prototype.__proto__ = events.EventEmitter.prototype; //__proto__ maybe deprecated. use if problem with inherits
module.exports = WebsocketHandler;