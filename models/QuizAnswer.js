var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

//type = 0 for id, 1 for input field so answer must be compare, etc.

var QuizAnswerSchema = mongoose.Schema({
	creator: { type : ObjectId, ref: 'User' },
    creationTime: { type: Date, default: Date.now },
    question: { type : ObjectId, ref: 'QuizQuestion' },
    type: { type: Number, default: 0 },
    answer: String,
    visible: { type: Boolean, default: true }
});

QuizAnswerSchema.plugin(deepPopulate);
var QuizAnswer = mongoose.model('QuizAnswer', QuizAnswerSchema);
module.exports.QuizAnswer = QuizAnswer;