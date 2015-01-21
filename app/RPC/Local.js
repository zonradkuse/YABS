/**
* Here goes all the stuff that shall be done by the local interface implementation.
*   In specific this is:
*   Attaching business logic to the Interface object
*   Providing a bunch of checks like
*       access rights to the provided URI (e.g. vote can only be called on questions that are in users scope)
*/
var logger = require('./../Logger.js');
var interface = require('./InterfaceHandler.js');
var config = require('./../../config.json');

function checkAndCall(session, ws, wss, message){
    var cmd;
    try{
        cmd = JSON.parse(message);
    }catch(e){
        logger.warn(e + ': ' + message + " is not valid json.");
        cmd = {};
    }
    logger.info("checking session");
    if((session && session.cookie && session.sessionId) || (cmd.sudo && config.general.env.dev)){
        if(!cmd.sudo){
            logger.info("Accepted Request from user with sessionId " + session.sessionId);
        }
        /*
        *   sanity check
        *       let's look for parameters object and uri
        */
        if(cmd.parameters != undefined && cmd.uri != undefined){
            //local calls by URI with Parameters
            //standard request interface call.
            interface.call(cmd.uri, cmd.parameters, function(error, data){
                //---- logic for sending previously processed data to the client
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
        } else if(cmd.uri === undefined){
            ws.send(JSON.stringify({"data":"","error":"uri undefined","refId":cmd.refId ? cmd.refId : ""}));
        } else if(cmd.parameters === undefined){
            ws.send(JSON.stringify({"data":"","error":"parameters undefined","refId":cmd.refId ? cmd.refId : ""}))
        }
    }else{
        ws.send(JSON.stringify({"data":"","error":"Not Authenticated","refId":cmd.refId ? cmd.refId : ""}));
    }
}

/**
* Attaches functions to the Interface.
*/
function init(){
    interface.attachFunction('vote',function(params, callback){
            //mark that user already voted for the question
            //vote is broadcast so call the upvote of the remote client
            callback(null, { "status": true, "params" : params});
        }, function(err){throw err} );
    interface.attachFunction('getLogs', function(params,callback){
        if(params.category){
            callback(null, require('fs').readFileSync("./system.log", "utf8").toString());
        } else {
            callback(new Error("no category specified"))
        }
    }, function(err, callback) {throw err});   
}


module.exports = init;
module.exports.checkAndCall = checkAndCall;