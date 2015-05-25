var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var ARSQuizSchema = mongoose.Schema({
    answer: { type : ObjectId, ref: 'ARSAnswer'}, // definition of all possible answers
	evaluation: { type: ObjectId, ref: 'ARSEvaluation'}, // abstraction to hide correct answers
	statistics: { type: ObjectId, ref: 'ARSStatistic'}, // abstraction to avoid sending a huge not needed dataset
});

ARSQuizSchema.plugin(deepPopulate);
var ARSQuiz = mongoose.model('ARSQuiz', ARSQuizSchema);
module.exports.ARSQuiz = ARSQuiz;
