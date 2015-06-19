/** @module Poll*/
var pollCtrl = require('../Services/ARS/PollCtrl.js');
var logger = require('../Logger.js');

module.exports = function (wsCtrl) {

    /**
     * This Call implements the full workflow for creating a new poll. This especially takes care of pushing the new
     * poll to the client.
     */
    wsCtrl.on('poll:create', function (req) {
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
                    "poll" : question,
                    "roomId" : req.params.roomId
                },
                req.params.roomId
            );
        }, function () {
            // signal poll timeout
            pollCtrl.reset(question);
            req.wss.roomBroadcast(
                req.ws,
                'poll:done',
                {
                    'pollId' : question._id,
                    'poll' : question
                },
                req.params.roomId
            );
        });
    });
};
