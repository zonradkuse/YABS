var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var ARSQuizSchema = mongoose.Schema({
    answer: { type : ObjectId, ref: 'ARSAnswer'},
	evaluation: { type: ObjectId, ref: 'ARSEvaluation'},
	statistics: { type: ObjectId, ref: 'ARSStatistics'},	
    visible: { type: Boolean, default: true }
});

ARSQuizSchema.plugin(deepPopulate);
var ARSQuiz = mongoose.model('ARSQuiz', ARSQuizSchema);
module.exports.ARSQuiz = ARSQuiz;
