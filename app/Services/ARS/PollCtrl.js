/**
 * TODO
 * ----
 * Here goes logic for:
 * - creating a quiz, including timing
 * - doing statistical work --> should be async 
 *
 * - Callee -> API -> PollCtrl -> create Poll, do callback, create timer -> API -> broadcast new poll
 */

var Scheduler = require('../Timing/Scheduler.js');
var Timer = new Scheduler({ autoFin : false, registerLoopElements: 10 });
var QuestionModel = require('../../../models/ARSQuestion.js').ARSQuestion;
var QuestionModel = require('../../../models/ARSAnswer.js').ARSAnswer;
var PollModel = require('../../../models/ARSPoll.js').ARSPoll;
var StatisticModel = require('../../../models/ARSStatistic.js').ARSStatistic;

/**
 * Create a new Poll including timeout
 * 
 * @param {String} description Text that describes the Poll, including Question
 * @param {[Object]} answers Answers as sent by the client
 * @param {Object} options Options to this method. Will be expanded, 'til now only options.timeout in seconds is needed
 * @param {Function} cb Callback for errors (first parameter) and on timeout fired
 */
var newPoll = function newPoll (description, answers, options, cb) {
	var _question = new QuestionModel();
	_question.description = description;
	var _poll = new QuestionModel();

	var _tId = Timer.addTimeout(function () {
		cb(null, true); // timeout
	}, options.timeout*1000 + 1000);

	for (var i = answers.length - 1; i >= 0; i--) {
		var _answer = new ARSAnswer();
		_answer.description = answers[i].description;
		_answer.radiobox = answers[i].radiobox;
		_answer.checkbox = answers[i].checkbox;
		_answer.text = answers[i].text;
		_poll.answers.push(_answer._id); //reference the new answer
		_answer.save(function (err) {
			if (err) {
				Timer.clear(_tId);
				return cb(err);
			}
		});
	}
	_poll.save(function (err) {
		if (err) {
			Timer.clearTimer(_tId);
			return cb(err);
		}
	});
	_question.poll = _poll._id;
	_question.save(function (err) {
		if (err) {
			Timer.clearTimer(_tId);
			return cb(err);
		}
	});

	QuestionModel.findById(_question._id).deepPopulate('poll poll.answers', function (err, question){
		return cb(err, false, question);
	});
};