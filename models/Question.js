/** @module Question Model */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;
var Room = require('../models/Room.js').Room;
var logger = require('../app/Logger.js');

var QuestionSchema = mongoose.Schema({
	author: { type : ObjectId, ref: 'User' },
	creationTime: { type: Date, default: Date.now },
	updateTime: { type: Date, default: Date.now },
	content: String,
	votes: [{ type : ObjectId, ref: 'User', unique: true }],
	images: [{ type: ObjectId, ref: 'Image' }],
	answers: [{ type : ObjectId, ref: 'Answer' }],
	visible: { type: Boolean, default: true },
	markedAsGood : Boolean
});

QuestionSchema.plugin(deepPopulate);
/**
 * @class
 * @classdesc This is a moongose schema for a question of a room.
 * @property {ObjectId} author - user refId
 * @property {Date} creationTime=Date.now - creation time
 * @property {Date} updateTime=Date.now - the time when the last change has been performed
 * @property {String} content - the question text
 * @property {ObjectId[]} votes - user refId, users who have voted
 * @property {ObjectId[]} images - image refId, images in question
 * @property {ObjectId[]} answers - answer refId
 * @property {Boolean} visible=true - visibility
 * @example
 * new Question({author: ObjectId{User}, content: "Who are you?"});
 */
var Question = mongoose.model('Question', QuestionSchema);
module.exports.Question = Question;
module.exports.QuestionSchema = QuestionSchema;

/** Set content of question.
 * @param {Question} question - question object
 * @param {String} content - new content
 * @param {questionCallback} callback - callback function
 */
module.exports.setContent = function (question, content, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Question.findByIdAndUpdate(question._id, { 'content': content, 'updateTime': Date.now() }, function (err, question) {
		return callback(err, question);
	});
};

/** Set visibility of question.
 * @param {Question} question - question object
 * @param {Boolean} visible - visibility
 * @param {questionCallback} callback - callback function
 */
module.exports.setVisibility = function (question, visible, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Question.findByIdAndUpdate(question._id, { 'visible': visible, 'updateTime': Date.now() }, function (err, question) {
		return callback(err, question);
	});
};

/** Remove question from the system.
 * @param {Question} question - question object
 * @param {errorCallback} callback - callback function
 */
module.exports.remove = function (question, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Room.update({'questions': question._id}, {$pull: {'questions': question._id}}, function (err) {
		if (err) {
			return callback(err);
		}
		Question.findByIdAndRemove(question._id, function (err) {
			return callback(err);
		});
	});
};

/** Get question by the ObjectId.
 * @param {ObjectId} questionID - ObjectId of question
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {questionCallback} callback - callback function
 */
module.exports.getByID = function (questionID, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (!options || options.population === undefined) {
		options.population = "";
	}
	Question.findById(questionID).deepPopulate(options.population).exec(function (err, question) {
		return callback(err, question);
	});
};

/** Add a vote from an user to question.
 * @param {Question} question - question object
 * @param {User} user - user who has voted
 * @param {questionCallback} callback - callback function
 */
module.exports.vote = function (question, user, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Question.findByIdAndUpdate(question._id, {$push: {'votes': user._id}}, function (err, question) {
		logger.debug(user);
		logger.debug(question);
		Question.findOne({ _id : question._id }, function (err,q) {
			logger.debug(q);
			return callback(err, q);
		});
	});
};

/** Get all votes from question.
 * @param {Question} question - question object
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {votesCallback} callback - callback function
 */
module.exports.getVotes = function (question, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (options.population === undefined) {
		options.population = "";
	}
	Question.findById(question._id, 'votes').deepPopulate(options.population).exec(function (err, question) {
		return callback(err, question.votes);
	});
};

/** Count the votes of question.
 * @param {Question} question - question object
 * @param {votesCountCallback} callback - callback function
 */
module.exports.getVotesCount = function (question, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Question.aggregate([{$match: {'_id': new mongoose.Types.ObjectId(question._id)}}, {$project: {count: {$size: '$votes'}}}], function (err, questions) {
		if (err) {
			throw err;
		}
		if (questions.length === 0) {
			return callback(new Error("Question not found."), null);
		}
		return callback(err, questions[ 0 ].count);
	});
};

/** Add answer to question and store it to the database.
 * @param {Question} question - question object
 * @param {Answer} answer - answer object
 * @param {questionAnswerCallback} callback - callback function
 */
module.exports.addAnswer = function (question, answer, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	answer.save(function (err) {
		if (err) {
			return callback(err);
		}
		Question.findByIdAndUpdate(question._id, {$push: {'answers': answer._id}}, function (err, question) {
			return callback(err, question, answer);
		});
	});
};

/**
 * @callback questionCallback
 * @param {Error} err - if an error occurs
 * @param {Question} question - updated question object
 */

/**
 * @callback errorCallback
 * @param {Error} err - if an error occurs
 */

/**
 * @callback votesCallback
 * @param {Error} err - if an error occurs
 * @param {User[]} votes - array of voters
 */

/**
 * @callback votesCountCallback
 * @param {Error} err - if an error occurs
 * @param {Number} votesCount - amount of votes
 */

 /**
 * @callback questionAnswerCallback
 * @param {Error} err - if an error occurs
 * @param {Question} question - updated question object
 * @param {Answer} answer - updated answer object
 */
