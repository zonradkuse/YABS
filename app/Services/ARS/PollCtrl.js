/** @module PollCtrl*/

/* TODO
 * ----
 * Here goes logic for:
 * - creating a quiz, including timing
 * - doing statistical work --> should be async 
 *
 * - Callee -> API -> PollCtrl -> create Poll, do callback, create timer -> API -> broadcast new poll
 */
var Scheduler = require('../Timing/Scheduler.js');
var Timer = new Scheduler({ autoFin : false, registerLoopElements : 10 });
var Rooms = require('../../../models/Room.js');
var QuestionModel = require('../../../models/ARSModels/ARSQuestion.js').ARSQuestion;
var ARSAnswer = require('../../../models/ARSModels/ARSAnswer.js').ARSAnswer;
var PollModel = require('../../../models/ARSModels/ARSPoll.js').ARSPoll;
var StatisticModel = require('../../../models/ARSModels/ARSStatistic.js').ARSStatistic;

/** Create a new Poll including timeout.
 * @param {String} description - text that describes the Poll, including Question
 * @param {Object[]} answers - answers as sent by the client
 * @param {Object} options - options to this method. Will be expanded.
 * @param {Number} options.timeout - timeout in seconds is needed
 * @param {Function} cb - Callback for errors and full question on success
 * @param {Function} tcb - Callback for timer timeout.
 */
var newPoll = function (params, options, cb, tcb) {
	var dueDate;
    if (typeof params.dueDate === 'object') {

    } else {
        try {
            if (typeof params.dueDate === 'number' || typeof params.dueDate === 'string') {
                dueDate = new Date(params.dueDate)
            } else {
                dueDate = Date.parse(params.dueDate);
            }
            if (typeof dueDate !== 'object') {
                logger.debug("invalid dueDate input");
                return cb(new Error("dueDate is invalid"));
            }
        } catch (e) {
            logger.debug("dueDate parsing went wrong.");
            return cb(new Error("dueDate is invalid"));
        }
    }


    var _question = new QuestionModel();
	_question.description = params.description;
    _question.dueDate = dueDate;
	var _poll = new QuestionModel();

	var _tId = Timer.addTimeout(function () {
		tcb(); // timeout
	}, (options.timeout* 1000 || 300* 1000) + 1000);

	var _tempAnswers = []; // having something like a transaction to prevent saving invalid data
	var i;
	for (i = params.answers.length - 1; i >= 0; i--) {
		var _answer = new ARSAnswer();
		_answer.description = params.answers[ i ].description;
		if (params.answers[ i ].radiobox && (params.answers[ i ].checkbox || params.answers[ i ].text) || // Prevent multiple fieldsettings
            params.answers[ i ].text && (params.answers[ i ].checkbox || params.answers[ i ].radiobox) ||
            params.answers[ i ].checkbox && (params.answers[ i ].text || params.answers[ i ].radiobox)) {
			Timer.clearTimer(_tId);
			return cb(new Error("Bad field settings."));
		}
		_answer.radiobox = params.answers[ i ].radiobox;
		_answer.checkbox = params.answers[ i ].checkbox;
		_answer.text = params.answers[ i ].text;
		_poll.answers.push(_answer._id); //reference the new answer
		_tempAnswers.push(_answer);
	}

	var saveAns = function (ans) {
		ans[ i ].save(function (err) {
			if (err) {
				Timer.clearTimer(_tId);
				cb(err);
			}
		});
	};

	for (i = _tempAnswers.length - 1; i >= 0; i--) {
		saveAns(_tempAnswers[ i ]);
	}

	_poll.save(function (err) {
		if (err) {
			Timer.clearTimer(_tId);
			cb(err);
		}
	});
	_question.poll = _poll._id;
	_question.save(function (err) {
		if (err) {
			Timer.clearTimer(_tId);
			cb(err);
		}
	});

	QuestionModel.findById(_question._id).deepPopulate('poll poll.answers', function (err, question) {
		if (err) {
			Timer.clearTimer(_tId);
			cb(err);
		} else {
            Rooms.getByID(_params.roomId, {population : ''}, function(err, room) {
                room.hasPoll = true;
                room.poll.push(_question);
                room.save(function(err) {
                    if (err) {
                        logger.debug("An error occurred on room update when creating a new quiz: " + err);
                        return cb(err);
                    }
                    cb(null, question); // pass back the just created question with fully populated data.
                });
            });
		}
	});
};

module.exports.newPoll = newPoll;
