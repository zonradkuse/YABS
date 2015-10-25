/**
 * @file
 * @author Jens Piekenbrinck [jens.piekenbrinck@rwth-aachen.de]
 * @module QuizController
 */
var async = require('async');
var Scheduler = require('../Timing/Scheduler.js');
var Rooms = require('../../../models/Room.js');
var QuestionModel = require('../../../models/ARSModels/Question.js').ARSQuestion;
var ARSAnswer = require('../../../models/ARSModels/Answer.js').ARSAnswer;
var QuizModel = require('../../../models/ARSModels/Quiz.js').ARSQuiz;
var QuizQuestionModel = require('../../../models/ARSModels/QuizQuestion.js').ARSQuizQuestion;
var StatisticModel = require('../../../models/ARSModels/Statistic.js').ARSStatistic;
var StatisticObjModel = require('../../../models/ARSModels/StatisticObj.js').StatisticObj;
var EvaluationModel = require('../../../models/ARSModels/Evaluation.js').Evaluation;
var QuizUserAnswerModel = require('../../../models/ARSModels/QuizUserAnswer.js').ARSQuizUserAnswer;
var logger = require('../../Logger.js');

var getStatistics = function (quizId, cb) {
    QuizModel.findOne( { _id : quizId }).deepPopulate('questions.quizQuestion.answers questions.quizQuestion.statistics.statisticAnswer.answer').exec(function (err, quiz) {
        if (err) {
            logger.warn(err);
            return cb(err);
        }
        return cb(null, quiz);
    });
};

var getAllQuizzes = function (roomId, options, callback) {
    if (!options) { //srsly. do this everywhere! it'll throw exceptions if u don't. This are options, make them kinda optional!
        options = {};
    }
    if (!options.deepPopulate) {
        options.deepPopulate = '';
    }

    Rooms.Room.findOne({ _id : roomId}).deepPopulate('quiz.questions.quizQuestion.answers').exec(function (err, room) {
        if (err) {
            logger.warn(err);
            return callback(err);
        }
        callback(null, room.quiz);
    });
};
/**
 * gets single quiz by id and adds evaluation. important. if an answer is not bad, it is correct!
 */
