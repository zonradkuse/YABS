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

module.exports.Types = {
	SA_INPUT: 0, //Survey answer with an String in field 'answer'
	UA_ID: 10 //Users answer with an ObjectId in field 'answer'
};

module.exports.getAllByUser = function(user, options, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	if(options.population === undefined)
		options.population = "";
	SurveyAnswer.find({creator: user._id}).deepPopulate(options.population).exec(function(err,answers){
		return callback(err,answers);
	});
};

module.exports.getAllBySurvey = function(survey, options, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	if(options.population === undefined)
		options.population = "";
	SurveyAnswer.find({survey: survey._id}).deepPopulate(options.population).exec(function(err,answers){
		return callback(err,answers);
	});
};