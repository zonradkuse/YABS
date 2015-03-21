var roomDAO = require('../../models/Room.js');
var userDAO = require('../../models/User.js');
var questionDAO = require('../../models/Question.js');
var logger = require('../Logger.js');

module.exports = function(wsControl){
    wsControl.on("question:getVotes", function(wss, ws, session, params, interfaceEntry, refId, sId){
        if(session.user && params.questionId){
            questionDAO.getVotesCount({_id:params.questionId}, function(err, votes){
				if(err)
					return wsControl.build(ws, new Error("Cannot get votes of question."), null, refId);
                wsControl.build(ws, null, {'votes': votes}, refId);
			});			
        } else
        	wsControl.build(ws, new Error("Your session is invalid."), null, refId);
    });

    wsControl.on("question:setContent", function(wss, ws, session, params, interfaceEntry, refId, sId){
        if(session.user && params.roomId && params.questionId && params.content){
            userDAO.hasAccessToQuestion(session.user, { _id : params.roomId }, { _id : params.questionId }, {population:''}, function(err, user, question){
                if(err)
                    return wsControl.build(ws, new Error("Cannot get question."), null, refId);
                if(question.author != user._id)
                    return wsControl.build(ws, new Error("Your not author of the question."), null, refId);
                questionDAO.setContent(question, params.content, function(err, question){
                    if(err)
                        return wsControl.build(ws, new Error("Cannot update content."), null, refId);
                    wsControl.build(ws, null, {'question':question}, refId);
                });
            });
        } else
            wsControl.build(ws, new Error("Your session is invalid."), null, refId);
    });

    wsControl.on("question:setVisibility", function(wss, ws, session, params, interfaceEntry, refId, sId){
        if(session.user && params.roomId && params.questionId && params.isVisible){
            userDAO.hasAccessToQuestion(session.user, { _id : params.roomId }, { _id : params.questionId }, {population:''}, function(err, user, question){
                if(err)
                    return wsControl.build(ws, new Error("Cannot get question."), null, refId);
                //TODO check admin
                if(question.author != user._id)
                    return wsControl.build(ws, new Error("Your not author of the question."), null, refId);
                questionDAO.setVisibility(question, params.isVisible, function(err, question){
                    if(err)
                        return wsControl.build(ws, new Error("Cannot update content."), null, refId);
                    wsControl.build(ws, null, {'question':question}, refId);
                });
            });
        } else
            wsControl.build(ws, new Error("Your session is invalid."), null, refId);
    });
};

function removeAuthorTokens(input) {
    for (var i = input.length - 1; i >= 0; i--) {
        console.log(i);
        if(input[i].author) {
            if(input[i].author.rwth){
                input[i].author = {local: {name: input[i].author.local.name}};
                console.log(input[i]);
            }
        }
    };
    return input;
}