/**
   Websocket.js manages 
*/
var logger = require('./Logger.js');
var app = require('../server.js').app;
var interface = require('./RPC/InterfaceHandler.js');
var config = require('../config.json');
var WebSocketServer = require('ws').Server
var cookieParser = require('cookie-parser');
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
sessionStore = new sessionStore();

/**
   this function will be called on initialization.
*/
module.exports = function (app){
    var wss = new WebSocketServer({ server:app });
    wss.broadcast = function broadcast(data) {
        wss.clients.forEach(function each(client) {
            client.send(data);
        });
    };      
    logger.info('Initializing Websockets');
    /*var inter = interface.getInterface();
    inter.data[0].func = function(params, callback){
        callback(null, {"data": "value"});
    }
    interface.setInterface(inter);*/
    interface.attachFunction('vote',function(params, callback){
            callback(null, {"data": "value"});
        }, function(err){throw err} );


    wss.on('connection', function(ws){
        
        cookieParser(config.general.cookie.secret)(ws.upgradeReq, null, function(err) {
            var session;
            sessionID = ws.upgradeReq.signedCookies["connect.sid"];
            sessionStore.get(sessionID, function(err, sess) {
                if(err) ws.send(err); // TODO HANDLE ERROR CORRECTLY
                session = sess;
                
            });
            
            //check for binary data
            //parse message string and call the attached functions in the interface
            ws.on('message', function(message){
                var cmd;
                try{
                    cmd = JSON.parse(message);
                }catch(e){
                    logger.info(e + '  ' + message + " is not valid json.");
                    cmd = {};
                }
                
                if((session && session.cookie && session.sessionId) || cmd.sudo){
                    logger.info('received : ' + message + ' from ' + ws.upgradeReq.connection.remoteAddress);
                    /*
                    *   sanity check
                    *       let's look for parameters object and uri
                    */
                    if(cmd.parameters != undefined && cmd.uri != undefined){
                        //local calls by URI with Parameters.
                        //standard request interface call.
                        interface.call(cmd.uri, cmd.parameters, function(error, data){
                            if(error){
                                logger.warn('Incoming RPC with URI ' + cmd.uri + ' caused problem : ' + error.message);
                                dt = {
                                    'data' : '',
                                    'error' : error.message,
                                    'refId' : cmd.refId
                                }
                                ws.send(JSON.stringify(dt)); //send the data
                            }else{
                                dt = {
                                    'data' : data,
                                    'error' : '',
                                    'refId' : cmd.refId
                                }
                                if (cmd.broadcast) { //F*CKING CHECK THAT!
                                    wss.broadcast(JSON.stringify(dt));
                                } else{
                                    ws.send(JSON.stringify(dt)); //send the data
                                }
                                logger.info('Successful RPC Request ' + JSON.stringify(cmd) + ' and Response ' + JSON.stringify(dt));
                            }
                        });
                    }
                }else{
                    ws.send(JSON.stringify({"data":"","error":"Not Authenticated","refId":cmd.refId ? cmd.refId : ""}))
                }
            });
        
        }); 
    });
}

