/**
 * This file contains the Authentication passive Method to the Campus and L2P System. There are two methods:
 *
 * First the Client OAuth. We actively ask for a token that the users needs to confirm. (look at active.js)
 * Second the "standard" OAuth way. L2P gives us a token when a user wants to enter a room.
 */

/**
 * Idea: create new Authenticationrequest Object that handles the request internally
 */
var roomDAO = require('../../../models/Room.js');
var userDAO = require('../../../models/User.js');
var l2p = require('../.L2PRequests.js');

var AuthenticationRequest = function (token, l2pRoom, next) {
    if (!token || !room) {
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
    var count = 0;
    var join = function () {
        if (count == 2) {
            self.cb();
        } else {
            count += 1;
        }
    };
    self.processRoom(join);
    self.processUserContext(join);
};

AuthenticationRequest.prototype.processUserContext = function (fct) {

};

AuthenticationRequest.prototype.processRoom = function (fct) {
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
                }
                fct();
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
