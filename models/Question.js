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

var QuestionSchema = mongoose.Schema({
    author: { type : ObjectId, ref: 'User' },
    creationTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now },
    content: String,
    votes: [{ type : ObjectId, ref: 'User', unique: true }],
    answers: [{ type : ObjectId, ref: 'Answer' }],
    visible: { type: Boolean, default: true }
});

QuestionSchema.methods.addAnswer = function(answer){
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
}

QuestionSchema.plugin(deepPopulate);
module.exports.Question = mongoose.model('Question',QuestionSchema);
module.exports.QuestionSchema = QuestionSchema;

