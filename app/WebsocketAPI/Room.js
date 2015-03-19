var roomDAO = require('../../models/Room.js');
var userDAO = require('../../models/User.js');
var questionDAO = require('../../models/Question.js');
var logger = require('../Logger.js');

module.exports = function(wsControl){
    wsControl.on("room:getQuestions", function(wss, ws, session, params, interfaceEntry, refId, sId){
        //params.roomId
        console.log(JSON.stringify(session.user,null,2));
        if(session.user && params.roomId){
			userDAO.hasAccessToRoom(session.user, params.roomId, {population:'questions.author'},function(err, user, room){
				if(err)
					return wsControl.build(ws, err, null, refId);
				room.questions = removeAuthorTokens(room.questions);
            	wsControl.build(ws, null, {'questions': room.questions}, refId);
			});			
        } else
        	wsControl.build(ws, new Error("Your session is invalid."), null, refId);
    });

    wsControl.on("room:getAnswers", function(wss, ws, session, params, interfaceEntry, refId, sId){
        //params.roomId
        //params.questionId
        if(session.user && params.roomId && params.questionId){
        	userDAO.getRoomAccess(session.user, {population: ''}, function(err, rooms){
        		if(err){
        			logger.warn("Cannot check user's room access. "+err);
        			wsControl.build(ws, new Error("Cannot check user's room access."), null, refId);
        			return;
        		}
            	for(var i=0; i<rooms.length; i++){
            		if(rooms[i]._id == params.roomId){
            			roomDAO.getByID(params.roomId,{population:''},function(err, room){
            				if(err){
            					logger.warn("Cannot access room. "+err);
            					wsControl.build(ws, new Error("Cannot access room."), null, refId);
            				} else {
            					for(var j=0; j<room.questions.length; j++){
            						if(room.questions == params.questionId){
            							questionDAO.getByID(params.questionId,{population:'answers.author'},function(err, question){
            								if(err){
            									logger.warn("Cannot get question. "+err);
            									wsControl.build(ws, new Error("Cannot get question."), null, refId);
            								}
            								else {
                                                question.answers = removeAuthorTokens(question.answers);
            									wsControl.build(ws, null, {'answers': question.answers}, refId);
                                            }
            							});
            							return;
            						}
            					}
            					wsControl.build(ws, new Error("Question is not in this room."), null, refId);
            				}
            			});
            			return;
            		}
            	}
            	wsControl.build(ws, new Error("Access denied."), null, refId);
            });
        } else {
        	wsControl.build(ws, new Error("Your session is invalid."), null, refId);
        }
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