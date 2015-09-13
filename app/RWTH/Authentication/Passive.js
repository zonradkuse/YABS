/**
 * This file contains the Authentication passive Method to the Campus and L2P System. There are two methods:
 *
 * First the Client OAuth. We actively ask for a token that the users needs to confirm. (look at active.js)
 * Second the "standard" OAuth way. L2P gives us a token when a user wants to enter a room.
 */

/**
 * Idea: create new Authenticationrequest Object that handles the request internally
 */

var AuthenticationRequest = function (token, room, next) {
    this.token = token;
    this.room = room;
    this.cb = next;
    this.roomId = ""; // will be reset during processing
};

AuthenticationRequest.prototype.process = function () {

};

AuthenticationRequest.prototype.setRoomId = function () {

};

module.exports = AuthenticationRequest;