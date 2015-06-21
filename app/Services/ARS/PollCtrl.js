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
var QuestionModel = require('../../../models/ARSModels/Question.js').ARSQuestion;
var ARSAnswer = require('../../../models/ARSModels/Answer.js').ARSAnswer;
var PollModel = require('../../../models/ARSModels/Poll.js').ARSPoll;
var StatisticModel = require('../../../models/ARSModels/Statistic.js').ARSStatistic;
var StatisticObjModel = require('../../../models/ARSModels/StatisticObj.js').StatisticObj;
var logger = require('../../Logger.js');

/** Create a new Poll including timeout.
 * @param {Object} params - answers, dueDate, 
 * @param {Object} options - options to this method. Will be expanded.
 * @param {Function} cb - Callback for errors and full question on success
 * @param {Function} tcb - Callback for timer timeout.
 */
var newPoll = function (params, cb, tcb) {
	var dueDate;
    if (typeof params.dueDate === 'number') {
    	dueDate = params.dueDate;
    } else {
        return cb(new Error("dueDate is invalid"));
    }

    if (dueDate < 0) {
    	return cb(new Error("dueDate is in the past"));
    }

    var _question = new QuestionModel();
	_question.description = params.description;
    _question.dueDate = dueDate*1000 + Date.now();
	var _poll = new PollModel();
    var _statistic = new StatisticModel();
    _statistic.save();
    _poll.statistics = _statistic._id;

	var _tId = Timer.addTimeout(function () {
		QuestionModel.findOne({_id : _question._id}).exec(function(err, q) {
            if (err) {
                return tcb(err);
            }
            q.active = false;
            q.save();
            tcb(q);
        });
	}, dueDate*1000 + 1000);
	
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
		ans.save(function (err) {
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

        _question.poll = _poll._id;
        _question.save(function (err) {
            if (err) {
                Timer.clearTimer(_tId);
                return cb(err);
            }

            QuestionModel.findOne({ _id : _question._id}).deepPopulate('poll poll.answers').exec(function (err, question) {
                if (err) {
                    logger.warn("An error occured when populating new Quiz " + err);
                    Timer.clearTimer(_tId);
                    cb(err);
                } else {
                    Rooms.getByID(params.roomId, {population : ''}, function(err, room) {
                        room.hasPoll = true;
                        room.poll.push(question._id);
                        room.save(function(err) {
                            if (err) {
                                logger.warn("An error occurred on room update when creating a new quiz: " + err);
                                return cb(err);
                            }
                            cb(null, question); // pass back the just created question with fully populated data.
                        });
                    });
                }
            });
        });
    });
};

var answer = function (params, cb) { // refactor this. it is perhaps much too complicated
    // params.userId, params.answerId, params.arsId, params.roomId
    QuestionModel.findOne({ _id : params.arsId }).deepPopulate('poll poll poll.statistics poll.statistics.statisticAnswer').exec(function (err, q) {
        if (err) {
            logger.debug(err);
            return cb(err);
        }
        if(q.active) {
            // we can answer this one
            var _statObj, existing = false, answered = false;
            for (var j = 0; j < params.answerId.length; ++j) {
                for(var k = 0; k < q.poll.answers.length; ++k) {
                    logger.debug(" " + q.poll.answers[k]);
                    if (params.answerId[j] === q.poll.answers[k].toString()) {
                        for (var i = 0; i < q.poll.statistics.statisticAnswer; ++i) {
                            if (params.answerId[j] === q.poll.statistics.statisticAnswer[i].answer) {
                                // there is already an object for this answer
                                answered = true;
                                StatisticObjModel.findOne(q.poll.statistics.statisticAnswer[i]._id).exec(function (err, obj) {
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
                            _statObj.save();
                            q.poll.statistics.statisticAnswer.push(_statObj._id);
                            q.poll.statistics.save();
                        } else {
                            answered = false;
                        }
                        existing = true;
                    }
                }
            }
            if (!existing) {
                return cb(new Error("This answer does not exist."));
            } else {
                q.poll.save();
                cb(null);
            }
        } else {
            cb(new Error("Time is up."))
        }
    });

}
module.exports.answer = answer;
module.exports.newPoll = newPoll;
