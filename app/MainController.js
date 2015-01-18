var Room = require('../models/Room.js').Room;
var Question = require('../models/Question.js').Question;
var Answer = require('../models/Answer.js').Answer;
var User = require('../models/User.js').User;
var mongoose = require('mongoose');

var dbconnection;

module.exports = function(connection){
	dbconnection = connection;
}


//--------QUESTIONS
module.exports.addQuestion = function(roomID, question, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	question.save(function(eQuestion){
		if(eQuestion) 
			return callback(eQuestion);
		Room.findByIdAndUpdate(roomID,{$push:{'questions': question._id}},function(eRoom){
			return callback(eRoom, question);
		});
	});
}

module.exports.setQuestionContent = function(questionID, content, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	Question.findByIdAndUpdate(questionID,{ 'content': content, 'updateTime': Date.now() },function(eQuestion){
		return callback(eQuestion);
	});
}

module.exports.setQuestionVisibility = function(questionID, visible, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	Question.findByIdAndUpdate(questionID,{ 'visible': visible, 'updateTime': Date.now() },function(eQuestion){
		return callback(eQuestion);
	});
}

module.exports.removeQuestion = function(questionID, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	Room.update({'questions': questionID},{$pull:{'questions': questionID}},function(eRoom){
		if(eRoom) 
			return callback(eRoom);
		Question.findByIdAndRemove(questionID,function(eQuestion){
			return callback(eQuestion);
		});
	});
}

module.exports.getQuestion = function(questionID, options, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	Question.findById(questionID).deepPopulate(options.population).exec(function(eQuestion,question){
		return callback(eQuestion,question);
	});
}


//------ANSWERS
module.exports.addAnswer = function(questionID, answer, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	answer.save(function(eAnswer){
		if(eAnswer) 
			return callback(eAnswer);
		Question.findByIdAndUpdate(questionID,{$push:{'answers': answer._id}},function(eQuestion){
			return callback(eQuestion, answer);
		});
	});
}

module.exports.setAnswerContent = function(answerID, content, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	Answer.findByIdAndUpdate(answerID,{ 'content': content, 'updateTime': Date.now() },function(eAnswer){
		return callback(eAnswer);
	});
}

module.exports.setAnswerVisibility = function(answerID, visible, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	Answer.findByIdAndUpdate(answerID,{ 'visible': visible, 'updateTime': Date.now() },function(eAnswer){
		return callback(eAnswer);
	});
}

module.exports.removeAnswer = function(answerID, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	Question.update({'answers': answerID},{$pull:{'answers': answerID}},function(eQuestion){
		if(eQuestion) 
			return callback(eQuestion);
		Answer.findByIdAndRemove(questionID,function(eAnswer){
			return callback(eAnswer);
		});
	});
}

module.exports.getAnswer = function(answerID, options, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	Answer.findById(answerID).deepPopulate(options.population).exec(function(eAnswer,answer){
		return callback(eAnswer,answer);
	});
}



//-------ROOMS
module.exports.getRoom = function(roomID, options, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	Room.findById(roomID).deepPopulate(options.population).exec(function(eRoom,room){
		return callback(eRoom,room);
	});
}

module.exports.getRooms = function(options, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	Room.find({}).deepPopulate(options.population).exec(function(eRooms,rooms){
		return callback(eRooms,rooms);
	});
}

module.exports.getRoomsFromUser = function(userID, options, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	User.findById(userID).deepPopulate('access access.'+options.population).exec(function(eUser, user){
		return callback(eRooms,user.access);
	});
}

module.exports.addRoomsToUser = function(userID, roomIDs, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	User.findByIdAndUpdate(userID,{$pushAll:{'access': roomIDs}},function(eUser){
		return callback(eRooms);
	});
}

module.exports.createRoom = function(room, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	room.save(function(eRoom, room){
		return callback(eRoom, room);
	});
}



//-------USER
module.exports.createUser = function(user, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	user.save(function(eUser, user){
		return callback(eUser, user);
	});
}

module.exports.getUser = function(userID, callback){
	if(callback == undefined)
		throw new Error("callback not defined");
	User.findById(userID,function(eUser, user){
		return callback(eUser, user);
	});
}