/**
   Websocket.js manages 
*/
var logger = require('./Logger.js');
var app = require('../server.js').app;
var rpc = require('./RPC/RPCHandler.js');
var WebSocketServer = require('ws').Server


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
        ws.send("Welcome");
        parseCookie(ws.upgradeReq, null, function(err) {
            var sessionID = ws.upgradeReq.cookies['sid'];
            ws.send("Your Session ID is: " + sessionID);
        }); 
        //check for binary data
        //parse message string and call the attached functions in the interface
        ws.on('message', function(message){
            logger.info('received: ' + message);
            var cmd;
            try{
                cmd = JSON.parse(message);
            }catch(e){
                logger.info(e + "\n'" + message + "' is not valid json.");
                cmd = {};
            }

            /*
            *   sanity check
            *       let's look for parameters object and uri
            */
            if(cmd.parameters != undefined && cmd.uri != undefined){
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
        });

    });



}

