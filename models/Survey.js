var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var SurveySchema = mongoose.Schema({
	creator: { type : ObjectId, ref: 'User' },
    creationTime: { type: Date, default: Date.now },
    answers: { type: ObjectId, 'SurveyAnswer' },
    userAnswers: { type: ObjectId, 'SurveyAnswer' },
    visible: { type: Boolean, default: true }
});

SurveySchema.plugin(deepPopulate);
var Survey = mongoose.model('Survey', SurveySchema);
module.exports.Survey = Survey;