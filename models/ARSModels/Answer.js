var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var ARSAnswerSchema = mongoose.Schema({
	creator: { type : ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    visible: { type: Boolean, default: true }
});

ARSAnswerSchema.plugin(deepPopulate);
var ARSAnswer = mongoose.model('ARSAnswer', ARSAnswerSchema);
module.exports.ARSAnswer = ARSAnswer;