var getQuiz = function (userId, quizId, options, callback) {
    if (!options) {
        options = {};
    }
    if (!options.deepPopulate) {
        options.deepPopulate = '';
    }
    QuizModel.findOne({ _id : quizId }).deepPopulate('questions.quizQuestion.answers questions.quizQuestion.evaluation.answers questions.quizQuestion.givenAnswers.answers '+ options.deepPopulate).exec(function (err, quiz) {
        if (err || !quiz) {
            return callback(err);
        }

        var evaluationUserAnswers = {};
        evaluationUserAnswers.userFalse = [];
        evaluationUserAnswers.userRight = [];

        var q = {};
        quiz = quiz.toObject();
        var answered = false;

        for (var h = 0; h < quiz.questions.length; h++) {
            logger.debug(JSON.stringify(quiz.questions[ h ]));
            for (var l = 0; l < quiz.questions[ h ].answered.length; ++l) {
                if (userId.toString() === quiz.questions[ h ].answered[ l ].toString()) {
                    answered = true;
                    break;
                }
            }
        }
        quiz.answered = answered;

        for (var i= 0; i<quiz.questions.length; i++) { // every question belonging to quiz
            q = quiz.questions[ i ];
            if (answered) {
                var userReallyAnswered = false;
                for (var k= 0; k < q.quizQuestion.givenAnswers.length; k++) { // every answer given by user
                    if (q.quizQuestion.givenAnswers[ k ].user.toString() === userId.toString()) { // if user in givenAnswers found
                        userReallyAnswered = true;
                        for (var j= 0; j < q.quizQuestion.givenAnswers[ k ].answers.length; j++) { // for every answer made
                            // answers array could be empty!! - case: user answered
                            q.givenAnswers = q.quizQuestion.givenAnswers[ k ].answers;
                            if (q.quizQuestion.evaluation.answers.length === 0) {
                                evaluationUserAnswers.userFalse.push(q.quizQuestion.givenAnswers[ k ].answers[ j ]);
                            } else {
                                if (isAnswerInEvaluationAndCorrect( // case: answer is in evaluation.
                                        q.quizQuestion.givenAnswers[ k ].answers[ j ],
                                        q.quizQuestion.evaluation
                                    )
                                ) {
                                    evaluationUserAnswers.userRight.push(q.quizQuestion.givenAnswers[ k ].answers[ j ]._id.toString());
                                } else {
                                    evaluationUserAnswers.userFalse.push(q.quizQuestion.givenAnswers[ k ].answers[ j ]._id.toString());
                                }
                            }
                        }
                        // case: every(!) evaluation is in givenAnswers
                        for (var o = 0; o < q.quizQuestion.evaluation.answers.length; o++) {
                            if (!isEvaluationInUserAnswer(q.quizQuestion.evaluation.answers[ o ], q.quizQuestion.givenAnswers[ k ].answers)) {
                                evaluationUserAnswers.userFalse.push(q.quizQuestion.evaluation.answers[ o ]._id.toString());
                            } else {
                                evaluationUserAnswers.userRight.push(q.quizQuestion.evaluation.answers[ o ]._id.toString());
                            }
                        }
                        break;
                    }
                }
                // case: user might not have answered but there are answers in evaluation. then user is wrong
                if (!userReallyAnswered) {
                    for (var p = 0; p < q.quizQuestion.evaluation.answers.length; p++) {
                        evaluationUserAnswers.userFalse.push(q.quizQuestion.evaluation.answers[ p ]._id.toString());
                    }
                }
            }
            delete q.quizQuestion.givenAnswers;
            delete q.answered;
            if (!answered) {
                delete q.quizQuestion.evaluation;
            }
            q.evaluationUserAnswers = evaluationUserAnswers;
            quiz.questions[ i ] = q;
        }
        return callback(null, quiz);
    });
};

/**
 * @private
 */
var isAnswerInEvaluationAndCorrect = function (answer, evaluation) {
    for (var index = 0; index < evaluation.answers.length; index++) {
        if (answer._id.toString() === evaluation.answers[ index ]._id.toString()) {
            if (!evaluation.answers[ index ].text) {
                return true;
            } else {
                return (answer.userText && answer.userText.toUpperCase() === evaluation.answers[ index ].userText.toUpperCase());
            }
        }
    }
    return false;
};

var isEvaluationInUserAnswer = function (evalAnswer, allUserAnswers) {
    for (var m = 0; m < allUserAnswers.length; m++) {
        if (evalAnswer._id.toString() === allUserAnswers[ m ]._id.toString()) {
            if (allUserAnswers[ m ].text) {
                return (allUserAnswers[ m ].userText && allUserAnswers[ m ].userText.toUpperCase() === evalAnswer.userText.toUpperCase());
            } else {
                return true;
            }
        }
    }
    return false;
};

