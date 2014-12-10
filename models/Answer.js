/*! Model of Answer 
* @param {Number} author The user identifier.
* @param {Number} qid The question identifier.
* @param {Timestamp} time Timestamp of creation
* @param {String} content The content of this question
*/

Answer.idCreator = 0;

function Answer(qid, author, time, content){
	this.id = Answer.idCreator++;
	this.qid = qid;
	this.author = author;
	this.time = time;
	this.content = content;
}

function Answer(qid, author, content){
	this.id = Answer.idCreator++;
	this.qid = qid;
	this.author = author;
	this.time = Date.now();
	this.content = content;
}

module.exports = Answer;

