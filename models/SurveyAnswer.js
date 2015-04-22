var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

//type = 0 for id (cast 'answer' to ObjectId), 1 for input field so 'answer' must be compare, etc.

var SurveyAnswerSchema = mongoose.Schema({
	creator: { type : ObjectId, ref: 'User' },
    creationTime: { type: Date, default: Date.now },
    survey: { type : ObjectId, ref: 'Survey' },
    type: { type: Number, default: 0 },
    answer: String,
    visible: { type: Boolean, default: true }
});

SurveyAnswerSchema.plugin(deepPopulate);
var SurveyAnswer = mongoose.model('SurveyAnswer', SurveyAnswerSchema);
module.exports.SurveyAnswer = SurveyAnswer;