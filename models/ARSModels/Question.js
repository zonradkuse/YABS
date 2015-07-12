var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var ARSQuestionSchema = mongoose.Schema({
	creator: { type : ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    description: String,
    quizQuestion: { type : ObjectId, ref: 'ARSQuizQuestion' }, // reference to a quiz question
    poll: { type : ObjectId, ref: 'ARSPoll' }, // reference to a poll - having both defined is unexpected behaviour
    visible: { type: Boolean, default: true },
    next : { type: ObjectId, ref: 'ARSQuestion'}, // nice to have for the client @TODO
    previous : { type: ObjectId, ref: 'ARSQuestion'}, // because we can @TODO
    dueDate : Date,
    active: { type: Boolean, default: true },
    answered : [{ type: ObjectId, ref: 'User', default: []}]
});

ARSQuestionSchema.plugin(deepPopulate);
var ARSQuestion = mongoose.model('ARSQuestion', ARSQuestionSchema);
module.exports.ARSQuestion = ARSQuestion;
