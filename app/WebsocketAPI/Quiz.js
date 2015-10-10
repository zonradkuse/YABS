/** @module WSAPI/Quiz*/

var async = require('async');
var quizCtrl = require('../Services/ARS/QuizCtrl.js');
var logger = require('../Logger.js');
var userRoles = require('../../config/UserRoles.json');
var StatisticsModel = require('../../models/ARSModels/Statistic.js').ARSStatistic;

module.exports = function (wsCtrl) {
    /**
     * Gets all quizzes.
     * 
     * @method quiz:getAll
     * 
     */
    wsCtrl.on("quiz:getAll", function (req, res) {
        quizCtrl.getAllQuizzes(req.params.roomId, {}, function (err, quizzes) {
            if (err) {
                return res.setError(new Error("could not get quizzes")).send();
            }
            res.send({ quizzes : quizzes });
        });
    });

    wsCtrl.on("quiz:getStatistics", function (req, res) {
        quizCtrl.getStatistics(req.params.quizId, function (err, quiz) {
            if (err) {
                res.setError(err).send();
            } else {
                res.send(quiz);
            }
        });
    });

    wsCtrl.on("quiz:get", function (req, res) {
        quizCtrl.getQuiz(req.userId, req.params.arsId, {}, function (err, quiz) {
            if (err) {
                return res.setError(new Error("could not get quiz")).send();
            }
            res.send({ quiz : quiz });
        });
    });

    /**
     * This Call implements the full workflow for creating a new quiz. This especially takes care of pushing the new
     * quiz to the client.
     */
    wsCtrl.on('quiz:create', function (req, res) {
        if (req.params.dueDate && req.params.description && req.params.questions && req.params.question !== []) {
            //TODO more input checks
            quizCtrl.newQuiz(req.params, function (err, quiz) {
                if (err) {
                    res.setError(new Error("Could not create new quiz")).send();
                    return logger.warn("Could not create new quiz. Error occured: " + err);
                }
                res.send({
                    status: true, 
                    description: "new quiz successfully created.", 
                    quiz: quiz
                });
                logger.info("successfully created new quiz in " + req.params.roomId);
                logger.debug("new ars object: " + quiz);
            });
        } else {
            res.setError(new Error("Invalid Parameters.")).send();
        }
    });

    wsCtrl.on('quiz:answer', function (req, res) {
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
                    res.setError(err).send();
                } else {
                    res.send({ status: true });
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
            res.setError(new Error("Invalid Parameters.")).send();
        }
    });

    wsCtrl.on('quiz:delete', function (req, res) {
        req.params.userId = req.session.user._id;
        if (req.params.quizId && req.params.roomId) {
            quizCtrl.deleteQuiz(req.params.roomId, req.params.quizId, function (err, bool) {
                if (err) {
                    logger.info("An error occurred on deleting quiz: " + err);
                    res.setError(err).send();
                } else {
                    res.send({ status: bool });
                }
            });
        } else {
            res.setError(new Error("Invalid Parameters."));
        }
    });

    wsCtrl.on('quiz:toggleActivation', function (req, res) {
        req.params.userId = req.session.user._id;
        if (req.params.quizId && req.params.roomId) {
            quizCtrl.toggleQuizActivation(req.params.roomId, req.params.quizId, req.params.active, function (err, quiz) {
                if (err) {
                    logger.info("An error occurred on activate quiz: " + err);
                    res.setError(err).send();
                } else {
                    res.send({ active: req.params.active });
                }
            });
        } else {
            res.setError(new Error("Invalid Parameters.")).send();
        }
    });
};
