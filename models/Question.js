/** Model of Question
* @param {Number} author The user identifier.
* @param {Timestamp} time Timestamp of creation
* @param {List} vote List of uids of voters
* @param {String} content The content of this question
* @param {Answers[]} answers The list of answers
*/

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;
var Room = require('../models/Room.js').Room;

var QuestionSchema = mongoose.Schema({
	author: { type : ObjectId, ref: 'User' },
	creationTime: { type: Date, default: Date.now },
	updateTime: { type: Date, default: Date.now },
	content: String,
	votes: [{ type : ObjectId, ref: 'User', unique: true }],
	images: [{ type: ObjectId, ref: 'Image' }],
	answers: [{ type : ObjectId, ref: 'Answer' }],
	visible: { type: Boolean, default: true }
});

QuestionSchema.plugin(deepPopulate);
var Question = mongoose.model('Question', QuestionSchema);
module.exports.Question = Question;
module.exports.QuestionSchema = QuestionSchema;

/*
* @param question the target question object
* @param content the new content of the question
* @param callback params: error, question object
*/
module.exports.setContent = function (question, content, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Question.findByIdAndUpdate(question._id, { 'content': content, 'updateTime': Date.now() }, function (err, question) {
		return callback(err, question);
	});
};

/*
* @param question the target question object
* @param visible set true for visible, false otherwise
* @param callback params: error, question object
*/
module.exports.setVisibility = function (question, visible, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Question.findByIdAndUpdate(question._id, { 'visible': visible, 'updateTime': Date.now() }, function (err, question) {
		return callback(err, question);
	});
};

/*
* @param question the question object which should be removed
* @param callback params: error
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

/*
* @param questionID the ID of the target question object
* @param options used for deepPopulation
* @param callback params: error, question object
*/
module.exports.getByID = function (questionID, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Question.findById(questionID).deepPopulate(options.population).exec(function (err, question) {
		return callback(err, question);
	});
};

/*
* @param question the target question object
* @param user the user object, which voted
* @param callback params: error, question object
*/
module.exports.vote = function (question, user, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Question.findByIdAndUpdate(question._id, {$push: {'votes': user._id}}, function (err, question) {
		return callback(err, question);
	});
};

/*
* @param question the target question object
* @param options used for deepPopulation
* @param callback params: error, array of user objects which voted
*/
module.exports.getVotes = function (question, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Question.findById(question._id, 'votes').deepPopulate(options.population).exec(function (err, question) {
		return callback(err, question.votes);
	});
};

/*
* @param question the target question object
* @param callback params: error, number of votes
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

/*
* @param question the target question object
* @param answer the answer object which should be added
* @param callback params: error, question object, answer object
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
