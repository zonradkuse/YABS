var checkAccess = require('./misc.js').checkAccesss;
var answerDAO = require('../../../models/Answer.js');
var roomWSControl = require('../Room.js');
var questionDAO = require('../../../models/Question.js');
var logger = require('../../Logger.js');

module.exports = function (wsControl) {
	wsControl.on("mod:markAsAnswer", function (req, res) {
		checkAccess(req, res, function () {
			answerDAO.getByID(req.params.answerId, {population: 'author author.avatar images'}, function (err, ans) {
                ans.isAnswer = true;
				ans.save(function (err) {
					if (err) {
						wsControl.build(req.ws, new Error("Could not save the new state."), null, req.refId);
						return logger.err("Could not save the new state: " + err);
					}
					var toSend = JSON.parse(JSON.stringify(ans));
					toSend.author = roomWSControl.removeAuthorFields(toSend.author);
					toSend.author.avatar = toSend.author.avatar.path;
					res.roomBroadcastUser("answer:add", {
						'roomId': req.params.roomId,
						'questionId': req.params.questionId,
						'answer': toSend
					}, req.params.roomId);
				});
			});
		});
	});
    
	wsControl.on("mod:unmarkAsAnswer", function (req, res) {
		checkAccess(req, res, function () {
			answerDAO.getByID(req.params.answerId, {population: 'author author.avatar images'}, function (err, ans) {
				ans.isAnswer = false;
                
				ans.save(function (err) {
					if (err) {
						res.setError(new Error("Could not save the new state.")).send();
						return logger.err("Could not save the new state: " + err);
					}
					var toSend = JSON.parse(JSON.stringify(ans));
					toSend.author = roomWSControl.removeAuthorFields(toSend.author);
					toSend.author.avatar = toSend.author.avatar.path;
					res.roomBroadcastUser("answer:add", {
						'roomId': req.params.roomId,
						'questionId': req.params.questionId,
						'answer': toSend
					}, req.params.roomId);
				});
			});
		});
	});

	wsControl.on("mod:deleteAnswer", function (req, res) {
		checkAccess(req, res, function () {
			answerDAO.getByID(req.params.answerId, {population: 'author author.avatar'}, function (err, ans) {
				ans.images = [];
				ans.content = "Der Inhalt wurde gelöscht.";
				ans.deleted = true;
				ans.isAnswer = false;
				ans.save(function (err) {
					if (err) {
						res.setError(new Error("Could not save the new state.")).send();
						return logger.err("Could not save the new state: " + err);
					}
					var _ans = JSON.parse(JSON.stringify(ans));
					_ans.author.avatar = _ans.author.avatar.path;
					_ans.author = roomWSControl.removeAuthorFields(_ans.author);
					_ans.images = roomWSControl.removeOwnerFields(_ans.images);
					res.roomBroadcastUser("answer:add", {
						'roomId': req.params.roomId,
						'questionId' : req.params.questionId,
						'answer' : _ans
					}, req.params.roomId);
					answerDAO.remove(_ans, function (err) {
						if (err) {
							logger.warn(err);
						}
					});
				});
			});
		});
	});
};
