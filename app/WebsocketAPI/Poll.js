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
            pollCtrl.newPoll(req.params.description, req.params.answers, req.params.timeout, function (err, question) {
                if (err) {
                    wsCtrl.build(req.ws, new Error("Could not create new poll"), null, req.refId);
                    return logger.warn("Could not create new poll. Error occured: " + err);
                }
                // the question was successfully created
                req.wss.roomBroadcast(
                    req.ws,
                    'poll:do',
                    {
                        "poll": question,
                        "roomId": req.params.roomId
                    },
                    req.params.roomId
                );
            }, function () {
                // signal poll timeout - as there is a dueDate, this is not necessary anymore.
                // pollCtrl.reset(question);
            });
        } else {
            wsCtrl.build(req.ws, new Error("Invalid Parameters."), null, req.refId);
        }
    });
    wsCtrl.on('poll:answer', function(req) {
        if (req.params.pollId && req.params.answers && req.params.answers !== []) {
            pollCtrl.answer(req.params.pollId,req.params.answers, function (err) {
                // braodcast statistic to every admin and the answering user
            });
        } else {
            wsCtrl.build(req.ws, new Error("Invalid Parameters."), null, req.refId);
        }
    });
};
