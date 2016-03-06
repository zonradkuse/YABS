var checkAccess = require('./misc.js').checkAccess;

var logger = require('../../Logger.js');
var questionDAO = require('../../../models/Question.js');
var roomWSControl = require('../Room.js');

module.exports = function (wsControl) {

	wsControl.on("mod:deleteQuestion", function (req, res) {
		checkAccess(req, res, function () {
			questionDAO.getByID(req.params.questionId, {population: 'author author.avatar'}, function (err, q) {
				q.images = [];
				q.content = "Der Inhalt wurde gelöscht.";
				q.votes = [];
				q.answers = [];
				q.visible = false;
				q.save(function (err) {
					if (err) {
						res.setError(new Error("Could not save the new state.")).send();
						return logger.err("Could not save the new state: " + err);
					}
					var _q = JSON.parse(JSON.stringify(q));
					_q.author.avatar = _q.author.avatar.path;
					_q.author = roomWSControl.removeAuthorFields(_q.author);
					_q.images = roomWSControl.removeOwnerFields(_q.images);
					_q.answers = [];
					res.roomBroadcastUser("question:add", {
						'roomId': req.params.roomId,
						'question' : roomWSControl.createVotesFields(req.session.user, _q)
					}, req.params.roomId);
					questionDAO.remove(_q, function (err) {
						if (err) {
							logger.warn(err);
						}
					});
				});
			});
		});
	});

	wsControl.on("mod:question:markAsGood", function (req, res) {
		prepareQuestionMarking(req, res, function (question) {
			q.markedAsGood = false;
		});
	});

	wsControl.on("mod:question:unmarkAsGood", function (req, res) {
		prepareQuestionMarking(req, res, function (question) {
			q.markedAsGood = false;
		});
	});
};

function prepareQuestionMarking (req, res, cb) {
	checkAccess(req, res, function () {
		questionDAO.Question.findOne({ _id : req.params.questionId }).exec(function (err, q) {
			if (err) {
				logger.warn(err);
				return res.setError(new Error("cannot update question")).send();
			}
			cb(q);
			q.deepPopulate('answers.author.avatar author.avatar', function (err, _q) {
				res.roomBroadcastUser("question:add", {
					roomId : req.params.roomId,
					question : _q
				});
			});
			q.save();
		});
	});
}
