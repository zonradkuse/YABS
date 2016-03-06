var logger = require('../../Logger.js');
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
sessionStore = new sessionStore();
var accessManager = require('../../AccessManagement.js');
var WebSocketServer = require('ws').Server;
var websocketResponse = require('./response.js');
var roomWSControl = require('./../../API/Room.js');
var dispatchAdapter = require('../DispatchRequestAdapter.js');

function initwss(expressApp) {
    app = expressApp;
    var wss = new WebSocketServer({
        server: app
    });

    /**
     * Send a broadcast to all clients on local server.
     * @param {Object} data - data which should have sent to the user
     * @deprecated
     */
    wss.broadcast = function broadcast(data) {
        wss.clients.forEach(function each(client) {
            client.send(data);
        });
    };

    /** Count all active users on current server
     * @memberof! wss
     * @returns {Number} count of users
     */
    wss.getActiveUsers = function () {
        return wss.clients.length;
    };

    /** Count active users of a room.
     * @returns {Number} count of users
     * @todo async count
     */
    wss.getActiveUsersByRoom = function (roomId, next) {
        var c = 0;
        var _countFunc = function (p) {
            sessionStore.get(wss.clients[ p ].upgradeReq.signedCookies[ "connect.sid" ], function (err, sess) {
                if (err) {
                    next(err);
                }
                if (sess && sess.room && sess.room == roomId) {
                    c++;
                }
                if (p === 0) { // this is bad and i should feel bad.
                    next(null, c);
                }
            });
        };
        for (var i = wss.clients.length - 1; i >= 0; i--) {
            var pos = i;
            (_countFunc)(pos);
        }
    };

    /** Send a broadcast to all users in a room.
     * @param {Websocket} ws - ws object of initiator
     * @param {String} uri - rpc uri
     * @param {Object} data - data which should have sent to the user
     * @param {ObjectId} roomId - ObjectId of target room
     */
    wss.roomBroadcast = function (ws, uri, data, roomId, accessLevel) {
        var oldQ;
        if (data && data.question) {
            oldQ = JSON.parse(JSON.stringify(data.question));
        }
        wss.clients.forEach(function each(client) {
            //check if user is currently active room member.
            var sId = client.upgradeReq.signedCookies[ "connect.sid" ];
            sessionStore.get(sId, function (err, sess) {
                if (err) {
                    return logger.err("An error occurred on getting the user session: " + err);
                }
                if (sess) {
                    if (sess.room && sess.room == roomId) {
                        if (data.question) {
                            data.question = JSON.parse(JSON.stringify(oldQ));
                            data.question.hasVote = roomWSControl.createVotesFields(sess.user, data.question).hasVote;
                            logger.debug(data.question);
                        }
                        if (accessLevel) {
                            accessManager.checkAccessLevel(sId, { requiredAccess : accessLevel }, roomId, function (err, access) {
                                build(new dispatchAdapter(null, {ws : client, wss: wss}, null), null, null, null, uri, data);
                            });
                        } else {
                            logger.debug("broadcast message to " + sess.user._id);
                            build(new dispatchAdapter(null, {ws : client, wss: wss}, null), null, null, null, uri, data);
                        }
                    }
                } else {
                    logger.warn("There is a sessionId without a session. sId: " + sId +
                        " session: " + JSON.stringify(sess) + " data to be sent: " + JSON.stringify(data));
                }
            });
        });
    };

    /** Send a broadcast to all users, in a room, which have a required access level or higher.
     * @param {Websocket} ws - ws object of initiator
     * @param {String} uri - rpc uri
     * @param {Object} data - data which should have sent to the user
     * @param {ObjectId} roomId - ObjectId of target room
     * @param {Object} options - options
     * @param {Boolean} options.requiredAccess - equals true then user must have this access level or higher
     * @param {Boolean} [options.roomMember] - equals true then user have to be active room member
     */
    wss.roomAccessLevelBroadcast = function (ws, uri, data, roomId, options) {
        var oldQ;
        if (data.question) {
            oldQ = JSON.parse(JSON.stringify(data.question));
        }
        wss.clients.forEach(function each(client) {
            var sId = client.upgradeReq.signedCookies[ "connect.sid" ];
            accessManager.checkAccessLevel(sId, options, roomId, function (err, access) {
                if (err) {
                    // just terminate
                    return;
                }
                if (access) {
                    if (data.question) {
                        data.question = JSON.parse(JSON.stringify(oldQ));
                        data.question.hasVote = roomWSControl.createVotesFields(sess.user, data.question).hasVote;
                    }
                    build(new dispatchAdapter(null, {ws : client, wss: wss}, null), null, null, null, uri, data);
                }
            });
        });
    };

    return wss;
}

/** Build a json object for a response or a broadcast, which will be send via websocket.
 * @param {Websocket} ws - websocket of receiver
 * @param {Error} err - if an error should be send, otherwise null
 * @param {Object} data - data
 * @param {String} refId - refId of request, when needed
 * @param {String} uri - rpc uri
 * @param {Object} param - parameters for a broadcast
 */
function build(ws, err, data, refId, uri, param) {
    // here should go the redis publish part, the build fnct in res object will then listen to the channel and send
    // the data
    websocketResponse.build(ws, err, data, refId, uri, param);
}
module.exports = initwss;
