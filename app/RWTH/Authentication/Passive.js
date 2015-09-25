/**
 * This file contains the Authentication passive Method to the Campus and L2P System. There are two methods:
 *
 * First the Client OAuth. We actively ask for a token that the users needs to confirm. (look at active.js)
 * Second the "standard" OAuth way. L2P gives us a token when a user wants to enter a room.
 */

/**
 * Idea: create new Authenticationrequest Object that handles the request internally
 *
 * Create new request and call process:
 * var req  = new AuthenticationRequest(token, l2proomidentifier, function (err, user){});
 * req.process();
 */
var logger = require('../../Logger.js');
var roomDAO = require('../../../models/Room.js');
var userDAO = require('../../../models/User.js');
var l2p = require('../L2PRequests.js');
var moniker = require('moniker');
var avatarGenerator = require('../../ProfilePicture.js');
var imageDAO = require('../../../models/Image.js');
var fancyNames = moniker.generator([ moniker.adjective, moniker.noun ], { glue: ' ' });
var roles = require('../../../config/UserRoles.json');

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
    self.processRoom(function (room) {
        self.processUserContext(room);
    });

};

AuthenticationRequest.prototype.processUserContext = function (room) {
    var self = this;
    var req = new l2p.l2pRequest(self.token);
    logger.debug(req);
    req.getUserContext(function (err, parsedData) {
        if (err) {
            logger.warn(err);
        } else if (!parsedData) {
            logger.warn(new Error("empty data"));
        } else {
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
                            newUser.access = [];
                            newUser.access.push(room._id);
                            if (parsedData && parsedData.userRoles && (parsedData.userRoles.indexOf('manager') > -1 ||
                                                parsedData.userRoles.indexOf('tutor') > -1)) {
                                newUser.rights.push({roomId: room._id.toString(), accessLevel: roles.defaultAdmin});
                            } else {
                                newUser.rights.push({roomId: room._id.toString(), accessLevel: roles.defaultLoggedIn});
                            }
                            newUser.save(function (err, savedUser) {
                                if (err) {
                                    logger.warn(err);
                                } else {
                                    self.cb(null, savedUser);
                                }
                            });
                        });
                    } else {
                        user.rwth.token = self.token;
                        var entryExists = false;
                        for (var key in user.rights) {
                            if (user.rights[ key ].roomId === room._id.toString()) {
                                entryExists = true;
                                break;
                            }
                        }
                        if (!entryExists) {
                            if (parsedData && parsedData.userRoles && (parsedData.userRoles.indexOf('manager') > -1 ||
                                parsedData.userRoles.indexOf('tutor') > -1)) {
                                user.rights.push({roomId: room._id.toString(), accessLevel: roles.defaultAdmin});
                            } else {
                                user.rights.push({roomId: room._id.toString(), accessLevel: roles.defaultLoggedIn});
                            }
                        }
                        
                        user.save();
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

AuthenticationRequest.prototype.processRoom = function (next) {
    var self = this;
    getRoomId(this.room).exec(function (err, room) {
        if (err) {
            logger.warn(err);
            self.roomId = self.room;
        } else if (room) {
            self.roomId = room._id;
            self.__roomObj = room; // for... things.
            next(room);
        } else {
            // room is currently not existing
            var newRoom = new roomDAO.Room();
            newRoom.l2pID = self.room;
            var req = new l2p.l2pRequest(self.token);
            req.getCourseInfo(self.room, function (err, parsedData) {
                if (err) {
                    logger.warn(err);
                }
                logger.debug(parsedData);
                if (parsedData) {
                    if (parsedData.Status) {
                        if (parsedData.dataSet[ 0 ] !== undefined) {
                            var roomInfo = parsedData.dataSet[ 0 ];
                            newRoom.name = roomInfo.courseTitle;
                            newRoom.description = roomInfo.description;
                            newRoom.url = roomInfo.url;
                            newRoom.status = roomInfo.status;
                            newRoom.semester = roomInfo.semester;
                        }
                        newRoom.save(function (err, room) {
                            if (err) {
                                logger.warn(err);
                            } else {
                                self.roomId = room._id;
                                self.__roomObj = room;
                                logger.debug("created new room: " + room);
                                next(room);
                            }
                        });
                    } else {
                        logger.warn(parsedData);
                        self.error = new Error("L2P said no.");
                    }
                } else {
                    logger.warn("wat?");
                }
            });
        }
    });
};

AuthenticationRequest.prototype.getRoomId = function () {
    return this.roomId;
};

/**
 * @param {String} l2pId - The l2pId e.g. ss15-12345
 * @return {Promise}
 */
function getRoomId(l2pId) {
    return roomDAO.Room.findOne({ l2pID : l2pId });
}

function noop() {}
module.exports = AuthenticationRequest;
