var logger = require('../Logger.js');
var config = require('../../config.json');
var querystring = require('querystring');
var UserModel = require('../../models/User.js');
var roomDAO = require('../../models/Room.js');
var User = require('../../models/User.js').User;
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
sessionStore = new sessionStore();
var userWorker = require('../UserWorker.js');
var campus = require('../RWTH/CampusRequests.js');
var moniker = require('moniker');
var fancyNames = moniker.generator([moniker.adjective, moniker.noun],{glue:' '});
var workerMap = {};

module.exports = function(wsControl){
    /*
     * This method performs a big database query and sends it back to the client.
     */
    wsControl.on("system:benchmark", function(wss, ws, session, params, interfaceEntry, refId, sId){
        if (config.general.env.dev) {
            roomDAO.getAll({population: 'questions questions.author questions.votes questions.votes.access questions.answers questions.answers.author questions.author.access questions.answers.author.access'}, function(err, rooms){
                wsControl.build(ws, err, rooms, refId);
            });
        }
    });

    wsControl.on('system:close', function(ws, sId){
        //workerMap[sId].stop();
        logger.info("a client disconnected.");
        process.nextTick(function(){
            delete workerMap[sId];
        });
    });
    wsControl.on('system:open', function(wss, ws, session, sId){
        logger.info("new client arrived.");
        wsControl.build(ws, null, { message: 'welcome' }, null);
        process.nextTick(function(){
            setTimeout(function(){
                if(!workerMap[sId] && session && session.user && session.user._id){
                    UserModel.get(session.user._id, function(err, _user){
                        var worker = new userWorker(sId, ws, _user, wsControl, true);
                        workerMap[sId] = worker;
                        console.log(worker);
                        worker.getRooms(); //send at least old rooms
                        worker.fetchRooms(null, function(){ //get new rooms
                            worker.getRooms(); //send all rooms
                        });
                    });
                } else if(workerMap[sId]) {
                    workerMap[sId].getRooms(); //send at least old rooms
                    /* workerMap[sId].fetchRooms(null, function(){ //get new rooms
                        workerMap[sId].getRooms(); //send all rooms
                    }); */
                }
            }, 1000);
        });    
    });
    wsControl.on('system:ping', function(wss, ws, session, params, interfaceEntry, refId){
        wsControl.build(ws, null, { message: "pong" }, refId);
    });
    
    //Campus Device OAuth. Webapplication OAuth is not accessible. //TODO: Therefor a solution for multi-sessions is needed!
    wsControl.on('system:login', function(wss, ws, session, params, interfaceEntry, refId, sId){
        postReqCampus('code' ,querystring.stringify({
            "client_id": config.login.l2p.clientID,
            "scope": config.login.l2p.scope
        }), function(err, answer){
            if (err){
                wsControl.build(ws, err, null, refId);
                logger.warn(err);
                return;
            } else if(answer){
                try{
                    answer = JSON.parse(answer);
                } catch(e) {
                    wsControl.build(ws, new Error("An error occured when communicating with Campus. lol."), null, refId);
                    logger.warn('An error occured whon communicating with Campus OAuth. Response was: ' + answer);
                    return;
                }
                var _url = answer.verification_url + '?q=verify&d=' + answer.user_code;
                logger.debug(_url);
                wsControl.build(ws, null, {
                    message: "Please visit the provided url.",
                    url: _url
                }, refId);
                var auth = false;
                var reqTime = 0;
                var timer = setInterval(function(){
                    if(!auth && reqTime < answer.expires_in && ws.readyState === 1){
                        // poll
                        postReqCampus('token', querystring.stringify({
                            "client_id": config.login.l2p.clientID,
                            "code": answer.device_code,
                            "grant_type": "device"
                        }), function(err, response){
                            if (err){
                                wsControl.build(ws, err, null, refId);
                                logger.warn(err);
                                return;
                            } else if (response){
                                logger.debug(response);
                                try{
                                    response = JSON.parse(response);
                                } catch(e) {
                                    logger.error();
                                    wsControl.build(ws, new Error("An error occured when communicating with Campus. lol."), null, refId);
                                    logger.warn('An error occured when communicating with Campus OAuth. Response was: ' + response);
                                }
                                if(response.status){
                                    if(response.status === "ok"){
                                        // it's an access token. wuhsa!
                                        logger.debug(response);
                                        auth = true;
                                        clearInterval(timer);
                                        var _user = new User();
                                        _user.local.name = fancyNames.choose().replace(/\b(\w)/g, function(m){ return m.toUpperCase()});
                                        _user.rwth.token = response.access_token;
                                        _user.rwth.refresh_token = response.refresh_token;
                                        _user.rwth.expires_in = response.expires_in;
                                        _user.save(function(err){
                                            if(err) {
                                                wsControl.build(ws, err, null, refId);
                                                logger.warn(err);
                                                return;
                                            }
                                            if (session) {
                                                session.user = _user;
                                                sessionStore.set(sId, session, function(err){
                                                    if(err) {
                                                        wsControl.build(ws, err, null, refId);
                                                        return;
                                                    }
                                                    wsControl.build(ws, null, { status: true }, refId);
                                                    // start a worker that fetches rooms.
                                                    var worker = new userWorker(sId, ws, _user, wsControl, false);
                                                    if(!workerMap[sId]){
                                                        workerMap[sId] = worker;
                                                    } else {
                                                        worker = workerMap[sId];
                                                        worker.ws = ws; // this is necessary!
                                                        worker.user = _user;
                                                    }
                                                    process.nextTick(function(){
                                                        logger.info("starting new user worker.");
                                                        worker.fetchRooms(); //start worker after this request.
                                                    });
                                                    logger.info("created new user.");
                                                });
                                            } else {
                                                wsControl.build(ws, new Error("Your session is invalid"), null, refId);
                                            }
                                        });
                                        
                                    } else if(response.status === "error: authorization pending."){
                                        //wsControl.build(ws, null, { status : false }, refId);
                                    }

                                } else {
                                    wsControl.build(ws, new Error("There was no status in Campus answer."), null, refId);
                                }
                            }
                        });
                    }else if(reqTime >= answer.expires_in){
                        wsControl.build(ws, new Error("Your authentication request failed. Please try again."), null, refId);
                        clearInterval(timer);
                    }else{ // authenticated or connection was dumped
                        clearInterval(timer);
                    }
                    reqTime += answer.interval;
                }, answer.interval * 1000);
                // Campus currently responds with 30 minutes polltime. srsly?
            } else {
                wsControl.build(ws, new Error("Campus Response not set."));
                logger.debug("Campus Response not set. Answer was " + answer); //yes, it must have been empty
            }
        });
    });

    wsControl.on("system:whoami", function(wss, ws, session, params, interfaceEntry, refId, sId){
        if(refId){
            if(!session || !session.user || !session.user._id){
                wsControl.build(ws, null, {
                    status: false,
                    message: "You are currently not logged in."
                } , refId);
            } else {
                wsControl.build(ws, null, {
                    status: true,
                    message: (session.user.local ? session.user.local.name : session.user._id),
                    userId: (session.user ? session.user._id : null),
                    userName: (session.user && session.user.local ? session.user.local.name : null)
                }, refId);
            }
        }
    });

    wsControl.on("system:enterRoom", function(wss, ws, session, params, interfaceEntry, refId, sId, authed){
        if(authed && params.roomId !== undefined){
            session.room = params.roomId;
            sessionStore.set(sId, session, function(err){
                if(err) {
                    wsControl.build(ws, err, null, refId);
                } else {
                    wsControl.build(ws, null, {
                        status: true,
                    }, refId);
                }
            });
        } else {
            wsControl.build(ws, null, {
                status: false,
            } , refId);
        }
    });

    wsControl.on("system:logout", function(wss, ws, session, params, interfaceEntry, refId, sId, authed){
        if(authed){
            sessionStore.destroy(sId, function(err){
                if(err) {
                    wsControl.build(ws, new Error("Could not delete your session."), {status: false, message: "An error occured."}, refId);
                    return logger.warn("could not delete session: " + err);
                }
                wsControl.build(ws, null, {status: true, message: "Goodbye."}, refId);
            });
        } else {
            wsControl.build(ws, null, {status: false, message: "You are not logged in."}, refId);
        }
    });
};

// @function
var postReqCampus = campus.postReqCampus;

module.exports.getWorkerMap = function(){
    return workerMap;
};
