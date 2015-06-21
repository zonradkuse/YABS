var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var ARSPollSchema = mongoose.Schema({
    answer: [{type: ObjectId, ref: 'ARSAnswer'}], // definition of all possible answers
    statistics: {type: ObjectId, ref: 'ARSStatistic'} // statistics for teacher - sending abstraction
});

ARSPollSchema.plugin(deepPopulate);
var ARSPoll = mongoose.model('ARSPoll', ARSPollSchema);
module.exports.ARSPoll = ARSPoll;
