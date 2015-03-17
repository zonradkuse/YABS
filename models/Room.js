/** Model of a Thread. A Thread will contain questions with a list of answers. */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var findOrCreate = require('mongoose-findorcreate');
var ObjectId = mongoose.Schema.ObjectId;
//var Question = require('../models/Question.js');

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

RoomSchema.plugin(deepPopulate);
RoomSchema.plugin(findOrCreate);
var Room = mongoose.model('Room',RoomSchema);
module.exports.Room = Room;
module.exports.RoomSchema = RoomSchema;

/*
* @param roomID ID of the target room object
* @param options used for deepPopulation
* @param callback params: error, room object
*/
module.exports.getByID = function(roomID, options, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	Room.findById(roomID).deepPopulate(options.population).exec(function(err,room){
		return callback(err,room);
	});
}

/*
* @param l2pID the l2pID of the target room object
* @param options used for deepPopulation
* @param callback params: error, room object
*/
module.exports.getByL2PID = function(l2pID, options, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	Room.findOne({'l2pID':l2pID}).deepPopulate(options.population).exec(function(err,room){
		return callback(err,room);
	});
}

/*
* @param options used for deepPopulation
* @param callback params: error, array of room objects
*/
module.exports.getAll = function(options, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	Room.find({}).deepPopulate(options.population).exec(function(err,rooms){
		return callback(err,rooms);
	});
}

/*
* @param room the room object which should be created
* @param callback params: error, room object
*/
module.exports.create = function(room, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	room.save(function(err, room){
		return callback(err, room);
	});
}

/*
* @param room the target room object
* @param question the question object which should be added
* @param callback params: error, room object, question object
*/
module.exports.addQuestion = function(room, question, callback){
	if(callback === undefined)
		throw new Error("callback not defined");
	question.save(function(err){
		if(err)
			return callback(err);
		Room.findByIdAndUpdate(room._id,{$push:{'questions': question._id}},function(err){
			return callback(err, room, question);
		});
	});
}