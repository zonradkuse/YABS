var websocket = require('ws').WebSocket;
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
var logger = require('./Logger.js');
sessionStore = new sessionStore();
var l2p = require('./RWTH/L2PRequests.js');
var Room = require('../models/Room.js');
var User = require('../models/User.js');
var userDAO = require('../models/User.js');

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
                    self.wsControl.build(self.ws, new Error("L2P answer was invalid."), null, refId);
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

                        User.addRoomToUser(self.user, _room, function(err, user, room){
                            if(err){
                                logger.warn("error on adding room to user: " + err);
                                return;
                            }
                            if(user) {
                                self.user = user;
                                if (refId) {
                                    self.wsControl.build(self.ws, null, {
                                        'message': "You got a new room.",
                                        'room': room
                                    }, refId);
                                } else {
                                    self.wsControl.build(self.ws, null, null, null, "room:add", { 'room': room });
                                }
                                logger.info("added new room: " + room.l2pID);
                            }
                        });
                    }
                } else {
                    self.wsControl.build(self.ws, new Error("L2P returned bad things (probably html code)"), null, refId);
                    logger.warn("Bad L2P answer: " + courses); 
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

UserWorker.prototype.getRooms = function(){
    var self = this;
    if(self.user && self.user._id){
        userDAO.getRoomAccess(self.user, {population: ''}, function(err, rooms){
            for (var room in rooms){
                if(rooms[room].l2pID !== undefined){
                    self.wsControl.build(self.ws, null, null, null, "room:add", { 'room': rooms[room] });
                    logger.debug("send: " + rooms[room].l2pID);
                }
            }
        });
    } else {
        wsControl.build(ws, new Error("Your session is invalid."), null, refId);
    }
}

//------ Helper section.


module.exports = UserWorker;
