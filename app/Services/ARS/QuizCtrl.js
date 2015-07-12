/*
 * TODO
 * ----
 * Here goes logic for:
 * - creating a quiz, including timing
 * - Evaluating Answers
 * - doing statistical work --> should be async 
 */
/** @module QuizCtrl*/
var async = require('async');
var Scheduler = require('../Timing/Scheduler.js');
var Timer = new Scheduler({ autoFin : false, registerLoopElements : 10 });
var Rooms = require('../../../models/Room.js');
var QuestionModel = require('../../../models/ARSModels/Question.js').ARSQuestion;
var ARSAnswer = require('../../../models/ARSModels/Answer.js').ARSAnswer;
var QuizModel = require('../../../models/ARSModels/Quiz.js').ARSQuiz;
var QuizQuestionModel = require('../../../models/ARSModels/QuizQuestion.js').ARSQuizQuestion;
var StatisticModel = require('../../../models/ARSModels/Statistic.js').ARSStatistic;
var StatisticObjModel = require('../../../models/ARSModels/StatisticObj.js').StatisticObj;
var logger = require('../../Logger.js');


var getAllQuizInRoom = function (roomId, options, callback) {
    Rooms.Room.findOne({ _id : roomId}).deepPopulate('quiz.questions ' + options.deepPopulate).exec(function (err, rooms) {
        if (err) {
            logger.warn(err);
            return callback(err);
        }
        callback(null, rooms.quiz);
    });
};

var newQuiz = function (params, callback) {
	var dueDate;
    if (typeof params.dueDate === 'number') {
    	dueDate = params.dueDate;
    } else {
        return cb(new Error("dueDate is invalid"));
    }

    if (dueDate < 0) {
    	return callback(new Error("dueDate is in the past"));
    }

    var asyncTasks = [];

	var _quiz = new QuizModel();
	
	params.questions.forEach(function (item) {
	    asyncTasks.push(function (questionCallback) {
		    var _question = new QuestionModel();
			_question.description = item.description;
		    _question.dueDate = dueDate* 1000 + Date.now();
		    _question.active = true;
			var _quizQuestion = new QuizQuestionModel();
		    var _statistic = new StatisticModel();
		    _statistic.save();
		    _quizQuestion.statistics = _statistic._id;

			_question.quizQuestion = _quizQuestion._id;
			_quizQuestion.quiz = _quiz._id;

			var _tempAnswers = []; // having something like a transaction to prevent saving invalid data
			var i;
			for (i = item.answers.length - 1; i >= 0; i--) {
				var _answer = new ARSAnswer();
				var answerParam = item.answers[ i ];
				_answer.description = answerParam.description;
				if (answerParam.radiobox && (answerParam.checkbox || answerParam.text) || // Prevent multiple fieldsettings
		            answerParam.text && (answerParam.checkbox || answerParam.radiobox) ||
		            answerParam.checkbox && (answerParam.text || answerParam.radiobox)) {
					Timer.clearTimer(_tId);
					return callback(new Error("Bad field settings."));
				}
				_answer.radiobox = answerParam.radiobox;
				_answer.checkbox = answerParam.checkbox;
				_answer.text = answerParam.text;
				_quizQuestion.answers.push(_answer._id); //reference the new answer
				_tempAnswers.push(_answer);
			}

			_quiz.questions.push(_question._id);
			
			async.each(_tempAnswers, function (item, answersCallback) {
				item.save(function (err) {
					answersCallback(err);
				});
			}, function (err) {
				if (err) {
					callback(err);
				}
				console.log(JSON.stringify(_quizQuestion, null, 2));

				_quizQuestion.save(function (err) {
					_question.save(function (saveErr) {
						questionCallback(saveErr);
					});
				});
			});
		});
	});

	async.parallel(asyncTasks, function (asyncErr) {
		if (asyncErr) {
			callback(asyncErr);
		}
		_quiz.save(function (err) {
			if (err) {
				callback(err);
			}

            QuizModel.findOne({ _id : _quiz._id}).deepPopulate('questions.quizQuestion.answers').exec(function (err, quiz) {
            	console.log(JSON.stringify(quiz, null, 2));
                if (err) {
                    logger.warn("An error occured when populating new Quiz " + err);
                    callback(err);
                } else {
                    Rooms.getByID(params.roomId, {population : ''}, function (err, room) {
                        room.hasQuiz = true;
                        room.quiz.push(quiz._id);
                        room.save(function (err) {
                            if (err) {
                                logger.warn("An error occurred on room update when creating a new quiz: " + err);
                                return callback(err);
                            }
                            callback(null, quiz);
                        });
                    });
                }
            });	        
	    });
	});
};


