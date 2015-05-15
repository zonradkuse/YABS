/** @module Answer Model */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;
var Question = require('../models/Question.js').Question;

var AnswerSchema = mongoose.Schema({
	author: {
		type: ObjectId,
		ref: 'User'
	},
	creationTime: {
		type: Date,
		default: Date.now
	},
	updateTime: {
		type: Date,
		default: Date.now
	},
	isAnswer: {
		type: Boolean,
		default: false
	},
	deleted: {
		type: Boolean,
		default: false
	},
	content: String,
	images: [{ type: ObjectId, ref: 'Image' }],
	visible: {
		type: Boolean,
		default: true
	}
});

AnswerSchema.plugin(deepPopulate);
/**
 * @class
 * @classdesc This is a moongose schema for an answer of a question.
 * @property {ObjectId} author - user refId
 * @property {Date} creationTime=Date.now - creation time
 * @property {Date} updateTime=Date.now - the time when the last change has been performed
 * @property {Boolean} isAnswer=false - ???
 * @property {Boolean} deleted=false - ???
 * @property {String} content - the question text
 * @property {ObjectId[]} images - image refId, images in answer
 * @property {Boolean} visible=true - visibility
 * @example
 * new Answer({author: ObjectId{User}, content: "Sunny weather!"});
 */
var Answer = mongoose.model('Answer', AnswerSchema);
module.exports.Answer = Answer;
module.exports.AnswerSchema = AnswerSchema;

/** Set new content of answer.
 * @param {Answer} answer - answer object
 * @param {String} content - new content
 * @param {answerCallback} callback - callback function
 */
module.exports.setContent = function (answer, content, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Answer.findByIdAndUpdate(answer._id, { 'content': content, 'updateTime': Date.now() }, function (err, answer) {
		return callback(err, answer);
	});
};

/** WTF???.
 * @param {Answer} answer - answer object
 * @param {Boolean} bool - ???
 * @param {answerCallback} callback - callback function
 */
module.exports.setContent = function (answer, bool, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Answer.findByIdAndUpdate(answer._id, { 'isAnswer': bool, 'updateTime': Date.now() }, function (err, answer) {
		return callback(err, answer);
	});
};

/** Set visibility of answer.
 * @param {Answer} answer - answer object
 * @param {Boolean} visible - visibility
 * @param {answerCallback} callback - callback function
 */
module.exports.setVisibility = function (answer, visible, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Answer.findByIdAndUpdate(answer._id, { 'visible': visible, 'updateTime': Date.now() }, function (err, answer) {
		return callback(err, answer);
	});
};

/** Remove answer from system.
 * @param {Answer} answer - answer object
 * @param {errorCallback} callback - callback function
 */
module.exports.remove = function (answer, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Question.update({'answers': answer._id}, {$pull: {'answers': answer._id}}, function (err) {
		if (err) {
			return callback(err);
		}
		Answer.findByIdAndRemove(answer._id, function (err) {
			return callback(err);
		});
	});
};

/** Get answer by the ObjectId.
 * @param {Answer} answer - answer object
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {answerCallback} callback - callback function
 */
module.exports.getByID = function (answerID, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Answer.findById(answerID).deepPopulate(options.population).exec(function (err, answer) {
		return callback(err, answer);
	});
};

/**
 * @callback answerCallback
 * @param {Error} err - if an error occurs
 * @param {Answer} answer - updated answer object
 */

 /**
 * @callback errorCallback
 * @param {Error} err - if an error occurs
 */
