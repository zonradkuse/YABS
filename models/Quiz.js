var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var QuizSchema = mongoose.Schema({
	creator: { type : ObjectId, ref: 'User' },
	creationTime: { type: Date, default: Date.now },
	//room: { type: ObjectId, ref: 'Room' },
	questions: [{ type: ObjectId , ref: 'QuizQuestion'}],
	visible: { type: Boolean, default: true }
});

QuizSchema.plugin(deepPopulate);
var Quiz = mongoose.model('Quiz', QuizSchema);
module.exports.Quiz = Quiz;

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
