var roomDAO = require('../../models/Room.js');
var userDAO = require('../../models/User.js');


module.exports = function(wsControl){
    wsControl.on("room:getQuestions", function(wss, ws, session, params, interfaceEntry, refId, sId){
        //params.roomId
        if(session.user && params.roomId){
			userDAO.getRoomAccess(session.user, {population: 'questions.author access.questions.answers.author'}, function(err, rooms){
            	for(var i=0; i<rooms.length; i++){
            		if(rooms[i]._id == params.roomId){
            			wsControl.build(ws, null, {
		                    'questions': rooms[i].questions,
		                }, refId);
            			return;
            		}
            	}
            	wsControl.build(ws, new Error("Access denied."), null, refId);
            });
        }
        else{
        	wsControl.build(ws, new Error("Your session is invalid."), null, refId);
        }

    });

    wsControl.on("room:getAnswers", function(wss, ws, session, params, interfaceEntry, refId, sId){
        //params.roomId
        //params.questionId
    });
};