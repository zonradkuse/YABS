/**
 * This file contains the Authentication passive Method to the Campus and L2P System. There are two methods:
 *
 * First the Client OAuth. We actively ask for a token that the users needs to confirm. (look at active.js)
 * Second the "standard" OAuth way. L2P gives us a token when a user wants to enter a room.
 */

/**
 * Idea: create new Authenticationrequest Object that handles the request internally
 */
var logger = require('../../Logger.js');
var roomDAO = require('../../../models/Room.js');
var userDAO = require('../../../models/User.js');
var l2p = require('../L2PRequests.js');
var moniker = require('moniker');
var avatarGenerator = require('../../ProfilePicture.js');
var imageDAO = require('../../../models/Image.js');
var fancyNames = moniker.generator([ moniker.adjective, moniker.noun ], { glue: ' ' });

var AuthenticationRequest = function (token, l2pRoom, next) {
    if (!token || !l2pRoom) {
        throw new Error('token or room from passive authentication request unset');
    }
    if (!next) {
        this.cb = noop;
    } else {
        this.cb = next;
    }
    this.token = token;
    this.room = l2pRoom;
    this.roomId = ""; // will be reset during processing
    this.__roomObj = {};
    this.user = {};
};

AuthenticationRequest.prototype.process = function () {
    var self = this;
    // check preliminaries
    self.processRoom();
    self.processUserContext(self.cb);
};

AuthenticationRequest.prototype.processUserContext = function () {
    var self = this;
    var req = new l2p.l2pRequest(self.token);
    logger.debug(req);
    req.getUserContext(function (err, data) {
        if (err) {
            logger.warn(err);
        } else if (!data) {
            logger.warn(new Error("empty data"));
        } else {
            var parsedData;
            try {
                parsedData = JSON.parse(data);
            } catch (e) {
                logger.warn(err);
            }
            logger.debug(data);
            if (parsedData.Success) {
                // grab user from database to check if existing
                userDAO.User.findOne({ 'rwth.userId' : parsedData.UserId }).exec(function (err, user) {
                    if (err) {
                        logger.warn(err);
                    } else if (!user) {
                        var newUser = new userDAO.User();
                        var gender = (Math.random() <= 0.5) ? 'male' : 'female';
                        avatarGenerator.generate(newUser, gender, 70, function (err, avatar) {
                            newUser.rwth = {
                                userId : parsedData.UserId,
                                token : self.token,
                                refresh_token : self.token
                            };

                            if (err) {
                                logger.warn("User avatar could not be created");
                            }
                            newUser.name = fancyNames.choose().replace(/\b(\w)/g, function (m) {
                                return m.toUpperCase();
                            });
                            newUser.avatar = avatar;
                            // TODO generate userRoles
                            newUser.save(function(err, savedUser) {
                                if (err) {
                                    logger.warn(err);
                                } else {
                                    self.cb(savedUser);
                                }
                            });
                        });
                    } else {
                        self.cb(null, user);
                    }
                });
            } else {
                logger.warn("L2P status false");
                self.cb(new Error("Bad L2P Status."));
            }
        }
    });
};

AuthenticationRequest.prototype.processRoom = function () {
    var self = this;
    getRoomId(this.room).exec(function (err, room) {
        if (err) {
            logger.warn(err);
            self.roomId = self.room;
        } else if (room) {
            self.roomId = room._id;
            self.__roomObj = room; // for... things.
        } else {
            // room is currently not existing
            var newRoom = new roomDAO.Room();
            newRoom.l2pID = self.room;
            var req = new l2p.l2pRequest(self.token);
            req.getCourseInfo(self.room, function (err, data) {
                if (err) {
                    logger.warn(err);
                }
                var parsedData;
                try {
                    parsedData = JSON.parse(data);
                } catch (e) {
                    logger.warn(e);
                }
                if (parsedData) {
                    if (parsedData.Status) {
                        var roomInfo = parsedData.dataSet[ 0 ];
                        newRoom.name = roomInfo.courseTitle;
                        newRoom.description = roomInfo.description;
                        newRoom.url = roomInfo.url;
                        newRoom.status = roomInfo.status;
                        newRoom.semester = roomInfo.semester;
                        newRoom.save(function (err, room) {
                            if (err) {
                                logger.warn(err);
                            } else {
                                self.roomId = room._id;
                                self.__roomObj = room;
                            }
                        });
                    } else {
                        logger.warn(parsedData);
                        self.error = new Error("L2P said no.");
                    }
                } else {
                    logger.warn(new Error("wat?"));
                }
            });
        }
    });
};

AuthenticationRequest.prototype.getRoomId = function () {
    return this.roomId;
};

/*!
 * @param {String} l2pId - The l2pId e.g. ss15-12345
 * @return {Promise}
 */
function getRoomId(l2pId) {
    return roomDAO.Room.findOne({ l2pID : l2pId });
}

function noop() {}
module.exports = AuthenticationRequest;
