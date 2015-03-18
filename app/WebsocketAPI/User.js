var system = require('./System.js');
var questionDAO = require('../../models/Question.js');
var userDAO = require('../../models/User.js');
var roomDAO = require('../../models/Room.js');
var answerDAO = require('../../models/Answer.js');

module.exports = function(wsControl){
    wsControl.on('user:fetchRooms', function(wss, ws, session, params, interfaceEntry, refId, sId){
            if(session.user && session.user._id){
                var worker = system.getWorkerMap()[sId];
                console.log(system.getWorkerMap()[sId]);
                if(worker){
                    worker.fetchRooms(refId);
                } else {
                    wsControl.build(ws, new Error("Your worker is invalid."), null, refId);
                }
            } else {
                wsControl.build(ws, new Error("Your session is invalid."), null, refId);
            }
    });
    
    wsControl.on('user:getRooms', function(wss, ws, session, params, interfaceEntry, refId, sId){
            if(session && session.user && session.user._id){
                userDAO.getRoomAccess(session.user, {population: ''}, function(err, rooms){
                    wsControl.build(ws, null, {
                        'rooms': rooms,
                    }, refId);
                });
            } else {
                wsControl.build(ws, new Error("Your session is invalid."), null, refId);
            }
    });

    wsControl.on('user:ask', function(wss, ws, session, params, interfaceEntry, refId, sId){
        if(params && params.question && params.roomId){
            //check if user is in room
            userDAO.getRoomAccess(session.user, {population: ''}, function(err, access){
                if(err) {
                    logger.warn("error on getting room access array " + err);
                } else {
                    for (var i = access.length - 1; i >= 0; i--) {
                        if(access[i]._id === roomId){
                            var q = new questionDAO.Question();
                            q.author = session.user._id;
                            q.content = params.question;
                            q.votes = session.user._id;
                            q.answers = [];
                            roomDAO.addQuestion({ _id : params.roomId}, q, function(err, room, question){
                                if(err) {
                                    logger.warn("could not add or create question: " + err);
                                    wsControl.build(ws, new Error("could not add or create question"), null, refId);
                                } else {
                                    wsControl.roomBroadcast(ws, 'question:add', {
                                        'roomId': room._id,
                                        'question': question
                                    }, room._id);
                                    logger.info("added new question to room " + room.l2pID);
                                }
                            });
                            return;
                        }
                    };
                    wsControl.build(ws, new Error("Access Denied."), null, refId);
                }
            })
        } else {
            wsControl.build(ws, new Error("malformed params"), null, refId);
        }
    });

    wsControl.on("user:answer", function(wss, ws, session, params, interfaceEntry, refId, sId){
        if(params && params.roomId && params.questionId && params.answer) {
            userDAO.getRoomAccess(session.user, {population: 'questions'}, function(err, access){
                for (var i = access.length - 1; i >= 0; i--) {
                    if (access[i]._id === params.roomId) {
                        for (var j = access[i].questions.length - 1; j >= 0; j--) {
                            if (access[i].questions[j]._id === params.questionId) {
                                var a = new answerDAO.Answer();
                                a.author = session.user._id;
                                a.content = params.answer;
                                questionDAO.addAnswer({_id : params.questionId}, a, function(err, question, answer){
                                    if(err) {
                                        logger.warn("could not add or create question: " + err);
                                        wsControl.build(ws, new Error("could not add or create question"), null, refId);
                                    } else {
                                        wsControl.roomBroadcast(ws, 'answer:add', {
                                            'roomId': room._id,
                                            'questionId': question._id,
                                            'answer': answer
                                        }, room._id);
                                        logger.info("added new question to room " + room.l2pID);
                                    }
                                });
                            }
                        };
                    } 
                };

            });
        }
    })
};
