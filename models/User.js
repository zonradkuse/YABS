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
        id: String,
        token: String,
        refreshToken: String,
        displayName: String
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
module.exports.User = mongoose.model('User', UserSchema);
module.exports.UserSchema = UserSchema;