var newQuiz = function (params, callback) {
    var dueDate;
    if (typeof params.dueDate === 'number') {
        dueDate = params.dueDate;
    } else {
        return callback(new Error("dueDate is invalid"));
    }

    if (dueDate < 0) {
        return callback(new Error("dueDate is in the past"));
    }

    var asyncTasks = [];

    var _quiz = new QuizModel();
    _quiz.description = params.description;

    params.questions.forEach(function (item) {
        asyncTasks.push(function (questionCallback) {
            var _question = new QuestionModel();
            _question.description = item.description;
            _question.dueDate = dueDate* 1000 + Date.now();
            _question.active = true;
            var _quizQuestion = new QuizQuestionModel();
            var _statistic = new StatisticModel();
            var _evaluation = new EvaluationModel();
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
                    return questionCallback(new Error("Bad field settings."));
                }
                _answer.radiobox = answerParam.radiobox;
                _answer.checkbox = answerParam.checkbox;
                _answer.text = answerParam.text;
                _answer.userText = answerParam.rightAnswer;
                _quizQuestion.answers.push(_answer._id); //reference the new answer
                if (answerParam.rightAnswer) {
                    _evaluation.answers.push(_answer._id);
                }
                _tempAnswers.push(_answer);
            }

            _quiz.questions.push(_question._id);

            async.each(_tempAnswers, function (item, answersCallback) {
                item.save(function (err) {
                    return answersCallback(err);
                });
            }, function (err) {
                if (err) {
                    return questionCallback(err);
                }
                _quizQuestion.evaluation = _evaluation._id;

                _evaluation.save(function (evaluationErr) {
                    _quizQuestion.save(function (quizQuestionErr) {
                        _question.save(function (saveErr) {
                            var error = (evaluationErr) ? evaluationErr : ((quizQuestionErr) ? quizQuestionErr : saveErr);
                            return questionCallback(error);
                        });
                    });
                });
            });
        });
    });

    async.parallel(asyncTasks, function (asyncErr) {
        if (asyncErr) {
            return callback(asyncErr);
        }
        _quiz.save(function (err) {
            if (err) {
                return callback(err);
            }
            QuizModel.findOne({ _id : _quiz._id}).deepPopulate('questions.quizQuestion.answers').exec(function (err, quiz) {
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
                            return callback(null, quiz);
                        });
                    });
                }
            });
        });
    });
};


