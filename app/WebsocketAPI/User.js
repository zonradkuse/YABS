var system = require('./System.js');
var questionDAO = require('../../models/Question.js');
var userDAO = require('../../models/User.js');
var roomDAO = require('../../models/Room.js');
var answerDAO = require('../../models/Answer.js');
var logger = require('../Logger.js');

module.exports = function(wsControl){
    wsControl.on("user:vote", function(wss, ws, session, params, interfaceEntry, refId, sId, authed){
        if (authed) {
            if (params.questionId) {
                userDAO.hasAccessToQuestion(session.user, { _id : params.roomId }, { _id : params.questionId }, { population: '' }, function (err, user, question){
                    if (err) {
                        return logger.warn("could not check user access: " + err);
                    }
                    questionDAO.vote(question, session.user, function(err, question){
                        
                    });
                });
            } else {
                wsControl.build(ws, new Error("Malformed Parameters."), null, refId);
            }
        } else {
            wsControl.build(ws, new Error("Permission denied."), null, refId);
        }
    });

    wsControl.on('user:fetchRooms', function(wss, ws, session, params, interfaceEntry, refId, sId, authed){
            if(authed){
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
    
    wsControl.on('user:getRooms', function(wss, ws, session, params, interfaceEntry, refId, sId, authed){
            if(authed){
                userDAO.getRoomAccess(session.user, {population: ''}, function(err, rooms){
                    if (err) {
                        return logger.warn("could not get rooms: " + err);
                    }
                    rooms = rooms.toObject();
                    for (var i = rooms.length - 1; i >= 0; i--) {
                        wsControl.build(ws, null, null, null, "room:add", {
                            'room': rooms[i],
                        });
                    };
                    
                });
            } else {
                wsControl.build(ws, new Error("Your session is invalid."), null, refId);
            }
    });

    wsControl.on('user:ask', function(wss, ws, session, params, interfaceEntry, refId, sId, authed){
        if (authed) {
            if(params && params.question && params.roomId){
                //check if user is in room
                userDAO.getRoomAccess(session.user, {population: ''}, function(err, access){
                    if(err) {
                        logger.warn("error on getting room access array " + err);
                    } else {
                        for (var i = access.length - 1; i >= 0; i--) {
                            if(access[i]._id == params.roomId){
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
                                        questionDAO.getByID(question._id, {population : 'author answers answers.author'}, function(err, quest) {
                                            quest.votes = undefined;
                                            quest.author = quest.author.local;
                                            for (var i = quest.answers.length - 1; i >= 0; i--) {
                                                quest.answers[i].author = quest.answers[i].author.local;
                                            };
                                            wss.roomBroadcast(ws, 'question:add', {
                                                'roomId': room._id,
                                                'question': quest
                                            }, room._id);
                                            logger.info("added new question to room " + room._id);
                                        });
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
        } else {
            wsControl.build(ws, new Error("Permission denied."), null, refId);
        }
    });

    wsControl.on("user:answer", function(wss, ws, session, params, interfaceEntry, refId, sId, authed){
        if (authed){
            if(params && params.roomId && params.questionId && params.answer) {
                userDAO.getRoomAccess(session.user, {population: 'questions'}, function(err, access){
                    var hasAccess = false;
                    for (var i = access.length - 1; i >= 0; i--) {
                        if (access[i]._id == params.roomId) {
                            hasAccess = true;
                            var room = access[i];
                            questionDAO.getByID(params.questionId, {population : ''}, function(err, q){
                                if (q){
                                    var a = new answerDAO.Answer();
                                    a.author = session.user._id;
                                    a.content = params.answer;
                                    questionDAO.addAnswer(q, a, function(err, question, answer){
                                        if(err) {
                                            logger.warn("could not add or create question: " + err);
                                            wsControl.build(ws, new Error("could not add or create answer"), null, refId);
                                        } else {
                                            wss.roomBroadcast(ws, 'answer:add', {
                                                'roomId': room._id,
                                                'questionId': question._id,
                                                'answer': a
                                            }, room._id);
                                            logger.info("added new answer to room " + room.l2pID);
                                        }
                                    });
                                    return;
                                }
                            });
                        } 
                    };
                    if (!hasAccess) {
                        wsControl.build(ws, new Error("Access Denied."), null, refId);
                    }
                });
            } else {
                wsControl.build(ws, new Error("malformed params"), null, refId);
            }
        } else {
            wsControl.build(ws, new Error("Permission denied."), null, refId);
        }
    });
};
