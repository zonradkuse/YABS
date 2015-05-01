//Quiz worker
var Quiz = require('../models/Quiz.js');
var QuizQuestion = require('../models/QuizQuestion.js');
var QuizAnswer = require('../models/QuizAnswer.js');
var async = require('async');

var hasUserAlreadyAnswered = function(question, user, callback){
	QuizAnswer.QuizAnswer.find({question: question._id, creator: user._id, type: {$gte: 10}}).exec(function(err, answers){
		if(err)
			return callback(err);
		if(answers !== null && answers.length > 0)
			return callback(null, true);
		else
			return callback(null, false);
	});
}

var areUsersAnswersCorrect = function(question, user, callback){
	QuizQuestion.getByID(question._id, { population:"rightAnswers" }, function(err, question){
		if(err)
			return callback(err);
		QuizAnswer.QuizAnswer.find({question: question._id, creator: user._id, type: {$gte: 10}}).exec(function(err, answers){
			if(err)
				return callback(err);
			if(answers){
				var rightAnswersCount = 0;
				for(var i=0; i < question.rightAnswers.length; i++){
					for(var j=0; j < answers.length; j++){
						if(checkAnswer(question.rightAnswers[i], answers[j]))
							rightAnswersCount++;
					}	
				}
				if(rightAnswersCount == question.rightAnswers.length)
					return callback(null, true, answers);
			}
			return callback(null, false, answers);
		});
	});
}

module.exports.isAnswerCorrect = function(question, answer, callback){
	QuizQuestion.getByID(question._id, { population:"rightAnswers" }, function(err, question){
		if(err)
			return callback(err);
		QuizAnswer.QuizAnswer.find({question: question._id, _id: answer._id}).exec(function(err, answer){
			if(err)
				return callback(err);
			if(answer){
				var isAnswerCorrect = false;
				for(var i=0; i < question.rightAnswers.length; i++){
					if(checkAnswer(question.rightAnswers[i], answer)){
						isAnswerCorrect = true;
						break;
					}
				}
				return callback(null, isAnswerCorrect);
			}
			return callback(null, false);
		});
	});
}

var checkAnswer = function(rightAnswer, userAnswer){
	var qa_id = rightAnswer.type == QuizAnswer.Types.QA_ID && userAnswer.type == QuizAnswer.Types.UA_ID 
		&& rightAnswer._id == userAnswer.answer;
	var qa_input = rightAnswer.type == QuizAnswer.Types.QA_INPUT && userAnswer.type == QuizAnswer.Types.UA_INPUT 
		&& checkInput(rightAnswer, userAnswer);
	return qa_id || qa_input;
}

//TODO regex?
var checkInput = function(rightAnswer, userAnswer){
	if(rightAnswer.answer == userAnswer.answer)
		return true;
	return false;
}

module.exports.loadQuiz = function(quiz, user, callback){
	Quiz.getByID(quiz._id, {population:"questions.answers"}, function(err, quiz){
		if(err)
			return callback(err);
		var questions = [];
		async.each(quiz.questions, function(question, eachCallback){
			var question = question.toObject();
			delete question.userAnswers;
			delete question.creator;
			delete question.creationTime;
			hasUserAlreadyAnswered(question, user, function(err, hasAnswered){
				if(err)
					return callback(err);
				if(hasAnswered){
					areUsersAnswersCorrect(question, user, function(err, isRight, userAnswers){
						var answers = [];
						for(var j=0; j<question.answers.length; j++){
							var isRightAnswer = false;
							var hasUserSelected = false;

							for(var k=0; k<question.rightAnswers.length; k++){
								if(""+question.rightAnswers[k] == ""+question.answers[j]._id){
									isRightAnswer = true;
									break;
								}
							}

							for(var k=0; k<userAnswers.length; k++){
								if(userAnswers[k].type == QuizAnswer.Types.UA_ID && userAnswers[k].answer == question.answers[j]._id){
									hasUserSelected = true;
									break;
								}
							}

							var answer = {_id: question.answers[j]._id };
							if(isRightAnswer)
								answer.isRightAnswer = isRightAnswer;
							if(hasUserSelected)
								answer.hasUserSelected = hasUserSelected;
							if(question.answers[j].type == QuizAnswer.Types.QA_ID){
								answer.type = "id";
								answer.answer = question.answers[j].answer;
								answers.push(answer);
							} else if(question.answer.type == QuizAnswer.Types.QA_INPUT){
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
				}else{
					delete question.rightAnswers;
					var answers = [];
					for(var j=0; j<question.answers.length; j++){
						if(question.answers[j].type == QuizAnswer.Types.QA_ID)
							answers.push({_id: question.answers[j]._id, type:"id", answer: question.answers[j].answer});
						else if(question.answer.type == QuizAnswer.Types.QA_INPUT)
							answers.push({_id: question[i].answers[j]._id, type:"input"});
					}
					question.answers = answers;
					questions.push(question);
					eachCallback();
				}
			});
		},function(err){
			var q = quiz.toObject();
			q.questions = questions;
			delete q.creator;
			return callback(null, q);
		});
	});
}