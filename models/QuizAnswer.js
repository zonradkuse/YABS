/** @module QuizAnswer-Model */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var QuizAnswerSchema = mongoose.Schema({
	creator: { type : ObjectId, ref: 'User' },
    creationTime: { type: Date, default: Date.now },
    question: { type : ObjectId, ref: 'QuizQuestion' },
    type: { type: Number, default: 0 },
    answer: String,
    visible: { type: Boolean, default: true }
});

QuizAnswerSchema.plugin(deepPopulate);
/**
 * @class
 * @classdesc This is a moongose schema for answers of a question.
 * @property {ObjectId} creator - user refId
 * @property {Date} creationTime=Date.now - creation time
 * @property {ObjectId} question - question refId
 * @property {Number} type=0 - type of answer like {@link Types}
 * @property {String} answer - answer depends on type
 * @property {Boolean} visible=true - visibility
 * @example
 * new QuizAnswer({creator: ObjectId{User}, question: ObjectId{QuizQuestion}, answer: "3+5"});
 */
var QuizAnswer = mongoose.model('QuizAnswer', QuizAnswerSchema);
module.exports.QuizAnswer = QuizAnswer;

/**
 * @enum {Number}
 * @readonly
 */
module.exports.Types = {
	/** possible answer of a QuizQuestion with an ObjectId in field 'answer' */
	QA_ID: 0,
	/** possible answer of a QuizQuestion with an String in field 'answer' */
	QA_INPUT: 1,
	/** answer of an user with an ObjectId in field 'answer' */
	UA_ID: 10,
	/** answer of an user with an String in field 'answer' */
	UA_INPUT: 11  
};

/** Get all answers of a specific user.
* @param {User} user - user object
* @param {Object} options - options
* @param {String} [options.population=""] - param for deepPopulate plugin
* @param {quizAnswerCallback} callback - callback function
*/
module.exports.getAllByUser = function (user, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (options.population === undefined) {
		options.population = "";
	}
	QuizAnswer.find({creator: user._id}).deepPopulate(options.population).exec(function (err, answers) {
		return callback(err, answers);
	});
};

/** Get all answers of a specific question.
 * @param {QuizQuestion} question - question object
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {quizAnswerCallback} callback - callback function
 */
module.exports.getAllByQuestion = function (question, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (options.population === undefined) {
		options.population = "";
	}
	QuizAnswer.find({question: question._id}).deepPopulate(options.population).exec(function (err, answers) {
		return callback(err, answers);
	});	
};

/**
 * @callback quizAnswerCallback
 * @param {Error} err - if an error occurs
 * @param {QuizAnswer[]} answers - array of updated answer objects
 */
