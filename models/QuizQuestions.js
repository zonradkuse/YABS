var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

//answers = answers of the question, like A,B,C,D
//rightAnswers = right answers of question, maybe input field
//userAnswers = the answers of all users

var QuizQuestionSchema = mongoose.Schema({
	creator: { type : ObjectId, ref: 'User' },
    creationTime: { type: Date, default: Date.now },
    answers: { type: ObjectId , ref: 'QuizAnswer'},
    rightAnswers: { type: ObjectId, ref: 'QuizAnswer' },
    userAnswers: { type: ObjectId, ref: 'QuizAnswer' },
    visible: { type: Boolean, default: true }
});

QuizQuestionSchema.plugin(deepPopulate);
var QuizQuestion = mongoose.model('QuizQuestion', QuizQuestionSchema);
module.exports.QuizQuestion = QuizQuestion;