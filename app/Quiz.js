/** @module Quiz */

var Quiz = require('../models/Quiz.js');
var QuizQuestion = require('../models/QuizQuestion.js');
var QuizAnswer = require('../models/QuizAnswer.js');
var async = require('async');

/** Check if user has already answered.
 * @param {QuizQuestion} question
 * @param {User} user
 * @param {boolCallback} callback - callback function
 */
var hasUserAlreadyAnswered = function (question, user, callback) {
	QuizAnswer.QuizAnswer.find({question: question._id, creator: user._id, type: {$gte: 10}}).exec(function (err, answers) {
		if (err) {
			return callback(err);
		}
		if (answers !== null && answers.length > 0) {
			return callback(null, true);
		} else {
			return callback(null, false);
		}
	});
};

/** Check if the answers of an user to a specific question are right.
 * @param {Question} question
 * @param {User} user
 * @param {boolAnswersCallback} callback - callback function
 */
var areUsersAnswersCorrect = function (question, user, callback) {
	QuizQuestion.getByID(question._id, { population: "rightAnswers" }, function (err, question) {
		if (err) {
			return callback(err);
		}
		QuizAnswer.QuizAnswer.find({question: question._id, creator: user._id, type: {$gte: 10}}).exec(function (err, answers) {
			if (err) {
				return callback(err);
			}
			if (answers) {
				var rightAnswersCount = 0;
				for (var i= 0; i < question.rightAnswers.length; i++) {
					for (var j= 0; j < answers.length; j++) {
						if (checkAnswer(question.rightAnswers[ i ], answers[ j ])) {
							rightAnswersCount++;
						}
					}	
				}
				if (rightAnswersCount == question.rightAnswers.length) {
					return callback(null, true, answers);
				}
			}
			return callback(null, false, answers);
		});
	});
};

/** Check if an answer is a correct answer.
 * @param {Question} question
 * @param {Answer} answer
 * @param {boolCallback} callback - callback function
 */
module.exports.isAnswerCorrect = function (question, answer, callback) {
	QuizQuestion.getByID(question._id, { population: "rightAnswers" }, function (err, question) {
		if (err) {
			return callback(err);
		}
		QuizAnswer.QuizAnswer.find({question: question._id, _id: answer._id}).exec(function (err, answer) {
			if (err) {
				return callback(err);
			}
			if (answer) {
				var isAnswerCorrect = false;
				for (var i= 0; i < question.rightAnswers.length; i++) {
					if (checkAnswer(question.rightAnswers[ i ], answer)) {
						isAnswerCorrect = true;
						break;
					}
				}
				return callback(null, isAnswerCorrect);
			}
			return callback(null, false);
		});
	});
};

/** Check answer.
 * @param {QuizAnswer} rightAnswer - a right answer of a question
 * @param {QuizAnswer} userAnswer - an answer from user to this question
 */
var checkAnswer = function (rightAnswer, userAnswer) {
	var qa_id = rightAnswer.type == QuizAnswer.Types.QA_ID && userAnswer.type == QuizAnswer.Types.UA_ID && 
				rightAnswer._id == userAnswer.answer;
	var qa_input = rightAnswer.type == QuizAnswer.Types.QA_INPUT && userAnswer.type == QuizAnswer.Types.UA_INPUT && 
				checkInput(rightAnswer, userAnswer);
	return qa_id || qa_input;
};

/** Checks the input string of answer, if it is a input answer.
 * @todo regex check
 * @param {QuizAnswer} rightAnswer
 * @param {UserAnswer} userAnswer 
 */
var checkInput = function (rightAnswer, userAnswer) {
	if (rightAnswer.answer == userAnswer.answer) {
		return true;
	}
	return false;
};

/** Load a complete quiz for a specific user.
 * @param {Quiz} quiz
 * @param {User} user
 * @param {quizCallback} callback - callback function
 */
module.exports.loadQuiz = function (quiz, user, callback) {
	Quiz.getByID(quiz._id, {population: "questions.answers"}, function (err, quiz) {
		if (err) {
			return callback(err);
		}
		var questions = [];
		async.each(quiz.questions, function (q, eachCallback) {
			var question = q.toObject();
			delete question.userAnswers;
			delete question.creator;
			delete question.creationTime;
			hasUserAlreadyAnswered(question, user, function (err, hasAnswered) {
				if (err) {
					return callback(err);
				}
				if (hasAnswered) {
					areUsersAnswersCorrect(question, user, function (err, isRight, userAnswers) {
						var answers = [];
						for (var j= 0; j<question.answers.length; j++) {
							var isRightAnswer = false;
							var hasUserSelected = false;

							for (var k= 0; k<question.rightAnswers.length; k++) {
								if (""+ question.rightAnswers[ k ] == ""+ question.answers[ j ]._id) {
									isRightAnswer = true;
									break;
								}
							}

							for (var m= 0; m<userAnswers.length; m++) {
								if (userAnswers[ m ].type == QuizAnswer.Types.UA_ID && userAnswers[ m ].answer == question.answers[ j ]._id) {
									hasUserSelected = true;
									break;
								}
							}

							var answer = {_id: question.answers[ j ]._id };
							if (isRightAnswer) {
								answer.isRightAnswer = isRightAnswer;
							}
							if (hasUserSelected) {
								answer.hasUserSelected = hasUserSelected;
							}
							if (question.answers[ j ].type == QuizAnswer.Types.QA_ID) {
								answer.type = "id";
								answer.answer = question.answers[ j ].answer;
								answers.push(answer);
							} else if (question.answer.type == QuizAnswer.Types.QA_INPUT) {
								answer.type = "input";
								answers.push(answer);
							}
						}
						question.answers = answers;
						question.isUserRight = isRight;
						delete question.rightAnswers;
						questions.push(question);
						eachCallback();
					});
				}else {
					delete question.rightAnswers;
					var answers = [];
					for (var j= 0; j<question.answers.length; j++) {
						if (question.answers[ j ].type == QuizAnswer.Types.QA_ID) {
							answers.push({_id: question.answers[ j ]._id, type: "id", answer: question.answers[ j ].answer});
						} else if (question.answer.type == QuizAnswer.Types.QA_INPUT) {
							answers.push({_id: question[ i ].answers[ j ]._id, type: "input"});
						}
					}
					question.answers = answers;
					questions.push(question);
					eachCallback();
				}
			});
		}, function (err) {
			var q = quiz.toObject();
			q.questions = questions;
			delete q.creator;
			return callback(null, q);
		});
	});
};

/**
 * @callback boolCallback
 * @param {Error} err - if an error occurs
 * @param {Boolean} bool - true on success
 */

/**
 * @callback boolAnswerCallback
 * @param {Error} err - if an error occurs
 * @param {Boolean} bool - true on success
 * @param {QuizAnswers[]} - array of quiz answer objects
 */

/**
 * @callback quizCallback
 * @param {Error} err - if an error occurs
 * @param {Quiz} quiz - quiz object
 */