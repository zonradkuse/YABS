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

module.exports.Types = {
	QA_ID: 0, //Quiz answer with an ObjectId in field 'answer'
	QA_INPUT: 1, //Quiz answer with an String in field 'answer'
	UA_ID: 10, //Users answer with an ObjectId in field 'answer'
	UA_INPUT: 11 //Users answer with an String in field 'answer'  
};

module.exports.getAllByUser = function(user, options, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	if(options.population === undefined)
		options.population = "";
	QuizAnswer.find({creator: user._id}).deepPopulate(options.population).exec(function(err,answers){
		return callback(err,answers);
	});
};

module.exports.getAllByQuestion = function(question, options, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	if(options.population === undefined)
		options.population = "";
	QuizAnswer.find({question: question._id}).deepPopulate(options.population).exec(function(err,answers){
		return callback(err,answers);
	});	
};