/** Model of Question
* @param {Number} author The user identifier.
* @param {Timestamp} time Timestamp of creation
* @param {List} vote List of uids of voters
* @param {String} content The content of this question
* @param {Answers[]} answers The list of answers
*/

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;
var Room = require('../models/Room.js').Room;

var QuestionSchema = mongoose.Schema({
    author: { type : ObjectId, ref: 'User' },
    creationTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now },
    content: String,
    votes: [{ type : ObjectId, ref: 'User', unique: true }],
    answers: [{ type : ObjectId, ref: 'Answer' }],
    visible: { type: Boolean, default: true }
});

/*QuestionSchema.methods.addAnswer = function(answer){
	this.answers.push(answer._id);
	this.updateTime = Date.now();
}

QuestionSchema.methods.getAnswer = function(aid){
	for(var i = 0; i < this.answers.length; i++)
		if(this.answers[i]._id == aid)
			return this.answers[i];
	return null;
}

QuestionSchema.methods.deleteAnswer = function(aid){
	var index = this.indexOfAnswer(aid);
	if(index != -1){
		delete this.answers.splice(index,1);
		updateTime = Date.now();
	}
	return index != -1;
}

QuestionSchema.methods.indexOfAnswer = function(aid){
	for(var i = 0; i < this.answers.length; i++)
		if(this.answers[i]._id == aid) return i;
	return -1;
}

QuestionSchema.methods.vote = function(uid){
	if(this.votes.indexOf(uid) != -1){
		this.votes.push(uid);
		updateTime = Date.now();
		return true;
	}
	return false;
}*/

QuestionSchema.plugin(deepPopulate);
var Question = mongoose.model('Question',QuestionSchema);
module.exports.Question = Question;
module.exports.QuestionSchema = QuestionSchema;

module.exports.addQuestion = function(roomID, question, callback){
	if(callback === undefined)
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
	if(callback === undefined)
		throw new Error("callback not defined");
	Question.findByIdAndUpdate(questionID,{ 'content': content, 'updateTime': Date.now() },function(eQuestion){
		return callback(eQuestion);
	});
}

module.exports.setQuestionVisibility = function(questionID, visible, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	Question.findByIdAndUpdate(questionID,{ 'visible': visible, 'updateTime': Date.now() },function(eQuestion){
		return callback(eQuestion);
	});
}

module.exports.removeQuestion = function(questionID, callback){
	if(callback === undefined)
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
	if(callback === undefined)
		throw new Error("callback not defined");
	Question.findById(questionID).deepPopulate(options.population).exec(function(eQuestion,question){
		return callback(eQuestion,question);
	});
}

module.exports.vote = function(questionID, userID, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	Question.findByIdAndUpdate(questionID,{$push:{'votes': userID}},function(eQuestion){
		return callback(eQuestion);
	});
}

module.exports.getVotes = function(questionID, options, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	Question.findById(questionID,'votes').deepPopulate(options.population).exec(function(eQuestion,question){
		return callback(eQuestion,question.votes);
	});
}

module.exports.getVotesCount = function(questionID, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	Question.aggregate([{$match:{'_id':questionID}},{$project:{count:{$size:'$votes'}}}],function(eQuestion,questions){
		return callback(eQuestion,questions[0].count);
	});
}