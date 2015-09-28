/** @module Quiz-Model */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var QuizSchema = mongoose.Schema({
	creator: { type : ObjectId, ref: 'User' },
	creationTime: { type: Date, default: Date.now },
	room: { type: ObjectId, ref: 'Room' },
	questions: [{ type: ObjectId , ref: 'QuizQuestion'}],
	visible: { type: Boolean, default: true }
});

QuizSchema.plugin(deepPopulate);
/**
 * @class
 * @classdesc This is a moongose schema for a quiz. A quiz consists of questions that should be answered by the users.
 * @property {ObjectId} creator - user refId
 * @property {Date} creationTime=Date.now - creation time
 * @property {ObjectId} room - room refId
 * @property {ObjectId[]} questions - questions of the quiz
 * @property {Boolean} visible=true - visibility
 * @example
 * new Quiz({creator: ObjectId{User}, room: ObjectId{Room}});
 */
var Quiz = mongoose.model('Quiz', QuizSchema);
module.exports.Quiz = Quiz;

/** Get quiz by the ObjectId.
 * @param {ObjectId} quizID - ObjectId of quiz
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {quizCallback} callback - callback function
 */
module.exports.getByID = function (quizID, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (options.population === undefined) {
		options.population = "";
	}
	Quiz.findById(quizID).deepPopulate(options.population).exec(function (err, quiz) {
		return callback(err, quiz);
	});
};

/** Get all quizzes of a room.
 * @param {Room} room - room object
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {quizCallback} callback - callback function
 */
module.exports.getAllByRoom = function (room, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (options.population === undefined) {
		options.population = "";
	}
	Quiz.find({room: room._id}).deepPopulate(options.population).exec(function (err, quiz) {
		return callback(err, quiz);
	});
};

/** Add a question to a quiz.
 * @param {Quiz} quiz - quiz object
 * @param {QuizQuestion} question - question that should be added
 * @param {quizQuestionCallback} callback - callback function
 */
module.exports.addQuestion = function (quiz, question, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	question.save(function (err) {
		if (err) {
			return callback(err);
		}
		Quiz.findByIdAndUpdate(quiz._id, {$push: {'questions': question._id}}, function (err, quiz) {
			return callback(err, quiz, question);
		});
	});
};

/**
 * @callback quizCallback
 * @param {Error} err - if an error occurs
 * @param {Quiz} quiz - updated quiz object
 */

/**
 * @callback quizQuestionCallback
 * @param {Error} err - if an error occurs
 * @param {Quiz} quiz - updated quiz object
 * @param {QuizQuestion} question - updated question object
 */
