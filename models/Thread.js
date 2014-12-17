/** Model of a Thread. A Thread will contain questions with a list of answers. */

function Thread(time){
	this.time = time;
	this.questions = [];
}

function Thread(){
	this.time = Date.now();
	this.questions = [];
}

Thread.prototype.test = function(a, b){
	console.log(a +' | '+b);
	if(b == undefined)
		console.log("UNDEFINED");
}

Thread.prototype.addQuestion = function(question){
	this.questions.push(question);
}

Thread.prototype.getQuestion = function(qid){
	for(var i = 0; i < this.questions.length; i++)
		if(this.questions[i].id == qid)
			return this.questions[i];
	return null;
}

Thread.prototype.deleteQuestion = function(qid){
	var index = this.indexOfQuestion(qid);
	if(index != -1)
		delete this.questions.splice(index,1);
	return index != -1;
}

Thread.prototype.reply = function(qid, answer){
	var q = this.getQuestion(qid);
	if(q == null) return;
	q.addAnswer(answer);
}

Thread.prototype.vote = function(qid, uid){
	var index = this.indexOfQuestion(qid);
	if(index != -1 && this.questions[index].votes.indexOf(uid) != -1){
		this.questions[qid].votes.push(uid);
		return true;
	}
	return false;
}

Thread.prototype.setVisibility = function(qid, isVisible){
	if(qid in this.questions)
		this.questions[qid].visible = isVisible;
}

/*fitlers: key = property, value = function*/
Thread.prototype.filterProp = function(filters){
	var listFiltered = [];
	for(var i = 0; i < this.questions.length; i++){
		var valid = true;
		for(var prop in filters){
			valid = valid && filters[prop](this.questions[i][prop]);
			if(!valid) break;
		}
		if(valid) listFiltered.push(this.questions[i]);
	}
	return listFiltered;
}

Thread.prototype.filterObj = function(filter){
	var listFiltered = [];
	for(var i = 0; i < this.questions.length; i++)
		if(filter(this.questions[i])) listFiltered.push(this.questions[i]);
	return listFiltered;
}

Thread.prototype.sort = function(sorter, limit){
	var listSorted = this.questions.slice(0);
	for(var s in sorter)
		listSorted.sort(sorter[s]);
	if(limit == undefined || limit < 0 || limit >= listSorted.length)
		return listSorted;
	else 
		return listSorted.splice(0,limit);
}

Thread.prototype.indexOfQuestion = function(qid){
	for(var i = 0; i < this.questions.length; i++)
		if(this.questions[i].id == qid)	return i;
	return -1;
}

module.exports = Thread;