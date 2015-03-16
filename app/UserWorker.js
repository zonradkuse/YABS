var websocket = require('ws').WebSocket;
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
var logger = require('./Logger.js');
sessionStore = new sessionStore();
var l2p = require('./RWTH/L2PRequests.js');
var Room = require('../models/Room.js');
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
    var self = this;
    this.checkSession(function(err, value){
        if(err) {
            if (err.message !== "connection lost") self.wsControl.build(self.ws, err);
            logger.warn("could not fetch rooms: " + err);
        } else if(value) {
            // valid session existing
            l2p.getAllCourses(self.user.rwth.token, function(courses){
		        try{
                    courses = JSON.parse(courses);
                    logger.debug(courses);
                } catch (e) {
                    self.wsControl.build(self.ws, new Error("L2P answer was malformed."), null, refId);
                    logger.warn("L2P courselist was not valid json: " + courses);
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

                        Room.addRoomToUser(self.user._id, _room, function(err, user){
                            if(err){
                                logger.warn("error on adding room to user: " + err);
                                return;
                            }
                            if(user) {
                                self.user = user;
                                self.wsControl.build(self.ws, null, {
                                    uri: "room:new",
                                    message: "You got access to a new room.",
                                    room: _room
                                }, refId);
                            } else {
                                logger.warn("user not set when trying to update users access.");
                            }
                        });
                    }
                }
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
UserWorker.prototype.renewAccessToken = function(){
    
};

/**
 * merges this.user with the given userId and sets (err, mergedUser) as parameters in next.
 **/
UserWorker.prototype.mergeWithUser = function(userId, next){
    
};

//------ Helper section.


module.exports = UserWorker;
