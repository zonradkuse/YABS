/** @module WSAPI/Question */

var userDAO = require('../../models/User.js');
var questionDAO = require('../../models/Question.js');

module.exports = function (wsControl) {
	wsControl.on("question:getVotes", function (req, res) {
		if (req.session.user && req.params.questionId) {
			questionDAO.getVotesCount({_id: req.params.questionId}, function (err, votes) {
				if (err) {
					return res.setError(new Error("Cannot get votes of question.")).send();
				}
				res.send({'votes': votes});
			});			
		} else {
			res.setError(new Error("Your req.session is invalid.")).send();
		}
	});

	wsControl.on("question:setContent", function (req, res) {
		if (req.session.user && req.params.roomId && req.params.questionId && req.params.content) {
			userDAO.hasAccessToQuestion(req.session.user, { _id : req.params.roomId }, { _id : req.params.questionId }, {population: ''}, function (err, user, question) {
				if (err) {
					return res.setError(new Error("Cannot get question.")).send();
				}
				if (question.author !== user._id.toString()) {
					return res.setError(new Error("Your not author of the question.")).send();
				}
				questionDAO.setContent(question, req.params.content, function (err, question) {
					if (err) {
						return res.setError(new Error("Cannot update content.")).send();
					}
					res.send({'question': question});
				});
			}); 
		} else {
			res.setError(new Error("Your req.session is invalid.")).send();
		}
	});

	wsControl.on("question:setVisibility", function (req, res) {
		if (req.session.user && req.params.roomId && req.params.questionId && req.params.isVisible) {
			userDAO.hasAccessToQuestion(req.session.user, { _id : req.params.roomId }, { _id : req.params.questionId }, {population: ''}, function (err, user, question) {
				if (err) {
					return res.setError(new Error("Cannot get question.")).send();
				}
				if (question.author !== user._id.toString()) {
					return res.setError(new Error("Your not author of the question.")).send();
				}
				questionDAO.setVisibility(question, req.params.isVisible, function (err, question) {
					if (err) {
						return res.setError(new Error("Cannot update content.")).send();
					}
					res.send({'question': question});
				});
			});
		} else {
			res.setError(new Error("Your req.session is invalid.")).send();
		}
	});
};
