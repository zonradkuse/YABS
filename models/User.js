/** The User Model
 * @param {String} pName The useres name as it is visible for the system.
 * @param {String[]} pAccess This holds the access rights.
 */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;
var Room = require('../models/Room.js').Room;

var UserSchema = mongoose.Schema({
    active: { // needed for local registration in future to check if email has been verified.
      type: Boolean,
      default: false
    },
    local: {
        name: String,
        password: String, // this and the next line are only needed for local register/login
        mail: String,
    },
    rwth:{
        token: String,
        refresh_token: String,
        expires_in: Number
    },
    creationTime: {
        type: Date,
        default: Date.now
    },
    access: [{
        type: ObjectId,
        ref: 'Room'
    }],
    facebook: {
      id : String,
      token: String,
      name: String,
      username: String
    },
    google: {
      id: String,
      token: String,
      email: String,
      name: String
    },
    github: {
      id: String,
      token: String,
      email: String,
      name: String
    },
    twitter: {
      id: String,
      token: String,
      displayName: String,
      username: String
    }
});

UserSchema.plugin(deepPopulate);
var User = mongoose.model('User', UserSchema);
module.exports.User = User;
module.exports.UserSchema = UserSchema;


/*
* @param user the user object which should be created
* @param callback params: error, user object
*/
module.exports.createUser = function(user, callback){
  if(callback === undefined)
    throw new Error("callback not defined");
  user.save(function(err, user){
    callback(err, user);
  });
}

/*
* @param userID ID of the target user object
* @param callback params: error, user object
*/
module.exports.getUser = function(userID, callback){
  if(callback === undefined)
    throw new Error("callback not defined");
  User.findById(userID,function(err, user){
    return callback(err, user);
  });
}

/*
* @param user the target user object
* @param roomID the ID of room which should add to the user
* @param callback params: error, user object
*/
module.exports.addRoomAccess = function(user, roomID, callback){
  if(callback === undefined)
    throw new Error("callback not defined");
  console.log(JSON.stringify(roomID,null,2));
  User.findOneAndUpdate({'_id':user._id,'access':{$nin:[roomID]}},{$pushAll:{'access':[roomID]}},function(err, user){
      return callback(err, user, !user);
  });
}

/*
* @param user the target user object
* @param options used for deepPopulation
* @param callback params: error, array of rooms which the user have access to
*/
module.exports.getRoomAccess = function(user, options, callback){
  if(callback === undefined)
    throw new Error("callback not defined");
  User.findById(user._id).deepPopulate('access access.'+options.population).exec(function(err, user){
    return callback(err, user.access);
  });
}

/*
* @param user the target user object
* @param room the room object which the user should get access to
* @param callback params: error, user object, room object
*/
module.exports.addRoomToUser = function(user, room, callback){
  if(callback === undefined)
    throw new Error("callback not defined");
  Room.findOrCreate({'l2pID':room.l2pID}, room.toObject(), function(err, room, created){
    if(err)
      throw new Error("room not found or cannot created");
    module.exports.addRoomAccess(user, room._id, function(err, user){
      if(err)
        throw new Error("cannot update users room access");
      return callback(err, user, room);
    });
  });
}
