/** Model of a Thread. A Thread will contain questions with a list of answers. */

function Thread(){
	this.creationTime;
	this.questions = [];
}

Thread.prototype.addQuestion = function(question){
	this.questions[question.id] = question;
}

module.exports = Thread;