/**
 * sets needed object attributes.
 *
 * @constructor
 * @param sId User SessionId.
 * @param ws The to the user specific websocket.
 * @param user User Data Access Object
 **/
var UserWorker = function(sId, ws, user){
    this.sId = sId;
    this.ws = ws;
    this.user = user;
};

/**
 * checks if there are new rooms that need to be added to the database and adds them.
 **/
UserWorker.prototype.fetchRooms = function(){
    
};

/**
 * returns true if the user session is still valid.
 **/
UserWorker.prototype.checkSession = function(){
    
};

/**
 * renews the Campus access_token if called and the user is still logged in/has a valid session.
 **/
UserWorker.prototype.renewAccessToken = function(){
    
};

/**
 * starts the worker.
 **/
UserWorker.prototype.start = function(){
    
};

//------ Helper section. Mostly L2P requests

module.exports = UserWorker;