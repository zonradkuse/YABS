var roomDAO = require('../../models/Room.js');
var userDAO = require('../../models/User.js');
var questionDAO = require('../../models/Question.js');
var panicDAO = require('../Panic.js');
var panicGraphDAO = require('../../models/PanicGraph.js');
var accessManager = require('../AccessManagement.js');
var logger = require('../Logger.js');

module.exports = function(wsControl){
    wsControl.on("room:userCount", function(wss, ws, session, params, interfaceEntry, refId, sId){
        accessManager.checkAccessBySId("room:userCount", sId, params.roomId, function(err, hasAccess){
            if (hasAccess) {
                wss.getActiveUsersByRoom(params.roomId, function(err, num){
                    if (err) {
                        logger.warn("Could not get Usercount: " + err);
                        wsControl.build(ws, new Error("Could not get Usercount"), null, refId);
                    }
                    wsControl.build(ws, null, { count : num }, refId);
                });
            } else {
                wsControl.build(ws, new Error("Access Denied"), null, refId);
            }
        })

    });
    wsControl.on("room:getQuestions", function(wss, ws, session, params, interfaceEntry, refId, sId){
        //params.roomId
        if(session.user && params.roomId){
			userDAO.hasAccessToRoom(session.user, { _id : params.roomId }, {population:'questions.author.avatar questions.answers.images questions.images questions.answers.author.avatar'}, function(err, user, room){
                if(err)
					return wsControl.build(ws, err, null, refId);
                room = room.toObject();
                room.questions = removeAuthorTokens(room.questions);
                var date = new Date().getTime()-8*24*60*60*1000;
                for (var j = room.questions.length - 1; j >= 0; j--) {
                    room.questions[j].answers = removeAuthorTokens(room.questions[j].answers);
                    room.questions[j].images = removeOwnerFields(room.questions[j].images);
                    if (room.questions[j].answers) {
                        for (var i = room.questions[j].answers.length - 1; i >= 0; i--) {
                            room.questions[j].answers[i].images = removeOwnerFields(room.questions[j].answers[i].images);
                        };
                    }
                    if (room.questions[j].content !== "" && room.questions[j].creationTime.getTime() > date) {
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
        	userDAO.hasAccessToQuestion(session.user, { _id : params.roomId }, { _id : params.questionId }, {population:'answers.author.avatar'},function(err, user, question){
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
		        		var options = {};
		        		options.intervals = params.intervals;
		        		panicDAO.register({_id: params.roomId}, wsControl, wss, ws, options, function(err){
		        			if(err)
		        				return wsControl.build(ws, new Error("Cannot enable panic events."), null, refId);
		        			wss.roomBroadcast(ws, "room:panicStatus", {isEnabled: true, hasUserPanic: false}, params.roomId);
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
		        			wss.roomBroadcast(ws, "room:panicStatus", {isEnabled: false, hasUserPanic: false}, params.roomId);
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
		        		panicGraphDAO.getGraph({_id: params.roomId}, {population:''}, function(err, graph){
		        			if(err)
		        				return wsControl.build(ws, new Error("Cannot get graph."), null, refId);
		        			if(!graph)
		        				return wsControl.build(ws, null, {'graph': []}, refId);
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

function removeAuthorFields(author){
    delete author.rwth;
    delete author._id;
    delete author.facebook;
    delete author.github;
    delete author.google;
    delete author.access;
    delete author.rights;
    return author;
}

function removeAuthorTokens(input) {
    for (var i = input.length - 1; i >= 0; i--) {
        if(input[i].author) {
            if(input[i].author.rwth){
            	var a = JSON.parse(JSON.stringify(input[i].author));
                input[i].author = removeAuthorFields(input[i].author);
                if(a.avatar && a.avatar.path !== undefined)
                	input[i].author.avatar = a.avatar.path;
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

function removeOwnerFields(images) {
    if (images) { 
        for (var i = images.length - 1; i >= 0; i--) {
            delete images[i].owner; 
        }
    }
    return images;
}

function addAuthorAvatarPath(author){
	var path = author.avatar.path;
	delete author.avatar;
	author.avatar = path;
	return author;
}

module.exports.createVotesFields = createVotesFields;
module.exports.removeAuthorTokens = removeAuthorTokens;
module.exports.removeOwnerFields = removeOwnerFields;
module.exports.addAuthorAvatarPath = addAuthorAvatarPath;
module.exports.removeAuthorFields = removeAuthorFields;