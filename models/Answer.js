/*! Model of Answer 
* @param {Number} uid The user identifier.
* @param {Number} qid The question identifier.
* @param {Timestamp} time Timestamp of creation
* @param {String} content The content of this question
*/

Answer.idCreator = 0;

function Answer(qid, uid, time, content){
	this.id = this.idCreator++;
	this.qid = qid;
	this.uid = uid;
	this.time = time;
	this.content = content;
}

function Answer(qid, uid, content){
	this.id = this.idCreator++;
	this.qid = qid;
	this.uid = uid;
	this.time = Date.now();
	this.content = content;
}

module.exports = Answer;

