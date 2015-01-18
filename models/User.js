/** The User Model
* @param {String} pName The useres name as it is visible for the system.
* @param {String[]} pAccess This holds the access rights.
*/

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var UserSchema = mongoose.Schema({
	name: { type: String, unique: true },
    creationTime: { type: Date, default: Date.now },
    access: [{ type: ObjectId, ref: 'Room' }],
    l2pAPIKey: String
});

UserSchema.plugin(deepPopulate);
module.exports.User = mongoose.model('User',UserSchema);
module.exports.UserSchema = UserSchema;