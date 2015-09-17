/** @module Quiz*/
var async = require('async');
var quizCtrl = require('../Services/ARS/QuizCtrl.js');
var logger = require('../Logger.js');
var userRoles = require('../../config/UserRoles.json');
var StatisticsModel = require('../../models/ARSModels/Statistic.js').ARSStatistic;

module.exports = function (wsCtrl) {

    wsCtrl.on("quiz:getAll", function (req) {
        quizCtrl.getAllQuizzes(req.params.roomId, {}, function (err, quizzes) {
            if (err) {
                return wsCtrl.build(req.ws, new Error("could not get quizzes"), null, req.refId);
            }
            wsCtrl.build(req.ws, null, { quizzes : quizzes }, req.refId);
        });
    });

    wsCtrl.on("quiz:get", function (req) {
        quizCtrl.getQuiz(req.userId, req.params.arsId, {}, function (err, quiz) {
            if (err) {
                return wsCtrl.build(req.ws, new Error("could not get quiz"), null, req.refId);
            }
            wsCtrl.build(req.ws, null, { quiz : quiz }, req.refId);
        });
    });

    /**
     * This Call implements the full workflow for creating a new quiz. This especially takes care of pushing the new
     * quiz to the client.
     */
    wsCtrl.on('quiz:create', function (req) {
        if (req.params.dueDate && req.params.description && req.params.questions && req.params.question !== []) {
            //TODO more input checks
            quizCtrl.newQuiz(req.params, function (err, quiz) {
                if (err) {
                    wsCtrl.build(req.ws, new Error("Could not create new quiz"), null, req.refId);
                    return logger.warn("Could not create new quiz. Error occured: " + err);
                }
                wsCtrl.build(req.ws, null, {status: true, description: "new quiz successfully created.", quiz: quiz}, req.refId);
                logger.info("successfully created new quiz in " + req.params.roomId);
                logger.debug("new ars object: " + quiz);
            });
        } else {
            wsCtrl.build(req.ws, new Error("Invalid Parameters."), null, req.refId);
        }
    });

    wsCtrl.on('quiz:answer', function (req) {
        req.params.userId = req.session.user._id;
        if (req.params.quizId && req.params.answerIds && req.params.answerIds !== []) {
            var asyncTasks = [];

            req.params.answerIds.forEach(function (item) {
                asyncTasks.push(function (callback) {
                    quizCtrl.answer(req.params.userId, req.params.roomId, item.question, item.answers, function (err, q) {
                        if (err) {
                            logger.info("An error occurred on answering quiz: " + err);
                            //wsCtrl.build(req.ws, err, null, req.refId);
                            callback(err);
                        } else {
                            //wsCtrl.build(req.ws, null, { question: q }, req.refId);
                            callback(null);
                        }
                    });
                });
            });

            async.parallel(asyncTasks, function (err) {
                if (err) {
                    wsCtrl.build(req.ws, err, null, req.refId);
                } else {
                    wsCtrl.build(req.ws, null, { status: true }, req.refId);
                }
            });

            /*quizCtrl.answer(req.params, function (err, q) {
                // broadcast statistic to every admin and the answering user

                if (err) {
                    logger.info("An error occurred on answering quiz: " + err);
                    wsCtrl.build(req.ws, err, null, req.refId);
                } else {
                    //TODO broadcast to admins
                    var statistics = q.poll.statistics;
                    StatisticsModel.find({ _id : statistics }).deepPopulate('statisticAnswer statisticAnswer.answer').exec(function (err, s) {
                        wsCtrl.build(req.ws, null, {status: true}, req.refId);
                        req.wss.roomBroadcast(req.ws, "poll:statistic", {
                            roomId: req.params.roomId,
                            statistics: s
                        }, req.params.roomId, function (userId, cb) {
                            // check if user already answered
                            for (var i = 0; i < q.answered.length; ++i) {
                                if (q.answered[ i ].toString() === userId || req.accessLevel >= userRoles.defaultMod) {
                                    cb();
                                }
                            }
                        });
                    });
                    wsCtrl.build(req.ws, null, { question: q }, req.refId);
                }
            });*/
        } else {
            wsCtrl.build(req.ws, new Error("Invalid Parameters."), null, req.refId);
        }
    });

    wsCtrl.on('quiz:delete', function (req) {
        req.params.userId = req.session.user._id;
        if (req.params.quizId && req.params.roomId) {
            quizCtrl.deleteQuiz(req.params.roomId, req.params.quizId, function (err, bool) {
                if (err) {
                    logger.info("An error occurred on deleting quiz: " + err);
                    wsCtrl.build(req.ws, err, null, req.refId);
                } else {
                    wsCtrl.build(req.ws, null, { status: bool }, req.refId);
                }
            });
        } else {
            wsCtrl.build(req.ws, new Error("Invalid Parameters."), null, req.refId);
        }
    });

    wsCtrl.on('quiz:toggleActivation', function (req) {
        req.params.userId = req.session.user._id;
        if (req.params.quizId && req.params.roomId) {
            quizCtrl.toggleQuizActivation(req.params.roomId, req.params.quizId, req.params.active, function (err, quiz) {
                if (err) {
                    logger.info("An error occurred on activate quiz: " + err);
                    wsCtrl.build(req.ws, err, null, req.refId);
                } else {
                    wsCtrl.build(req.ws, null, { active: req.params.active }, req.refId);
                    if (req.params.active) {

                        req.wss.roomBroadcast(
                            req.ws,
                            'quiz:do',
                            {
                                "quiz": quiz,
                                "roomId": req.params.roomId
                            },
                            req.params.roomId
                        );
                    }
                }
            });
        } else {
            wsCtrl.build(req.ws, new Error("Invalid Parameters."), null, req.refId);
        }
    });
};
