var logger = require('../../Logger.js');
var roomDAO = require('../../../models/Room.js');
var apiHelpers = require('../misc/Helpers.js');

module.exports = function (wsControl) {
    wsControl.on("mod:setRoomConfigDiscussion", function (req, res) {
        configurationChangePreparation(req, res, function (room) {
            room.config.components.discussions = req.params.status;
        });
    });

    wsControl.on("mod:setRoomConfigPanicbutton", function (req, res) {
        configurationChangePreparation(req, res, function (room) {
            room.config.components.panicbutton = req.params.status;
        });
    });

    wsControl.on("mod:setRoomConfigQuiz", function (req, res) {
        configurationChangePreparation(req, res, function (room) {
            room.config.components.quiz = req.params.status;
        });
    });

    wsControl.on("mod:userMayAnswerToQuestion", function (req, res) {
        configurationChangePreparation(req, res, function (room) {
            room.config.userMayAnswerToQuestion = req.params.status;
        });
    });

    wsControl.on("mod:questionerMayMarkAnswer", function (req, res) {
        configurationChangePreparation(req, res, function (room) {
            room.config.questionerMayMarkAnswer = req.params.status;
        });
    });

    wsControl.on("mod:mulitOptionPanicButton", function (req, res) {
        configurationChangePreparation(req, res, function (room) {
            room.config.mulitOptionPanicButton = req.params.status;
        });
    });

    wsControl.on("mod:thresholdForImportantQuestion", function (req, res) {
        configurationChangePreparation(req, res, function (room) {
            room.config.thresholdForImportantQuestion = req.params.val;
        });
    });
};

/**
 * This function performs default checks before setting some configuration. It is just existing in order to save code.
 * <strong>The callback has to be synchronous!!</strong>
 * @param req
 * @param cb
 */
function configurationChangePreparation(req, res, cb) {
    if (req.authed) {
        roomDAO.Room.findOne({ _id : req.params.roomId }).
            deepPopulate('questions.author.avatar questions.answers.author.avatar').
            exec(function (err, room) {
                if (err) {
                    logger.warn("Could not set room config! Error: " + err);
                    res.setError(new Error("An Error occured.")).send();
                } else {
                    cb(room);
                    process.nextTick(function () {
                        room.save(function (err) {
                            if (err) {
                                logger.warn(err);
                                res.setError(new Error("An Error occured.")).send();
                            } else {
                                room = apiHelpers.prepareRoom(req.session.user, room.toObject());
                                res.roomBroadcastUser("room:add", { room : room }, req.params.roomId);
                            }
                        });
                    });
                }
            });
    } else {
        res.setError(new Error("Access Denied.")).send();
    }
}
