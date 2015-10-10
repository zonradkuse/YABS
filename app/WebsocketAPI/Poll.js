/** @module WSAPI/Poll*/
    
var pollCtrl = require('../Services/ARS/PollCtrl.js');
var logger = require('../Logger.js');
var userRoles = require('../../config/UserRoles.json');
var StatisticsModel = require('../../models/ARSModels/Statistic.js').ARSStatistic;

module.exports = function (wsCtrl) {

    wsCtrl.on("poll:getAll", function (req, res) {
        pollCtrl.getAllPollsInRoom(req.params.roomId, "", function (err, polls) {
            if (err) {
                return res.setError(new Error("could not get polls")).send();
            }
            res.send({ polls : polls });
        });
    });

    wsCtrl.on("poll:get", function (req, res) {
        pollCtrl.getPoll(req.userId, req.params.arsId, function (err, poll) {
            if (err) {
                return res.setError(new Error("could not get poll")).send();
            }
            res.send({ poll : poll });
        });
    });
    /**
     * This Call implements the full workflow for creating a new poll. This especially takes care of pushing the new
     * poll to the client.
     */
    wsCtrl.on('poll:create', function (req, res) {
        if (req.params.dueDate && req.params.description && req.params.answers && req.params.answers !== []) {
            pollCtrl.newPoll(req.params, function (err, poll) {
                if (err) {
                    res.setError(new Error("Could not create new poll")).send();
                    return logger.warn("Could not create new poll. Error occured: " + err);
                }
                // the question was successfully created
                res.send({ 
                    status: true,
                    description: "new Poll successfully created.", 
                    poll: poll
                });
                res.roomBroadcastUser('poll:do',
                    {
                        "arsObj": poll,
                        "roomId": req.params.roomId
                    }, req.params.roomId);
                logger.info("successfully created new poll in " + req.params.roomId);
                logger.debug("new ars object: " + poll);
            }, function (q) {
                // signal poll timeout
                logger.debug("reset outdated arsobj " + q);
            });
        } else {
            res.setError(new Error("Invalid Parameters.")).send();
        }
    });

    wsCtrl.on('poll:answer', function (req, res) {
        req.params.userId = req.session.user._id;
        if (req.params.arsId && req.params.answerId && req.params.answerId !== []) {
            pollCtrl.answer(req.params, function (err, q) {
                // broadcast statistic to every admin and the answering user
                if (err) {
                    logger.info("An error occurred on answering poll: " + err);
                    res.setError(err).send();
                } else {
                    var statistics = q.poll.statistics;
                    StatisticsModel.find({ _id : statistics }).deepPopulate('statisticAnswer statisticAnswer.answer').exec(function (err, s) {
                        wsCtrl.build(req.ws, null, {status: true}, req.refId);
                        for (var i = 0; i < q.answered.length; ++i) {
                            if (req.user._id === q.answered[ i ].toString()) {
                                res.roomBroadcastAdmins("poll:statistic", {
                                    roomId: req.params.roomId,
                                    statistics: s
                                }, req.params.roomId);
                            }
                        }
                    });
                }
            });
        } else {
            res.setError(new Error("Invalid Parameters.")).send();
        }
    });

    wsCtrl.on('poll:getNext', function (req, res) {
        pollCtrl.getNext(req.params.roomId, req.session.user._id, function (err, poll) {
            logger.debug("some next poll : " + poll);
            if (err) {
                 return res.setError(err).send();
            }
            if (!poll) {
                return res.send({status : false});
            }
            res.send({
                roomId : req.params.roomId,
                arsObj : poll
            });
        });
    });

    wsCtrl.on('poll:delete', function (req, res) {
        req.params.userId = req.session.user._id;
        if (req.params.pollId && req.params.roomId) {
            pollCtrl.deletePoll(req.params.roomId, req.params.pollId, function (err, bool) {
                if (err) {
                    logger.info("An error occurred on deleting poll: " + err);
                    res.setError(err).send();
                } else {
                    res.send({ status: bool });
                }
            });
        } else {
            res.setError(new Error("Invalid Parameters.")).send();
        }
    });
};
