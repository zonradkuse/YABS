/** Model of a Thread. A Thread will contain questions with a list of answers. */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var findOrCreate = require('mongoose-findorcreate');
var ObjectId = mongoose.Schema.ObjectId;
var User = require('../models/User.js');

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
RoomSchema.plugin(findOrCreate);
var Room = mongoose.model('Room',RoomSchema);
module.exports.Room = Room;
module.exports.RoomSchema = RoomSchema;

module.exports.getRoomByID = function(roomID, options, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	Room.findById(roomID).deepPopulate(options.population).exec(function(err,room){
		return callback(err,room);
	});
}

module.exports.getRoomByL2PID = function(l2pID, options, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	Room.findOne({'l2pID':l2pID}).deepPopulate(options.population).exec(function(err,room){
		return callback(err,room);
	});
}

module.exports.getRooms = function(options, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	Room.find({}).deepPopulate(options.population).exec(function(err,rooms){
		return callback(err,rooms);
	});
}

module.exports.createRoom = function(room, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	room.save(function(err, room){
		return callback(err, room);
	});
}

module.exports.addRoomToUser = function(userID, room, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	Room.findOrCreate({'l2pID':room.l2pID}, room.toObject(), function(err, room, created){
		if(err)
			throw new Error("room not found or cannot created");
		User.addRoomAccess(userID, [room._id], function(err, user){
			if(err)
				throw new Error("cannot update users room access");
			return callback(err, user);
		});
	});
}