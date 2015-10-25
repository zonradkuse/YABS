/**
 * @module Models/ARSQuizQuestion
 */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var ARSQuizQuestionSchema = mongoose.Schema({
    quiz: {type: ObjectId, ref: 'ARSQuiz'}, // reference to quiz
    answers: [{ type : ObjectId, ref: 'ARSAnswer'}], // definition of all possible answers
    evaluation: { type: ObjectId, ref: 'ARSEvaluation'}, // abstraction to hide correct answers
    statistics: { type: ObjectId, ref: 'ARSStatistic'}, // abstraction to avoid sending a huge not needed dataset
    givenAnswers: [{ type: ObjectId, ref: 'ARSQuizUserAnswer' }] //TODO check if user has given correct answers
});

ARSQuizQuestionSchema.plugin(deepPopulate);
var ARSQuizQuestion = mongoose.model('ARSQuizQuestion', ARSQuizQuestionSchema);
module.exports.ARSQuizQuestion = ARSQuizQuestion;

