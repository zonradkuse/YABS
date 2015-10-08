/** @module WSAPI/Poll*/
    
var pollCtrl = require('../Services/ARS/PollCtrl.js');
var logger = require('../Logger.js');
var userRoles = require('../../config/UserRoles.json');
var StatisticsModel = require('../../models/ARSModels/Statistic.js').ARSStatistic;

module.exports = function (wsCtrl) {

    wsCtrl.on("poll:getAll", function (req) {
        pollCtrl.getAllPollsInRoom(req.params.roomId, "", function (err, polls) {
            if (err) {
                return wsCtrl.build(req.ws, new Error("could not get polls"), null, req.refId);
            }
            wsCtrl.build(req.ws, null, { polls : polls }, req.refId);
        });
    });

    wsCtrl.on("poll:get", function (req) {
        pollCtrl.getPoll(req.userId, req.params.arsId, function (err, poll) {
            if (err) {
                return wsCtrl.build(req.ws, new Error("could not get poll"), null, req.refId);
            }
            wsCtrl.build(req.ws, null, { poll : poll }, req.refId);
        });
    });
    /**
     * This Call implements the full workflow for creating a new poll. This especially takes care of pushing the new
     * poll to the client.
     */
    wsCtrl.on('poll:create', function (req) {
        if (req.params.dueDate && req.params.description && req.params.answers && req.params.answers !== []) {
            pollCtrl.newPoll(req.params, function (err, poll) {
                if (err) {
                    wsCtrl.build(req.ws, new Error("Could not create new poll"), null, req.refId);
                    return logger.warn("Could not create new poll. Error occured: " + err);
                }
                // the question was successfully created
                wsCtrl.build(req.ws, null, {status: true, description: "new Poll successfully created.", poll: poll}, req.refId);
                req.wss.roomBroadcast(
                    req.ws,
                    'poll:do',
                    {
                        "arsObj": poll,
                        "roomId": req.params.roomId
                    },
                    req.params.roomId
                );
                logger.info("successfully created new poll in " + req.params.roomId);
                logger.debug("new ars object: " + poll);
            }, function (q) {
                // signal poll timeout
                logger.debug("reset outdated arsobj " + q);
            });
        } else {
            wsCtrl.build(req.ws, new Error("Invalid Parameters."), null, req.refId);
        }
    });

    wsCtrl.on('poll:answer', function (req, res) {
        req.params.userId = req.session.user._id;
        if (req.params.arsId && req.params.answerId && req.params.answerId !== []) {
            pollCtrl.answer(req.params, function (err, q) {
                // broadcast statistic to every admin and the answering user

                if (err) {
                    logger.info("An error occurred on answering poll: " + err);
                    wsCtrl.build(req.ws, err, null, req.refId);
                } else {
                    var statistics = q.poll.statistics;
                    StatisticsModel.find({ _id : statistics }).deepPopulate('statisticAnswer statisticAnswer.answer').exec(function (err, s) {
                        wsCtrl.build(req.ws, null, {status: true}, req.refId);
                        for (var i = 0; i < q.answered.length; ++i) {
                            if (req.user._id === q.answered[ i ].toString()) {
                                res.roomBroadcastAdmin(req.ws, "poll:statistic", {
                                    roomId: req.params.roomId,
                                    statistics: s
                                });
                            }
                        }
                    });
                }
            });
        } else {
            wsCtrl.build(req.ws, new Error("Invalid Parameters."), null, req.refId);
        }
    });

    wsCtrl.on('poll:getNext', function (req) {
        pollCtrl.getNext(req.params.roomId, req.session.user._id, function (err, poll) {
            logger.debug("some next poll : " + poll);
            if (err) {
                return wsCtrl.build(req.ws, err, null, req.refId);
            }
            if (!poll) {
                return wsCtrl.build(req.ws, null, {status : false}, req.refId);
            }
            wsCtrl.build(req.ws, null, {
                roomId : req.params.roomId,
                arsObj : poll
            }, req.refId);
        });
    });

    wsCtrl.on('poll:delete', function (req) {
        req.params.userId = req.session.user._id;
        if (req.params.pollId && req.params.roomId) {
            pollCtrl.deletePoll(req.params.roomId, req.params.pollId, function (err, bool) {
                if (err) {
                    logger.info("An error occurred on deleting poll: " + err);
                    wsCtrl.build(req.ws, err, null, req.refId);
                } else {
                    wsCtrl.build(req.ws, null, { status: bool }, req.refId);
                }
            });
        } else {
            wsCtrl.build(req.ws, new Error("Invalid Parameters."), null, req.refId);
        }
    });
};
