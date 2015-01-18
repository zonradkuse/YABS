/**
   Websocket.js manages 
*/
var logger = require('./Logger.js');
var app = require('../server.js').app;
var rpc = require('./RPC/RPCHandler.js');
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
    logger.info('Initializing Websockets');
    var inter = rpc.getInterface();
    inter.data[0].func = function(params, callback){
        callback(null, {"data": "value"});
    }
    rpc.setInterface(inter);


    wss.on('connection', function(ws){
        
        cookieParser("schalala")(ws.upgradeReq, null, function(err) {
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
                
                if(session && session.cookie && session.sessionId){
                    logger.info('received : ' + message + ' from ' + session.sessionId);
                    /*
                    *   sanity check
                    *       let's look for parameters object and uri
                    */
                    if(cmd.parameters != undefined && cmd.uri != undefined){
                        //local calls by URI with Parameters.
                        rpc.call(cmd.uri, cmd.parameters, function(error, data){
                            if(error){
                                logger.warn('RPC: ' + error.message);
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
                                logger.info('sending ' + dt);
                                ws.send(JSON.stringify(dt)); //send the data
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

