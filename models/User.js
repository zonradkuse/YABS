/** The User Model
 * @param {String} pName The useres name as it is visible for the system.
 * @param {String[]} pAccess This holds the access rights.
 */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

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

module.exports.createUser = function(user, callback){
  if(callback === undefined)
    throw new Error("callback not defined");
  user.save(function(eUser, user){
    callback(eUser, user);
  });
}

module.exports.getUser = function(userID, callback){
  if(callback === undefined)
    throw new Error("callback not defined");
  User.findById(userID,function(eUser, user){
    return callback(eUser, user);
  });
}
