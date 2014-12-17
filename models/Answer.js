/*! Model of Answer 
* @param {Number} author The user identifier.
* @param {Number} qid The question identifier.
* @param {Timestamp} time Timestamp of creation
* @param {String} content The content of this question
*/

function Answer(aid, qid, author, time, content){
	this.id = aid;
	this.qid = qid;
	this.author = author;
	this.time = time;
	this.content = content;
}

function Answer(aid, qid, author, content){
	this.id = aid;
	this.qid = qid;
	this.author = author;
	this.time = Date.now();
	this.content = content;
}

module.exports = Answer;

