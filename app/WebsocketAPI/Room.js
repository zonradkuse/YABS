var roomDAO = require('../../models/Room.js');
var userDAO = require('../../models/User.js');
var questionDAO = require('../../models/Question.js');
var logger = require('../Logger.js');

module.exports = function(wsControl){
    wsControl.on("room:getQuestions", function(wss, ws, session, params, interfaceEntry, refId, sId){
        //params.roomId
        if(session.user && params.roomId){
			userDAO.hasAccessToRoom(session.user, { _id : params.roomId }, {population:'questions.author questions.answers questions.answers.author'}, function(err, user, room){
				if(err)
					return wsControl.build(ws, err, null, refId);
                room = room.toObject();
                room.questions = removeAuthorTokens(room.questions);
                for (var j = room.questions.length - 1; j >= 0; j--) {
                    room.questions[j].answers = removeAuthorTokens(room.questions[j].answers);
                    wsControl.build(ws, null, null, null, "question:add", {
                        roomId : params.roomId,
                        question : createVotesFields(session.user, room.questions[j])
                    });
                };
			});
        } else
        	wsControl.build(ws, new Error("Your session is invalid."), null, refId);
    });

    wsControl.on("room:getAnswers", function(wss, ws, session, params, interfaceEntry, refId, sId){
        //params.roomId
        //params.questionId
        if(session.user && params.roomId && params.questionId){
        	userDAO.hasAccessToQuestion(session.user, { _id : params.roomId }, { _id : params.questionId }, {population:'answers.author'},function(err, user, question){
				if(err){
					logger.warn("Cannot get question.: "+err);
					wsControl.build(ws, new Error("Cannot get question."), null, refId);
				} else {
                    question.answers = removeAuthorTokens(question.answers);
					wsControl.build(ws, null, {'answers': question.answers}, refId);
                }
			});
        } else {
        	wsControl.build(ws, new Error("Your session is invalid."), null, refId);
        }
    });

    wsControl.on("room:exists", function(wss, ws, session, params, interfaceEntry, refId, sId){
        //params.roomId
        if(session.user && params.roomId){
        	userDAO.hasAccessToRoom(session.user, {_id: params.roomId}, {population:''}, function(err, room){
        		if(err)
        			return wsControl.build(ws, new Error("Access denied."), null, refId);
        		wsControl.build(ws, null, {'exists': (room ? true : false)}, refId);
        	});
        } else {
        	wsControl.build(ws, new Error("Your session is invalid."), null, refId);
        }
    });
};

function removeAuthorTokens(input) {
    for (var i = input.length - 1; i >= 0; i--) {
        if(input[i].author) {
            if(input[i].author.rwth){
                input[i].author = input[i].author.local;
            }
        }
    }
    return input;
}

function createVotesFields(user, question){
	var hasVote = false;
	for(var i=0; i<question.votes.length; i++){
		if(question.votes[i]._id == user._id){
			hasVote = true;
			break;
		}
	}
	var votesCount = question.votes.length;
	question.votes = votesCount;
	question.hasVote = hasVote;
    console.log(question);
	return question;
}

module.exports.createVotesFields = createVotesFields;
module.exports.removeAuthorTokens = removeAuthorTokens;