/**
 * THIS ONE IS DEPRECATED!
 * @module Models/QuizQuestion
 */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var QuizQuestionSchema = mongoose.Schema({
	creator: { type : ObjectId, ref: 'User' },
	creationTime: { type: Date, default: Date.now },
	question: String,
	answers: [{ type: ObjectId , ref: 'QuizAnswer'}],
	rightAnswers: [{ type: ObjectId, ref: 'QuizAnswer' }],
	userAnswers: [{ type: ObjectId, ref: 'QuizAnswer' }],
	visible: { type: Boolean, default: true }
});

QuizQuestionSchema.plugin(deepPopulate);
/**
 * @class
 * @classdesc This is a moongose schema for questions of a quiz.
 * @property {ObjectId} creator - user refId
 * @property {Date} creationTime=Date.now - creation time
 * @property {String} question - question
 * @property {ObjectId[]} answers - answers of the question, like A,B,C,D
 * @property {ObjectId[]} rightAnswers - right answers of question, maybe input field
 * @property {ObjectId[]} userAnswers - the answers from all users
 * @property {Boolean} visible=true - visibility
 * @example
 * new QuizQuestion({creator: ObjectId, question: "Who are you?"});
 */
var QuizQuestion = mongoose.model('QuizQuestion', QuizQuestionSchema);
module.exports.QuizQuestion = QuizQuestion;

/** Get question by the ObjectId.
 * @param {ObjectId} questionID - ObjectId of question
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {quizQuestionCallback} callback - callback function
 */
module.exports.getByID = function (questionID, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (options.population === undefined) {
		options.population = "";
	}
	QuizQuestion.findById(questionID).deepPopulate(options.population).exec(function (err, question) {
		return callback(err, question);
	});
};

/** Add a possible answer to a question object.
 * @param {QuizQuestion} question - question object
 * @param {QuizAnswer} answer - answer object that should be added
 * @param {addAnswerCallback} callback - callback function
 */
module.exports.addQuizAnswer = function (question, answer, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	answer.save(function (err) {
		if (err) {
			return callback(err);
		}
		QuizQuestion.findByIdAndUpdate(question._id, {$push: {'answers': answer._id}}, function (err, question) {
			return callback(err, question, answer);
		});
	});
};

/** With this function you can mark a QuizAnswer object as right answer.
 * @param {QuizQuestion} question - question object
 * @param {QuizAnswer} answer - answer object that should be right
 * @param {quizQuestionCallback} callback - callback function
 */
module.exports.markAnswerAsRight = function (question, answer, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	QuizQuestion.findByIdAndUpdate(question._id, {$push: {'rightAnswers': answer._id}}, function (err, question) {
		return callback(err, question);
	});
};

/** Save an answer from an user, given on a specific question, and add it to the question object.
 * @param {QuizQuestion} question - question object
 * @param {QuizAnswer} answer - answer from user
 * @param {addAnswerCallback} callback - callback function
 */
module.exports.addUserAnswer = function (question, answer, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (answer.type === undefined || answer.type < 10) {
		throw new Error("answer.type not correct, it must be greater than 10");
	}
	answer.save(function (err) {
		if (err) {
			return callback(err);
		}
		QuizQuestion.findByIdAndUpdate(question._id, {$push: {'userAnswers': answer._id}}, function (err, question) {
			return callback(err, question, answer);
		});
	});
};

/**
 * @callback quizQuestionCallback
 * @param {Error} err - if an error occurs
 * @param {QuizQuestion} question - updated question object
 */

/**
 * @callback addAnswerCallback
 * @param {Error} err - if an error occurs
 * @param {QuizQuestion} question - updated question object
 * @param {QuizAnswer} answer - updated answer object
 */
