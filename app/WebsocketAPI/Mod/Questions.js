var checkAccess = require('../Mod.js').checkAccess;

var logger = require('../../Logger.js');
var questionDAO = require('../../../models/Question.js');
var roomWSControl = require('../Room.js');

module.exports = function (wsControl) {
	
	wsControl.on('mod:markAsGoodQuestion', function (req, res) {
		checkAccess(wsControl, req, res, function () {
			
		});
	});

	wsControl.on("mod:deleteQuestion", function (req, res) {
		checkAccess(wsControl, req, res, function () {
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
		questionDAO.Question.findOne({ _id : req.questionId }).exec(function (err, q) {
			if (err) {
				logger.warn(err);
				return res.setError(new Error("cannot update question")).send();
			}
			q.markedAsGood = true;
			q.save();
		});
	});

	wsControl.on("mod:question:unmarkAsGood", function (req, res) {
		questionDAO.Question.findOne({ _id : req.questionId }).exec(function (err, q) {
			if (err) {
				logger.warn(err);
				return res.setError(new Error("cannot update question")).send();
			}
			q.markedAsGood = false;
			q.save();
		});
	});
};