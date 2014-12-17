/** Model of Question
* @param {Number} author The user identifier.
* @param {Timestamp} time Timestamp of creation
* @param {List} vote List of uids of voters
* @param {String} content The content of this question
* @param {Answers[]} answers The list of answers
*/

function Question(qid, author, time, votes, content, answers){
	this.id = qid;
	this.author = author;
	this.time = time;
	this.content = content;
	this.votes = votes;
	this.answers = answers;
	this.visible = true;
}

function Question(qid, author, content){
	this.id = qid;
	this.author = author;
	this.time = Date.now();
	this.content = content;
	this.votes = [];
	this.answers = [];
	this.visible = true;
}

Question.prototype.addAnswer = function(answer){
	this.answers.push(answer);
}

Question.prototype.getAnswer = function(aid){
	for(var i = 0; i < this.answers.length; i++)
		if(this.answers[i].id == aid)
			return this.answers[i];
	return null;
}

Question.prototype.deleteAnswer = function(aid){
	var index = this.indexOfAnswer(aid);
	if(index != -1)
		delete this.answers.splice(index,1);
	return index != -1;
}

Question.prototype.indexOfAnswer = function(aid){
	for(var i = 0; i < this.answers.length; i++)
		if(this.answers[i].id == aid) return i;
	return -1;
}

module.exports = Question;

