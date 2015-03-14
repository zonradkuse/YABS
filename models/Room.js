/** Model of a Thread. A Thread will contain questions with a list of answers. */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;
var User = require('../models/User.js').User;

var RoomSchema = mongoose.Schema({
	l2pID: { type: String, unique: true },
	name: String,
    creationTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now },
    questions: [{ type : ObjectId, ref: 'Question' }],
    visible: { type: Boolean, default: true },
    description: String,
    url: String,
    status: String,
    semester: String
});

/*RoomSchema.methods.addQuestion = function(question){
	this.questions.push(question._id);
	updateTime = Date.now();
}

RoomSchema.methods.getQuestion = function(qid){
	for(var i = 0; i < this.questions.length; i++)
		if(this.questions[i]._id == qid)
			return this.questions[i];
	return null;
}

RoomSchema.methods.deleteQuestion = function(qid){
	var index = this.indexOfQuestion(qid);
	if(index != -1){
		delete this.questions.splice(index,1);
		updateTime = Date.now();
	}
	return index != -1;
}

RoomSchema.methods.reply = function(qid, answer){
	var q = this.getQuestion(qid);
	if(q == null) return;
	q.addAnswer(answer);
	updateTime = Date.now();
}

RoomSchema.methods.vote = function(qid, uid){
	var q = this.getQuestion(qid);
	if(q != null && q.vote(uid)){
		updateTime = Date.now();
		return true;
	}
	return false;
}

RoomSchema.methods.setVisibility = function(qid, isVisible){
	if(qid in this.questions)
		this.questions[qid].visible = isVisible;
}*/

/*fitlers: key = property, value = function*/
/*RoomSchema.methods.filterProp = function(filters){
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

RoomSchema.methods.filterObj = function(filter){
	var listFiltered = [];
	for(var i = 0; i < this.questions.length; i++)
		if(filter(this.questions[i])) listFiltered.push(this.questions[i]);
	return listFiltered;
}

RoomSchema.methods.sort = function(sorter, limit){
	var listSorted = this.questions.slice(0);
	for(var s in sorter)
		listSorted.sort(sorter[s]);
	if(limit == undefined || limit < 0 || limit >= listSorted.length)
		return listSorted;
	else
		return listSorted.splice(0,limit);
}

RoomSchema.methods.indexOfQuestion = function(qid){
	for(var i = 0; i < this.questions.length; i++)
		if(this.questions[i].id == qid)	return i;
	return -1;
}*/

RoomSchema.plugin(deepPopulate);
var Room = mongoose.model('Room',RoomSchema);
module.exports.Room = Room;
module.exports.RoomSchema = RoomSchema;

module.exports.getRoom = function(roomID, options, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	Room.findById(roomID).deepPopulate(options.population).exec(function(eRoom,room){
		return callback(eRoom,room);
	});
}

module.exports.getRooms = function(options, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	Room.find({}).deepPopulate(options.population).exec(function(eRooms,rooms){
		return callback(eRooms,rooms);
	});
}

module.exports.getRoomsFromUser = function(userID, options, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	User.findById(userID).deepPopulate('access access.'+options.population).exec(function(eUser, user){
		return callback(eRooms,user.access);
	});
}

module.exports.addRoomsToUser = function(userID, roomIDs, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	User.findByIdAndUpdate(userID,{$pushAll:{'access': roomIDs}},function(eUser, user){
		return callback(eUser, user);
	});
}

module.exports.createRoom = function(room, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	room.save(function(eRoom, room){
		return callback(eRoom, room);
	});
}