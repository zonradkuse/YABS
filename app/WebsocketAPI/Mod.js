var answerDAO = require('../../models/Answer.js');
var accessManager = require('../AccessManagement.js');

module.exports = function(wsControl) {
    wsControl.on("mod:markAsAnswer", function(wss, ws, session, params, interfaceEntry, refId, sId, authed){
        if (authed) {
            if (params.roomId && params.questionId && params.answerId) {
                accessManager.checkAccessBySId("mod:markAsAnswer", sId, params.roomId, function(err, bool){
                    if (bool) {
                        answerDAO.getByID(params.answerId, {population: 'author'}, function(err, ans){
                            ans.isAnswer = true;
                            ans.save(function(err){
                                if (err){
                                    wsControl.build("Could not save the new state.");
                                    return logger.err("Could not save the new state: " + err);
                                }
                                wss.roomBroadcast(ws, "answer:add", {
                                    'roomId': params.roomId,
                                    'questionId': params.questionId,
                                    'answer': ans
                                }, params.roomId);
                            });
                        });
                    } else {
                        wsControl.build(ws, new Error("Access Denied."), null, refId);
                    }
                });
            } else {
                wsControl.build(ws, new Error("Missing Parameters."), null, refId);
            }
        } else {
            wsControl.build(ws, new Error("Access Denied."), null, refId);
        }
    });
    
    wsControl.on("mod:unmarkAsAnswer", function(wss, ws, session, params, interfaceEntry, refId, sId, authed){
        if (authed) {
            if (params.roomId && params.questionId && params.answerId) {
                accessManager.checkAccessBySId("mod:markAsAnswer", sId, params.roomId, function(err, bool){
                    if (bool) {
                        answerDAO.getByID(params.answerId, {population: 'author'}, function(err, ans){
                            ans.isAnswer = false;
                            
                            ans.save(function(err){
                                if (err){
                                    wsControl.build("Could not save the new state.");
                                    return logger.err("Could not save the new state: " + err);
                                }
                                ans.author = ans.author.local;
                                wss.roomBroadcast(ws, "answer:add", {
                                    'roomId': params.roomId,
                                    'questionId': params.questionId,
                                    'answer': ans
                                }, params.roomId);
                            });
                        });
                    } else {
                        wsControl.build(ws, new Error("Access Denied."), null, refId);
                    }
                });
            } else {
                wsControl.build(ws, new Error("Missing Parameters."), null, refId);
            }
        } else {
            wsControl.build(ws, new Error("Access Denied."), null, refId);
        }
    });
};