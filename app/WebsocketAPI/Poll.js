/** @module Poll*/
var pollCtrl = require('../Services/ARS/PollCtrl.js');
var logger = require('../Logger.js');

module.exports = function (wsCtrl) {

    /**
     * This Call implements the full workflow for creating a new poll. This especially takes care of pushing the new
     * poll to the client.
     */
    wsCtrl.on('poll:create', function (req) {
        if (req.params.dueDate && req.params.description && req.params.answers && req.params.answers !== [] ) {
            pollCtrl.newPoll(req.params, function (err, question) {
                if (err) {
                    wsCtrl.build(req.ws, new Error("Could not create new poll"), null, req.refId);
                    return logger.warn("Could not create new poll. Error occured: " + err);
                }
                // the question was successfully created
                wsCtrl.build(req.ws, null, { status: true, description: "new Poll successfully created."}, req.refId);
                req.wss.roomBroadcast(
                    req.ws,
                    'poll:do',
                    {
                        "arsObj": question,
                        "roomId": req.params.roomId
                    },
                    req.params.roomId
                );
                logger.info("successfully created new poll in " + req.params.roomId);
                logger.debug("new ars object: " + question);
            }, function (q) {
                // signal poll timeout
                logger.debug("reset outdated arsobj " + q);
            });
        } else {
            wsCtrl.build(req.ws, new Error("Invalid Parameters."), null, req.refId);
        }
    });
    wsCtrl.on('poll:answer', function (req) {
        req.params.userId = req.session.user._id;
        if (req.params.arsId && req.params.answerId && req.params.answerId !== []) {
            pollCtrl.answer(req.params, function (err) {
                // braodcast statistic to every admin and the answering user
                if (err) {
                    logger.info("An error occurred on answering poll: " + err);
                    wsCtrl.build(req.ws, err, null, req.refId);
                }
            });
        } else {
            wsCtrl.build(req.ws, new Error("Invalid Parameters."), null, req.refId);
        }
    });
};
