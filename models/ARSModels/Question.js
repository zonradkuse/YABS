var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var ARSQuestionSchema = mongoose.Schema({
	creator: { type : ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    quiz: { type : ObjectId, ref: 'Quiz' }, // reference to a quiz
    survey: { type : ObjectId, ref: 'Survey' }, // reference to a survey - having both defined is unexpected behaviour
    type: { type: Number, default: 0 }, // type can be 0 (quiz) or 1 (survey)
    visible: { type: Boolean, default: true }
});

ARSQuestionSchema.plugin(deepPopulate);
var ARSQuestion = mongoose.model('ARSQuestion', ARSQuestionSchema);
module.exports.ARSQuestion = ARSQuestion;
