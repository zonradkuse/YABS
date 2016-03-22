/** @module WSAPI/Room */

var roomDAO = require('../../models/Room.js');
var userDAO = require('../../models/User.js');
var questionDAO = require('../../models/Question.js');
var panicDAO = require('../Panic.js');
var panicGraphDAO = require('../../models/PanicGraph.js');
var accessManager = require('../AccessManagement.js');
var logger = require('../Logger.js');

module.exports = function (wsControl) {
    wsControl.on("room:userCount", function (req, res) {
        accessManager.checkAccessBySId("room:userCount", req.sId, req.params.roomId, function (err, hasAccess) {
            if (hasAccess) {
                req.wss.getActiveUsersByRoom(req.params.roomId, function (err, num) {
                    if (err) {
                        logger.warn("Could not get Usercount: " + err);
                        res.setError(new Error("Could not get Usercount"));
                    }
                    res.send({ count : num });
                });
            } else {
                res.setError(new Error("Access Denied")).send();
            }
        });

    });
    wsControl.on("room:getQuestions", function (req, res) {
        //req.params.roomId
        if (req.session.user && req.params.roomId) {
            userDAO.hasAccessToRoom(req.session.user, { _id : req.params.roomId }, {population: 'questions.author.avatar questions.answers.images questions.images questions.answers.author.avatar'}, function (err, user, room) {
                if (err) {
                    return res.setError(err).send();
                }
                room = room.toObject();
                room.questions = removeAuthorTokens(room.questions);
                var date = new Date().getTime()- 8* 24* 60* 60* 1000;
                for (var j = room.questions.length - 1; j >= 0; j--) {
                    room.questions[ j ].answers = removeAuthorTokens(room.questions[ j ].answers);
                    room.questions[ j ].images = removeOwnerFields(room.questions[ j ].images);
                    if (room.questions[ j ].answers) {
                        for (var i = room.questions[ j ].answers.length - 1; i >= 0; i--) {
                            room.questions[ j ].answers[ i ].images = removeOwnerFields(room.questions[ j ].answers[ i ].images);
                        }
                    }
                    if (room.questions[ j ].content !== "") {
                        res.sendCommand("question:add", {
                            roomId : req.params.roomId,
                            question : createVotesFields(req.session.user, room.questions[ j ])
                        });
                    }
                }
            });
        } else {
            res.setError(new Error("Your req.session is invalid.")).send();
        }
    });

    wsControl.on("room:getAnswers", function (req, res) {
        //req.params.roomId
        //req.params.questionId
        if (req.session.user && req.params.roomId && req.params.questionId) {
            userDAO.hasAccessToQuestion(req.session.user, { _id : req.params.roomId }, { _id : req.params.questionId }, {population: 'answers.author.avatar'}, function (err, user, question) {
                if (err) {
                    logger.warn("Cannot get question.: "+ err);
                    res.setError(new Error("Cannot get question."));
                } else {
                    question.answers = removeAuthorTokens(question.answers);
                    res.send({'answers': question.answers});
                }
            });
        } else {
            res.setError(new Error("Your req.session is invalid.")).send();
        }
    });

    wsControl.on("room:exists", function (req, res) {
        if ( req.params.roomId == 0 ) { // this checks whether the name is taken
            roomDAO.Room.findOne({ name : req.params.name }, function (err, room) {
                if (err) return res.setError(err).send(); 
                res.send({ exists : room ? true : false }); 
            });
        } else {
            userDAO.hasAccessToRoom(req.session.user, {_id: req.params.roomId}, {population: ''}, function (err, room) {
                if (err) {
                    return res.setError(new Error("Access denied.")).send();
                }
                res.send({'exists': (room ? true : false)});
            });
        }
    });

    wsControl.on("room:enablePanicEvents", function (req, res) {
        if (req.authed) {
            if (req.params.roomId && req.params.intervals) {
                accessManager.checkAccessBySId("room:enablePanicEvents", req.sId, req.params.roomId, function (err, hasAccess) {
                    if (err || !hasAccess) {
                        return res.setError(new Error("Access denied.")).send();
                    }
                    userDAO.hasAccessToRoom(req.session.user, {_id: req.params.roomId}, {population: ''}, function (err, room) {
                        if (err) {
                            return res.setError(new Error("Access denied.")).send();
                        }
                        var options = {};
                        options.intervals = req.params.intervals;
                        panicDAO.register({_id: req.params.roomId}, wsControl, req.wss, req.ws, options, function (err) {
                            if (err) {
                                return res.setError(new Error("Cannot enable panic events.")).send();
                            }
                            res.roomBroadcastUser("room:panicStatus", {isEnabled: true, hasUserPanic: false}, req.params.roomId);
                        });
                    });
                });
            }else {
                res.setError(new Error("Invalid req.params.")).send();
            }
        } else {
            res.setError(new Error("Your req.session is invalid.")).send();
        }
    });

    wsControl.on("room:disablePanicEvents", function (req, res) {
        if (req.authed) {
            if (req.params.roomId) {
                accessManager.checkAccessBySId("room:disablePanicEvents", req.sId, req.params.roomId, function (err, hasAccess) {
                    if (err || !hasAccess) {
                        return res.setError(new Error("Access denied.")).send();
                    }
                    userDAO.hasAccessToRoom(req.session.user, {_id: req.params.roomId}, {population: ''}, function (err, room) {
                        if (err) {
                            return res.setError(new Error("Access denied.")).send();
                        }
                        panicDAO.unregister({_id: req.params.roomId}, function (err) {
                            if (err) {
                                return res.setError(new Error("Cannot disable panic events.")).send();
                            }
                            res.roomBroadcastUser("room:panicStatus", {isEnabled: false, hasUserPanic: false}, req.params.roomId);
                        });
                    });
                });
            }else {
                res.setError(new Error("Invalid req.params.")).send();
            }
        } else {
            res.setError(new Error("Your req.session is invalid.")).send();
        }
    });

    wsControl.on("room:getPanicGraph", function (req, res) {
        if (req.authed) {
            if (req.params.roomId) {
                accessManager.checkAccessBySId("room:getPanicGraph", req.sId, req.params.roomId, function (err, hasAccess) {
                    if (err || !hasAccess) {
                        return res.setError(new Error("Access denied."));
                    }
                    userDAO.hasAccessToRoom(req.session.user, {_id: req.params.roomId}, {population: ''}, function (err, room) {
                        if (err) {
                            return res.setError(new Error("Access denied."));
                        }
                        panicGraphDAO.getGraph({_id: req.params.roomId}, {population: ''}, function (err, graph) {
                            if (err) {
                                return res.setError(new Error("Cannot get graph."));
                            }
                            if (!graph) {
                                return res.send({'graph': []});
                            }
                            res.send({'graph': removeIdFields(graph.data.toObject())});
                        });
                    });
                });
            }else {
                res.setError(new Error("Invalid req.params.")).send();
            }
        } else {
            res.setError(new Error("Your req.session is invalid.")).send();
        }
    });
};

function removeAuthorFields(author) {
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
        if (input[ i ].author) {
            if (input[ i ].author.rwth) {
                var a = JSON.parse(JSON.stringify(input[ i ].author));
                input[ i ].author = removeAuthorFields(input[ i ].author);
                if (a.avatar && a.avatar.path !== undefined) {
                    input[ i ].author.avatar = a.avatar.path;
                }
            }
        }
    }
    return input;
}

function createVotesFields(user, question) {
    var hasVote = false;
    for (var i= 0; i<question.votes.length; i++) {
        if (question.votes[ i ].toString() == user._id) {
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
function removeIdFields(input) {
    for (var i = input.length - 1; i >= 0; i--) {
        delete input[ i ]._id;
    }
    return input;
}

function removeOwnerFields(images) {
    if (images) { 
        for (var i = images.length - 1; i >= 0; i--) {
            delete images[ i ].owner; 
        }
    }
    return images;
}

function addAuthorAvatarPath(author) {
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
