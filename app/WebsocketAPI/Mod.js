var answerDAO = require('../../models/Answer.js');
var questionDAO = require('../../models/Question.js');
var accessManager = require('../AccessManagement.js');
var roomWSControl = require('./Room.js');
var logger = require('../Logger.js');

module.exports = function(wsControl) {
    wsControl.on("mod:deleteAnswer", function(wss, ws, session, params, interfaceEntry, refId, sId, authed){
        if(authed) {
            if(params.roomId && params.questionId && params.answerId) {
                accessManager.checkAccessBySId("mod:markAsAnswer", sId, params.roomId, function(err, bool){
                    if (bool) {
                        answerDAO.getByID(params.answerId, {population: 'author author.avatar'}, function(err, ans){
                            ans.images = [];
                            ans.content = "Der Inhalt wurde gelöscht.";
                            ans.deleted = true;
                            ans.isAnswer = false;
                            ans.save(function(err){
                                if (err){
                                    wsControl.build(ws, new Error("Could not save the new state."), null, refId);
                                    return logger.err("Could not save the new state: " + err);
                                }
                                var _ans = JSON.parse(JSON.stringify(ans));
                                _ans.author.avatar = _ans.author.avatar.path;
                                _ans.author = roomWSControl.removeAuthorFields(_ans.author);
                                _ans.images = roomWSControl.removeOwnerFields(_ans.images);
                                wss.roomBroadcast(ws, "answer:add", {
                                    'roomId': params.roomId,
                                    'questionId' : params.questionId,
                                    'answer' : _ans
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

    wsControl.on("mod:deleteQuestion", function(wss, ws, session, params, interfaceEntry, refId, sId, authed){
        if(authed) {
            if(params.roomId && params.questionId) {
                accessManager.checkAccessBySId("mod:markAsAnswer", sId, params.roomId, function(err, bool){
                    if (bool) {
                        questionDAO.getByID(params.questionId, {population: 'author author.avatar'}, function(err, q){
                            q.images = [];
                            q.content = "Der Inhalt wurde gelöscht.";
                            q.votes = [];
                            q.answers = [];
                            q.visible = false;
                            q.save(function(err){
                                if (err){
                                    wsControl.build(ws, new Error("Could not save the new state."), null, refId);
                                    return logger.err("Could not save the new state: " + err);
                                }
                                var _q = JSON.parse(JSON.stringify(q));
                                _q.author.avatar = _q.author.avatar.path;
                                _q.author = roomWSControl.removeAuthorFields(_q.author);
                                _q.images = roomWSControl.removeOwnerFields(_q.images);
                                _q.answers = [];
                                wss.roomBroadcast(ws, "question:add", {
                                    'roomId': params.roomId,
                                    'question' : roomWSControl.createVotesFields(session.user, _q)
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
    wsControl.on("mod:markAsAnswer", function(wss, ws, session, params, interfaceEntry, refId, sId, authed){
        if (authed) {
            if (params.roomId && params.questionId && params.answerId) {
                accessManager.checkAccessBySId("mod:markAsAnswer", sId, params.roomId, function(err, bool){
                    if (bool) {
                        answerDAO.getByID(params.answerId, {population: 'author author.avatar images'}, function(err, ans){
                            ans.isAnswer = true;
                            ans.save(function(err){
                                if (err){
                                    wsControl.build(ws, new Error("Could not save the new state."), null, refId);
                                    return logger.err("Could not save the new state: " + err);
                                }
                                var toSend = JSON.parse(JSON.stringify(ans));
                                toSend.author = roomWSControl.removeAuthorFields(toSend.author);
                                toSend.author.avatar = toSend.author.avatar.path;
                                wss.roomBroadcast(ws, "answer:add", {
                                    'roomId': params.roomId,
                                    'questionId': params.questionId,
                                    'answer': toSend
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
                        answerDAO.getByID(params.answerId, {population: 'author author.avatar images'}, function(err, ans){
                            ans.isAnswer = false;
                            
                            ans.save(function(err){
                                if (err){
                                    wsControl.build("Could not save the new state.");
                                    return logger.err("Could not save the new state: " + err);
                                }
                                var toSend = JSON.parse(JSON.stringify(ans));
                                toSend.author = roomWSControl.removeAuthorFields(toSend.author);
                                toSend.author.avatar = toSend.author.avatar.path;
                                wss.roomBroadcast(ws, "answer:add", {
                                    'roomId': params.roomId,
                                    'questionId': params.questionId,
                                    'answer': toSend
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