var answer = function (userId, roomId, questionId, answerIds, callback) {
    // params.userId, params.answerIds, params.arsId, params.roomId
    QuestionModel.findOne({ _id : questionId }).deepPopulate('quizQuestion.statistics.statisticAnswer.answer quizQuestion.evaluation').exec(function (err, question) {
        if (err) {
            logger.warn(err);
            return callback(err);
        }
        for (var l = 0; l < question.answered.length; ++l) {
            if (userId.toString() === question.answered[ l ].toString()) {
                return callback(new Error("You already answered this one."));
            }
        }
        var quizUserAnswer = new QuizUserAnswerModel();
        quizUserAnswer.user = userId;
        quizUserAnswer.answers = answerIds;
        question.quizQuestion.givenAnswers.push(quizUserAnswer);

        question.answered.push(userId);
        quizUserAnswer.save();
        question.save();
        if (question.active && question.dueDate - question.timestamp + 1000 > 0) {
            // we can answer this one
            var _statObj,
                existing = false,
                answered = false,
                allAnswersRight = true;
            var evaluationUserAnswers = {};
            evaluationUserAnswers.userFalse = [];
            evaluationUserAnswers.userRight = [];

            for (var j = 0; j < answerIds.length; ++j) {

                for (var k = 0; k < question.quizQuestion.answers.length; ++k) {

                    logger.debug(question.quizQuestion.answers[ k ].toString());

                    if (answerIds[ j ].toString() === question.quizQuestion.answers[ k ].toString()) {

                        for (var i = 0; i < question.quizQuestion.statistics.statisticAnswer.length; ++i) {
                            if (question.quizQuestion.statistics.statisticAnswer[ i ].answer && answerIds[ j ].toString() === question.quizQuestion.statistics.statisticAnswer[ i ].answer._id.toString()) {
                                answered = true;
                                StatisticObjModel.findOne({ _id : question.quizQuestion.statistics.statisticAnswer[ i ]._id.toString() }).exec(function (err, obj) {
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
                            _statObj.answer = answerIds[ j ];
                            _statObj.save();
                            question.quizQuestion.statistics.statisticAnswer.push(_statObj._id);
                            question.quizQuestion.statistics.save();
                        } else {
                            answered = false;
                        }

                        existing = true;

                        for (var m = 0; m < question.quizQuestion.evaluation.answers.length; m++) {
                            if (answerIds[ j ].toString() === question.quizQuestion.evaluation.answers[ m ].toString()) {
                                allAnswersRight = allAnswersRight && true;
                                evaluationUserAnswers.userRight.push(answerIds[ j ]);
                                break;
                            } else {
                                //code for wrong answer goes here...
                                allAnswersRight = false;
                                evaluationUserAnswers.userFalse.push(answerIds[ j ]);
                            }
                        }

                        break;
                    }
                }
            }

            if (!existing) {
                return callback(new Error("This answer does not exist."));
            } else {
                question.quizQuestion.save(function () {
                    QuestionModel.findOne({ _id : questionId }).deepPopulate('quizQuestion.answers quizQuestion.statistics.statisticAnswer.answer quizQuestion.evaluation.answers').exec(function (err, question) {
                        if (err) {
                            return callback(err);
                        }
                        var q = question.toObject();
                        delete q.quizQuestion.givenAnswers;
                        delete q.answered;
                        q.quizQuestion.evaluationUserAnswers = evaluationUserAnswers;
                        return callback(null, q);
                    });
                });
            }
        } else {
            return callback(new Error("This question is not active."));
        }
    });
};

var deleteQuiz = function (roomId, quizId, callback) {
    var asyncTasks = [];

    QuizModel.findOne({ _id : quizId}).deepPopulate('questions.quizQuestion.statistics').exec(function (err, quiz) {
        if (!quiz) {
            return callback(null, true);
        }
        quiz.questions.forEach(function (question) {
            asyncTasks.push(function (questionCallback) {
                var answerAsyncTasks = [];
                question.quizQuestion.answers.forEach(function (answer) {
                    answerAsyncTasks.push(function (answerCallback) {
                        ARSAnswer.find({ _id: answer}).remove( answerCallback );
                    });
                });
                question.quizQuestion.givenAnswers.forEach(function (answer) {
                    answerAsyncTasks.push(function (answerCallback) {
                        QuizUserAnswerModel.find({ _id: answer}).remove( answerCallback );
                    });
                });
                question.quizQuestion.statistics.statisticAnswer.forEach(function (statObj) {
                    answerAsyncTasks.push(function (statCallback) {
                        StatisticObjModel.find({ _id: statObj}).remove( statCallback );
                    });
                });
                answerAsyncTasks.push(function (statCallback) {
                    StatisticModel.find({ _id: question.quizQuestion.statistics._id }).remove( statCallback );
                });
                answerAsyncTasks.push(function (evalCallback) {
                    EvaluationModel.find({ _id: question.quizQuestion.evaluation }).remove( evalCallback );
                });

                async.parallel(answerAsyncTasks, function (answerAsyncErr) {
                    questionCallback(answerAsyncErr);
                });
            });
        });

        async.parallel(asyncTasks, function (asyncErr) {
            quiz.remove(function () {
                Rooms.Room.update({ _id: roomId }, { $pull: { 'quiz': quizId } }).exec(function (err, room) {
                    if (err) {
                        logger.warn(err);
                        return callback(err);
                    }
                    var error = (asyncErr) ? asyncErr : err;
                    callback(error, (error) ? false : true);
                });
            });
        });

    });
};

var toggleQuizActivation = function (roomId, quizId, bool, callback) {
    QuizModel.update({ _id : quizId}, {active: bool}).exec(function (err) {
        QuizModel.findOne({ _id: quizId }).deepPopulate("questions.quizQuestion.answers").exec(function (quizErr, quiz) {
            callback(err, quiz);
        });
    });
};


module.exports.getQuiz = getQuiz;
module.exports.getAllQuizzes = getAllQuizzes;
module.exports.newQuiz = newQuiz;
module.exports.answer = answer;
module.exports.deleteQuiz = deleteQuiz;
module.exports.toggleQuizActivation = toggleQuizActivation;
module.exports.getStatistics = getStatistics;
