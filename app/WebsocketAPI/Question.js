var roomDAO = require('../../models/Room.js');
var userDAO = require('../../models/User.js');
var questionDAO = require('../../models/Question.js');
var logger = require('../Logger.js');

module.exports = function (wsControl) {
	wsControl.on("question:getVotes", function (req) {
		if (req.session.user && req.params.questionId) {
			questionDAO.getVotesCount({_id: req.params.questionId}, function (err, votes) {
				if (err) {
					return wsControl.build(req.ws, new Error("Cannot get votes of question."), null, req.refId);
				}
				wsControl.build(req.ws, null, {'votes': votes}, req.refId);
			});			
		} else {
			wsControl.build(req.ws, new Error("Your req.session is invalid."), null, req.refId);
		}
	});

	wsControl.on("question:setContent", function (req) {
		if (req.session.user && req.params.roomId && req.params.questionId && req.params.content) {
			userDAO.hasAccessToQuestion(req.session.user, { _id : req.params.roomId }, { _id : req.params.questionId }, {population: ''}, function (err, user, question) {
				if (err) {
					return wsControl.build(req.ws, new Error("Cannot get question."), null, req.refId);
				}
				if (question.author != user._id) {
					return wsControl.build(req.ws, new Error("Your not author of the question."), null, req.refId);
				}
				questionDAO.setContent(question, req.params.content, function (err, question) {
					if (err) {
						return wsControl.build(req.ws, new Error("Cannot update content."), null, req.refId);
					}
					wsControl.build(req.ws, null, {'question': question}, req.refId);
				});
			}); 
		} else {
			wsControl.build(req.ws, new Error("Your req.session is invalid."), null, req.refId);
		}
	});

	wsControl.on("question:setVisibility", function (req) {
		if (req.session.user && req.params.roomId && req.params.questionId && req.params.isVisible) {
			userDAO.hasAccessToQuestion(req.session.user, { _id : req.params.roomId }, { _id : req.params.questionId }, {population: ''}, function (err, user, question) {
				if (err) {
					return wsControl.build(req.ws, new Error("Cannot get question."), null, req.refId);
				}
				//TODO check admin
				if (question.author != user._id) {
					return wsControl.build(req.ws, new Error("Your not author of the question."), null, req.refId);
				}
				questionDAO.setVisibility(question, req.params.isVisible, function (err, question) {
					if (err) {
						return wsControl.build(req.ws, new Error("Cannot update content."), null, req.refId);
					}
					wsControl.build(req.ws, null, {'question': question}, req.refId);
				});
			});
		} else {
			wsControl.build(req.ws, new Error("Your req.session is invalid."), null, req.refId);
		}
	});
};

function removeAuthorTokens(input) {
	for (var i = input.length - 1; i >= 0; i--) {
		console.log(i);
		if (input[ i ].author) {
			if (input[ i ].author.rwth) {
				input[ i ].author = {local: {name: input[ i ].author.local.name}};
				console.log(input[ i ]);
			}
		}
	}
	return input;
}
