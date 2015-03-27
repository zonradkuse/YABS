var roomDAO = require('../../models/Room.js');
var userDAO = require('../../models/User.js');
var questionDAO = require('../../models/Question.js');
var panicDAO = require('../../models/Panic.js');
var accessManager = require('../AccessManagement.js');
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
                    if (room.questions[j].content !== "") {
                        wsControl.build(ws, null, null, null, "question:add", {
                            roomId : params.roomId,
                            question : createVotesFields(session.user, room.questions[j])
                        });
                    }
                }
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

    wsControl.on("room:enablePanicEvents", function(wss, ws, session, params, interfaceEntry, refId, sId, authed){
        if(authed){
	        if(params.roomId && params.intervals){
	        	accessManager.checkAccessBySId("room:enablePanicEvents", sId, params.roomId, function(err, hasAccess){
	        		if(err || !hasAccess)
	        			return wsControl.build(ws, new Error("Access denied."), null, refId);
		        	userDAO.hasAccessToRoom(session.user, {_id: params.roomId}, {population:''}, function(err, room){
		        		if(err)
		        			return wsControl.build(ws, new Error("Access denied."), null, refId);
		        		panicDAO.register({_id: params.roomId}, wsControl, wss, ws, params.intervals, function(err){
		        			if(err)
		        				return wsControl.build(ws, new Error("Cannot enable panic events."), null, refId);
		        			wsControl.build(ws, null, {'status': true}, refId);
		        		});
		        	});
	        	});
	        }else{
	        	wsControl.build(ws, new Error("Invalid params."), null, refId);
	        }
        } else {
        	wsControl.build(ws, new Error("Your session is invalid."), null, refId);
        }
    });

    wsControl.on("room:disablePanicEvents", function(wss, ws, session, params, interfaceEntry, refId, sId, authed){
        if(authed){
	        if(params.roomId){
	        	accessManager.checkAccessBySId("room:disablePanicEvents", sId, params.roomId, function(err, hasAccess){
	        		if(err || !hasAccess)
	        			return wsControl.build(ws, new Error("Access denied."), null, refId);
		        	userDAO.hasAccessToRoom(session.user, {_id: params.roomId}, {population:''}, function(err, room){
		        		if(err)
		        			return wsControl.build(ws, new Error("Access denied."), null, refId);
		        		panicDAO.unregister({_id: params.roomId}, function(err){
		        			if(err)
		        				return wsControl.build(ws, new Error("Cannot disable panic events."), null, refId);
		        			wsControl.build(ws, null, {'status': true}, refId);
		        		});
		        	});
	        	});
	        }else{
	        	wsControl.build(ws, new Error("Invalid params."), null, refId);
	        }
        } else {
        	wsControl.build(ws, new Error("Your session is invalid."), null, refId);
        }
    });
	
	wsControl.on("room:getPanicGraph", function(wss, ws, session, params, interfaceEntry, refId, sId, authed){
        if(authed){
	        if(params.roomId){
	        	accessManager.checkAccessBySId("room:getPanicGraph", sId, params.roomId, function(err, hasAccess){
	        		if(err || !hasAccess)
	        			return wsControl.build(ws, new Error("Access denied."), null, refId);
		        	userDAO.hasAccessToRoom(session.user, {_id: params.roomId}, {population:''}, function(err, room){
		        		if(err)
		        			return wsControl.build(ws, new Error("Access denied."), null, refId);
		        		panicDAO.getGraph({_id: params.roomId}, {population:''}, function(err, graph){
		        			if(err)
		        				return wsControl.build(ws, new Error("Cannot get graph."), null, refId);
		        			wsControl.build(ws, null, {'graph': removeIdFields(graph.data.toObject())}, refId);
		        		});
		        	});
	        	});
	        }else{
	        	wsControl.build(ws, new Error("Invalid params."), null, refId);
	        }
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
		if(question.votes[i] == user._id){
			hasVote = true;
			break;
		}
	}
	var votesCount = question.votes.length;
	question.votes = votesCount;
	question.hasVote = hasVote;
	return question;
}

//for panic graph
function removeIdFields(input){
	for (var i = input.length - 1; i >= 0; i--) {
        delete input[i]._id;
    }
    return input;
}

module.exports.createVotesFields = createVotesFields;
module.exports.removeAuthorTokens = removeAuthorTokens;