var answer = function (params, callback) {
    // params.userId, params.answerId, params.arsId, params.roomId
    QuestionModel.findOne({ _id : params.arsId }).deepPopulate('quizQuestion.statistics.statisticAnswer.answer').exec(function (err, question) {
        if (err) {
            logger.debug(err);
            return callback(err);
        }
        for (var l = 0; l < question.answered.length; ++l) {
            if (params.userId === question.answered[ l ].toString()) {
                return callback(new Error("You already answered this one."));
            }
        }
        question.answered.push(params.userId);
        question.save();
        if (question.active && question.dueDate - question.timestamp + 1000 > 0) {
            // we can answer this one
            var _statObj,
                existing = false,
                answered = false;
            for (var j = 0; j < params.answerId.length; ++j) {

                for (var k = 0; k < question.quizQuestion.answers.length; ++k) {

                    logger.debug(question.quizQuestion.answers[ k ].toString());
                    
                    if (params.answerId[ j ] === question.quizQuestion.answers[ k ].toString()) {
                        
                        for (var i = 0; i < question.quizQuestion.statistics.statisticAnswer.length; ++i) {

                            if (question.quizQuestion.statistics.statisticAnswer[ i ].answer && params.answerId[ j ] === question.quizQuestion.statistics.statisticAnswer[ i ].answer.toString()) {
                                logger.debug(question.quizQuestion.statistics.statisticAnswer[ i ].answer.toString());
                                // there is already an object for this answer
                                answered = true;
                                StatisticObjModel.findOne(question.quizQuestion.statistics.statisticAnswer[ i ]._id).exec(function (err, obj) {
                                    if (!err && obj) {
                                        obj.count++;
                                        obj.save();
                                    }
                                });
                                break;
                            }

                        }

                        if (!answered) {
                            _statObj = new StatisticObjModel();
                            _statObj.count = 1;
                            _statObj.answer = params.answerId[ j ];
                            _statObj.save();
                            question.quizQuestion.statistics.statisticAnswer.push(_statObj._id);
                            question.quizQuestion.statistics.save();
                        } else {
                            answered = false;
                        }
                        existing = true;
                        break;
                    }
                }
            }

            if (!existing) {
                return callback(new Error("This answer does not exist."));
            } else {
                question.quizQuestion.save();
                process.nextTick(function () {
                    callback(null, q); // TODO make sure that statistics field is populated
                });
            }
        } else {
        	callback(new Error("This question is not active."));
        }

        /* else {
            if (question.active) { // the server died during the poll, we need a cleanup TODO: check time overaprrox of the previous reset.
                question.active = false;
                Rooms.findByID({ _id: params.roomId}, function (err, room) {
                    if (err) {
                        logger.warn(err);
                        return callback(err);
                    }
                    delete room.quiz[ question.quizQuestion.quiz ];
                    if (room.hasQuiz && room.quiz.length === 0) {
                        room.hasQuiz = false;
                    }
                    question.active = false;
                    question.save();
                    room.save();
                    logger.info("cleaned up question activity flag and reset room.");
                });
            }
            return callback(new Error("Time is up."));
        }*/
    });
};


module.exports.getAllQuizInRoom = getAllQuizInRoom;
module.exports.newQuiz = newQuiz;
