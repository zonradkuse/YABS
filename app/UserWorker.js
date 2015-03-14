var websocket = require('ws').WebSocket;
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
var logger = require('./Logger.js');
sessionStore = new sessionStore();
var l2p = require('./RWTH/L2PRequests.js');
/**
 * sets needed object attributes.
 *
 * @constructor
 * @param sId User SessionId.
 * @param ws The to the user specific websocket.
 * @param user User Data Access Object
 **/
var UserWorker = function(sId, ws, user, wsFrame){
    this.sId = sId;
    this.ws = ws;
    this.user = user;
    this.wsControl = wsFrame;
};

/**
 * checks if there are new rooms that need to be added to the database and adds them.
 **/
UserWorker.prototype.fetchRooms = function(refId){
    this.checkSession(function(err, value){
        if(err) {
            if (err.message !== "connection lost") this.wsControl.build(this.ws, err);
            logger.warn("could not fetch rooms: " + err);
        } else if(value) {
            // valid session existing
            l2p.getAllCourses(this.user.rwth.token, function(err, courses){
                if (err) {
                    this.wsControl.build(this.ws, new Error("could not get l2p courses."), null, refId);
                    logger.warn("could not get l2p courses: " + err);
                } else {
                    try{
                        courses = JSON.stringify(courses);
                    } catch (e) {
                        wsControl.build(this.ws, new Error("L2P answer was malformed."), null, refId);
                        logger.warn("L2P courselist was not valid json: " + courses);
                        return;
                    }
                    if(courses.Status) {
                        for(var el in courses.dataSet) {
                            // TODO create the room
                            //if(this.user.access)
                        }
                    }
                }
            });
        } else if(!value) {
            this.wsControl.build(this.ws, new Error("Your session is invalid."));
        }
    });
};

/**
 * sets next true if the user session is still valid.
 **/
UserWorker.prototype.checkSession = function(next){
        if(ws.readyState === websocket.OPEN){
            sessionStore.get(sId, function(err, user){
                if(err) {
                    this.wsControl.build(this.ws, err);
                    logger.warn("error on session retrieving: " + err);
                    next(err);
                } else if(!user) {
                    next(null, false);
                } else {
                    next(null, true);
                }
            });
        } else {
            next(new Error("connection lost"), false);
        }
};

/**
 * renews the Campus access_token if called and the user is still logged in/has a valid session.
 **/
UserWorker.prototype.renewAccessToken = function(){
    
};

//------ Helper section.


module.exports = UserWorker;