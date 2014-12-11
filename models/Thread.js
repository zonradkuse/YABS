/** Model of a Thread. A Thread will contain questions with a list of answers. */

function Thread(time){
	this.time = time;
	this.questions = [];
}

function Thread(){
	this.time = Date.now();
	this.questions = [];
}

Thread.prototype.addQuestion = function(question){
	this.questions[question.id] = question;
}

/*fitlers: key = property, value = function*/
Thread.prototype.filterProp = function(filters){
	var listFiltered = [];
	for(var key in this.questions){
		var valid = true;
		for(var prop in filters){
			valid = valid && filters[prop](this.questions[key][prop]);
			if(!valid) break;
		}
		if(valid) listFiltered.push(this.questions[key]);
	}
	return listFiltered;
}

Thread.prototype.filterObj = function(filter){
	var listFiltered = [];
	for(var key in this.questions)
		if(filter(this.questions[key])) listFiltered.push(this.questions[key]);
	return listFiltered;
}

Thread.prototype.vote = function(qid, uid){
	if(qid in this.questions && this.question.votes.indexOf(uid) >= 0){
		this.questions[qid].votes.push(uid);
		return true;
	}
	return false;
}

Thread.prototype.setVisibility = function(qid, isVisible){
	if(qid in this.questions)
		this.questions[qid].visible = isVisible;
}

module.exports = Thread;