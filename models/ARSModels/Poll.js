var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var ARSPollSchema = mongoose.Schema({
    answer: { type : ObjectId, ref: 'ARSAnswer'},
	statistics: { type: ObjectId, ref: 'ARSStatistics'}, // statistics for teacher	
    visible: { type: Boolean, default: true }
});

ARSPollSchema.plugin(deepPopulate);
var ARSPoll = mongoose.model('ARSPoll', ARSPollSchema);
module.exports.ARSPoll = ARSPoll;
