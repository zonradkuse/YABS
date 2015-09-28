/** @module Room-Model */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var findOrCreate = require('mongoose-findorcreate');
var ObjectId = mongoose.Schema.ObjectId;

var RoomSchema = mongoose.Schema({
	l2pID: { type: String, unique: true },
	name: {type: String, default: 'Unbekannter Lernraum'},
	creationTime: { type: Date, default: Date.now },
	updateTime: { type: Date, default: Date.now },
	questions: [{ type: ObjectId, ref: 'Question' }],
	visible: { type: Boolean, default: true },
	description: String,
	url: String,
	status: String,
	semester: String,
	hasPoll : Boolean,
	hasQuiz : Boolean,
	poll : [{ type: ObjectId, ref: 'ARSQuestion' }],
	quiz : [{ type: ObjectId, ref: 'ARSQuiz' }]
});

RoomSchema.plugin(deepPopulate);
RoomSchema.plugin(findOrCreate);
/**
 * @class
 * @classdesc This is a moongose schema for a room.
 * @property {String} l2pID - unique identifier of the l2p-system
 * @property {String} name - name (or title)
 * @property {Date} creationTime=Date.now - creation time
 * @property {Date} updateTime=Date.now - the time when the last change has been performed
 * @property {ObjectId[]} questions - question refId
 * @property {Boolean} visible=true - visibility
 * @property {String} description - a short description
 * @property {String} url - external link to the l2p-system room site
 * @property {String} status - status
 * @property {String} semester - in which semester the room is
 * @example
 * new Room({l2pID: "", name: "", description: "", url: "", status: "", semester: ""});
 */
var Room = mongoose.model('Room', RoomSchema);
module.exports.Room = Room;
module.exports.RoomSchema = RoomSchema;

/** Get room by the ObjectId.
 * @param {ObjectId} roomID - ObjectId of the room
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {roomCallback} callback - callback function
 */
module.exports.getByID = function (roomID, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (options.population === undefined) {
		options.population = "";
	}
	Room.findById(roomID).deepPopulate(options.population).exec(function (err, room) {
		return callback(err, room);
	});
};

/** Get room by the l2p identifier.
 * @param {String} l2pID - l2pID of the room
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {roomCallback} callback - callback function
 */
module.exports.getByL2PID = function (l2pID, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (options.population === undefined) {
		options.population = "";
	}
	Room.findOne({ 'l2pID': l2pID }).deepPopulate(options.population).exec(function (err, room) {
		return callback(err, room);
	});
};

/** Get all rooms
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {roomsCallback} callback - callback function
 */
module.exports.getAll = function (options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (options.population === undefined) {
		options.population = "";
	}
	Room.find({}).deepPopulate(options.population).exec(function (err, rooms) {
		return callback(err, rooms);
	});
};

/** Create a room. The room is stored in the database.
 * @param {Room} room - room object which should be saved
 * @param {roomCallback} callback - callback function
 */
module.exports.create = function (room, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	room.save(function (err, room) {
		return callback(err, room);
	});
};

/** Add a question from a user to the room object.
 * @param {Room} room - target room object
 * @param {Question} question - question object which should be added
 * @param {roomQuestionCallback} callback - callback function
 */
module.exports.addQuestion = function (room, question, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	question.save(function (err) {
		if (err) {
			return callback(err);
		}
		Room.findByIdAndUpdate(room._id, { $push: { 'questions': question._id } }, function (err) {
			return callback(err, room, question);
		});
	});
};

/**
 * @callback roomCallback
 * @param {Error} err - if an error occurs
 * @param {Room} room - updated room object
 */

/**
 * @callback roomsCallback
 * @param {Error} err - if an error occurs
 * @param {Room[]} rooms - array of updated room objects
 */

 /**
 * @callback roomQuestionCallback
 * @param {Error} err - if an error occurs
 * @param {Room} room - updated room object
 * @param {Question} question - updated question object
 */
