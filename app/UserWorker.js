var websocket = require('ws').WebSocket;
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
var logger = require('./Logger.js');
sessionStore = new sessionStore();
var l2p = require('./RWTH/L2PRequests.js');
var Room = require('../models/Room.js');
var User = require('../models/User.js');
var userDAO = require('../models/User.js');
var campusReq = require('./RWTH/CampusRequests.js');
var config = require('../config.json');
var querystring = require('querystring');

/**
 * sets needed object attributes.
 *
 * @constructor
 * @param sId User SessionId.
 * @param ws The to the user specific websocket.
 * @param user User Data Access Object
 **/
var UserWorker = function(sId, ws, user, wsFrame, initialBool){
    this.sId = sId;
    this.ws = ws;
    this.user = user;
    this.wsControl = wsFrame;
    this.initialized = initialBool;
};

/**
 * checks if there are new rooms that need to be added to the database and adds them.
 **/
UserWorker.prototype.fetchRooms = function(refId, next){
    var self = this;
    this.checkSession(function(err, value){
        if(err) {
            self.wsControl.build(self.ws, err);
            logger.warn("could not fetch rooms: " + err);
        } else if(value) {
            // valid session existing - check access token
            self.refreshAccessToken(function(err){
                if(err){
                    logger.warn("could not refresh access token: " + err);
                    return self.wsControl.build(self.ws, new Error("Could not refresh your token."), null, refId);
                }
                l2p.getAllCourses(self.user.rwth.token, function(courses){
    		        try{
                        courses = JSON.parse(courses);
                        logger.debug(courses);
                    } catch (e) {
                        self.wsControl.build(self.ws, new Error("L2P answer was invalid."), null, refId);
                        logger.warn("L2P courselist was not valid json: " + courses.toString());
                        return;
                    }
                    if(courses.Status) {
                        for(var el in courses.dataSet) {
                            var _room = new Room.Room();
                            _room.l2pID = courses.dataSet[el].uniqueid;
                            _room.name = courses.dataSet[el].courseTitle;
                            _room.description = courses.dataSet[el].description;
                            _room.url = courses.dataSet[el].url;
                            _room.status = courses.dataSet[el].status;
                            _room.semester = courses.dataSet[el].semester;

                            User.addRoomToUser(self.user, _room, function(err, user, room){
                                if(err){
                                    logger.warn("error on adding room to user: " + err);
                                    return;
                                }
                                if(user) {
                                    self.wsControl.build(self.ws, null, null, null, "room:add", { 'room': room });
                                    logger.info("added new room: " + room.l2pID);
                                }
                            });
                        }
                    } else {
                        self.wsControl.build(self.ws, new Error("L2P returned bad things (probably html code)"), null, refId);
                        logger.warn("Bad L2P answer: " + courses.toString());
                    }
                    if (next) next();
                });
            });
        } else if(!value) {
            self.wsControl.build(self.ws, new Error("Your session is invalid."));
        }
    });
};

/**
 * sets next true if the user session is still valid.
 **/
UserWorker.prototype.checkSession = function(next){
    var self = this;
    sessionStore.get(self.sId, function(err, user){
        if(err) {
            self.wsControl.build(self.ws, err);
            logger.warn("error on session retrieving: " + err);
            next(err);
        } else if(!user) {
            next(null, false);
        } else {
            next(null, true);
        }
    });
};

/**
 * renews the Campus access_token if called and the user is still logged in/has a valid session.
 **/
UserWorker.prototype.refreshAccessToken = function(next){
    var self = this;
    this.checkToken(function(err, expires){
        if(err) return next(err);

        if(!expires || expires < 300){
            campusReq.postReqCampus('token', querystring.stringify({
                "client_id": config.login.l2p.clientID,
                "refresh_token": self.user.rwth.refresh_token,
                "grant_type": "refresh_token"
            }), function(err, res){
                if (err) {
                    next(err);
                } else {
                    var answer;
                    try{
                        answer = JSON.parse(res);
                    } catch (e) {
                        return next(e);
                    }
                    if(answer.status === "ok"){
                        userDAO.get(self.user._id, function(err, _user){
                            if (err) return next(err);
                            if(_user) {
                                _user.rwth.token = answer.access_token;
                                self.user = _user;
                                self.user.save(function(e){
                                    if (e) return logger.warn("could not save a user: " + e);
                                    next(null);
                                });
                            } else {
                                logger.warn("user should have existed: " + self.user);
                                next(new Error("You do not exist."));
                            }

                        });

                    } else if (answer.error === "authorization invalid."){
                        next(new Error("Your refresh_token is invalid."));
                    }
                }
            });
        } else {
            next(null);
        }
        
    });

};

UserWorker.prototype.checkToken = function(next){
    var self = this;

    campusReq.postReqCampus('tokeninfo', querystring.stringify({
            "client_id": config.login.l2p.clientID,
            "access_token": self.user.rwth.token
        }), function(err, res){
            if (err) {
                return next(err)
            } else {
                var answer;
                try{
                    answer = JSON.parse(res);
                } catch (e) {
                    return next(e);
                }
                
                if(answer.status === "ok"){
                    next(null, answer.expires_in);
                } else {
                    next(null, null);
                }
            }
    });

}
/**
 * merges this.user with the given userId and sets (err, mergedUser) as parameters in next.
 **/
UserWorker.prototype.mergeWithUser = function(userId, next){
    
};

UserWorker.prototype.getRooms = function(){
    var self = this;
    if(self.user && self.user._id){
        userDAO.getRoomAccess(self.user, {population: ''}, function(err, rooms){
            for (var room in rooms){
                if(rooms[room].l2pID !== undefined){
                    rooms[room].questions = [];
                    self.wsControl.build(self.ws, null, null, null, "room:add", { 'room': rooms[room] });
                }
            }
        });
    } else {
        wsControl.build(ws, new Error("Your session is invalid."), null, refId);
    }
}

//------ Helper section.


module.exports = UserWorker;
