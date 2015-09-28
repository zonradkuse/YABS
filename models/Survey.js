/**
 * THIS ONE IS DEPRECATED
 * @module Models/Survey
 */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var SurveySchema = mongoose.Schema({
	creator: { type: ObjectId, ref: 'User' },
	creationTime: { type: Date, default: Date.now },
	room: { type: ObjectId, ref: 'Room' },
	userAnswerMaxCount: { type: Number, default: 1 },
	answers: [{ type: ObjectId, ref: 'SurveyAnswer' }],
	userAnswers: [{ type: ObjectId, ref: 'SurveyAnswer' }],
	visible: { type: Boolean, default: true }
});

SurveySchema.plugin(deepPopulate);
var Survey = mongoose.model('Survey', SurveySchema);
module.exports.Survey = Survey;

module.exports.getAllByRoom = function (room, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (options.population === undefined) {
		options.population = "";
	}
	Survey.find({ room: room._id }).deepPopulate(options.population).exec(function (err, survey) {
		return callback(err, survey);
	});
};

module.exports.addSurveyAnswer = function (survey, answer, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	answer.save(function (err) {
		if (err) {
			return callback(err);
		}
		Survey.findByIdAndUpdate(survey._id, { $push: { 'answers': answer._id } }, function (err, survey) {
			return callback(err, survey, answer);
		});
	});
};

module.exports.addUserAnswer = function (survey, answer, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	answer.save(function (err) {
		if (err) {
			return callback(err);
		}
		Survey.findByIdAndUpdate(survey._id, { $push: { 'userAnswers': answer._id } }, function (err, survey) {
			return callback(err, survey, answer);
		});
	});
};
