/** Model of Question
* @param {Number} author The user identifier.
* @param {Timestamp} time Timestamp of creation
* @param {Number} vote Number of votes
* @param {String} content The content of this question
* @param {Answers[]} answers The list of answers
*/


Question.idCreator = 0; /*Baaaaaad :D*/

function Question(author, time, votes, content, answers){
	this.id = Question.idCreator++;
	this.author = author;
	this.time = time;
	this.content = content;
	this.votes = votes;
	this.answers = answers;
	this.visible = true;
}

function Question(author, content){
	this.id = Question.idCreator++;
	this.author = author;
	this.time = Date.now();
	this.content = content;
	this.votes = 0;
	this.answers = [];
	this.visible = true;
}

Question.prototype.addAnswer = function(answer){
	this.answers[answer.id] = answer;
}


module.exports = Question;

