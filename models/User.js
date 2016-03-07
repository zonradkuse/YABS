/** @module Models/User */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;
var Room = require('../models/Room.js');
var Question = require('../models/Question.js');
var Answer = require('../models/Answer.js');

var UserSchema = mongoose.Schema({
	active: {
		type: Boolean,
		default: false,
        select: false
	},
	avatar: { type: ObjectId, ref: 'Image' },
	name: String,
	local: {
		name: String,
		password: String, // this and the next line are only needed for local register/login
		mail: String,
        select : false
	},
	rwth: {
		token: String,
		refresh_token: String,
		expires_in: Number,
        userId : String,
        select : false
	},
	creationTime: {
		type: Date,
		default: Date.now,
        select: false
	},
	rights: [{
        roomId: String,
	    accessLevel: Number
    }],
	access: [{
		type: ObjectId,
		ref: 'Room'
	}],
	facebook: {
		id : String,
		token: String,
		name: String,
		username: String,
        select : false
	},
	google: {
		id: String,
		token: String,
		email: String,
		name: String,
        select : false
	},
	github: {
		id: String,
		token: String,
		email: String,
		name: String,
        select : false
	},
	twitter: {
		id: String,
		token: String,
		displayName: String,
		username: String,
        select : false
	},
	external : {
		type : Boolean,
		default : false
	}
});

UserSchema.plugin(deepPopulate);
/**
 * @class
 * @alias module:Models.User
 * @classdesc This is a moongose schema for an user.
 * @property {Boolean} active=false - needed for local registration in future to check if email has been verified.
 * @property {ObjectId} avatar - image refId
 * @property {String} name - user's name as it is visible for the system
 * @property {Object} local - local user data
 * @property {String} local.name - user name
 * @property {String} local.password - only needed for local register/login
 * @property {String} local.mail - only needed for local register/login
 * @property {Object} rwth - local user data
 * @property {String} rwth.token - RWTH access token
 * @property {String} rwth.refresh_token - RWTH refresh token
 * @property {Number} rwth.expires_in - time in which the RWTH refresh token will be expire
 * @property {Date} creationTime=Date.now - creation time
 * @property {Object[]} rights - rights of the rooms
 * @property {ObjectId} rights.roomID - ObjectId of room
 * @property {Number} rights.rights - user's rights
 * @property {ObjectId[]} access - ObjectIds of rooms in which the user is
 * @property {Object} facebook - user's facebook account data
 * @property {String} facebook.id
 * @property {String} facebook.token
 * @property {String} facebook.name
 * @property {String} facebook.username
 * @property {Object} google - user's google account data
 * @property {String} google.id
 * @property {String} google.token
 * @property {String} google.email
 * @property {String} google.name
 * @property {Object} github - user's github account data
 * @property {String} github.id
 * @property {String} github.token
 * @property {String} github.email
 * @property {String} github.name
 * @property {Object} twitter - user's twitter account data
 * @property {String} twitter.id
 * @property {String} twitter.token
 * @property {String} twitter.displayName
 * @property {String} twitter.username
 * @example
 * new User({});
 */
var User = mongoose.model('User', UserSchema);
module.exports.User = User;
module.exports.UserSchema = UserSchema;


/** Create an user. The user is stored in the database.
 * @param {User} user - user object which should be saved
 * @param {userCallback} callback - callback function
 */
module.exports.create = function (user, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	user.save(function (err, user) {
		return callback(err, user);
	});
};

/** Get user by ObjectID.
 * @param {ObjectId} userID - ObjectId of user
 * @param {userCallback} callback - callback function
 */
module.exports.get = function (userID, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	User.findById(userID, function (err, user) {
		return callback(err, user);
	});
};

/** Get all users.
 * @param {usersCallback} callback - callback function
 */
module.exports.getAll = function (callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	User.find({}, function (err, users) {
		return callback(err, users);
	});
};

/** User get access to a room.
 * @param {User} user - user object
 * @param {ObjectId} roomID - ObjectId of room which should add to the user
 * @param {userCallback} callback - callback function
 */
module.exports.addRoomAccess = function (user, roomID, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	User.findOneAndUpdate({'_id': user._id, 'access': {$nin: [ roomID ]}}, {$pushAll: {'access': [ roomID ]}}, function (err, user) {
		return callback(err, user);
	});
};

/** Get user's room access.
 * @param {User} user - user object
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {userAccessCallback} callback - callback function
 */
module.exports.getRoomAccess = function (user, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (options.population === undefined) {
		options.population = "";
	}
	User.findById(user._id).deepPopulate('access access.'+ options.population).exec(function (err, user) {
		return callback(err, user.access);
	});
};

/** Add a room to a user. The user get access to this room. If the room does not exists, it will be created.
 * @param {User} user - user object
 * @param {Room} room - room object
 * @param {userRoomCallback} callback - callback function
 */
module.exports.addRoomToUser = function (user, room, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Room.Room.findOrCreate({'l2pID': room.l2pID}, room.toObject(), function (err, room, created) {
		if (err) {
			throw new Error("room not found and cannot be created");
		}
		module.exports.addRoomAccess(user, room._id, function (err, user) {
			if (err) {
				throw new Error("cannot update users room access");
			}
			room.deepPopulate('quiz.questions poll', function (err, _room) {
				return callback(err, user, _room);
			});
		});
	});
};

/** Check if user have access to room.
 * @param {User} user - user object
 * @param {Room} room - room object
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {userRoomCallback} callback - callback function
 */
module.exports.hasAccessToRoom = function (user, room, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (options.population === undefined) {
		options.population = "";
	}

	module.exports.getRoomAccess(user, {population: ''}, function (err, rooms) {
		if (err) {
			return callback(new Error("Cannot check user's room access."), null, null);
		}
		var _cb = function (err, room) {
			if (err) {
				return callback(new Error("Room not found."), null, null);
			}
			return callback(null, user, room);
		};
		for (var i= 0; i<rooms.length; i++) {
			if (rooms[ i ]._id == room._id) {
				Room.getByID(room._id, {population: options.population}, _cb);
				return;
			}
		}
		return callback(new Error("Access denied."), null, null);
	});
};

/** Check if user have access to question.
 * @param {User} user - user object
 * @param {Room} room - room object
 * @param {Question} question - question object
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {userQuestionCallback} callback - callback function
 */
module.exports.hasAccessToQuestion = function (user, room, question, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (options.population === undefined) {
		options.population = "";
	}
	module.exports.hasAccessToRoom(user, room, {population: ''}, function (err, user, room) {
		if (err) {
			return callback(err, null, null);
		}
		var _cb = function (err, question) {
			if (err) {
				return callback(new Error("Question not found."), null, null);
			}
			return callback(null, user, question);
		};
		for (var i= 0; i<room.questions.length; i++) {
			if (room.questions[ i ] == question._id) {
				Question.getByID(question._id, {population: options.population}, _cb);
				return;
			}
		}
		return callback(new Error("Access denied."), null, null);
	});
};

/** Check if user have access to answer.
 * @param {User} user - user object
 * @param {Room} room - room object
 * @param {Question} question - question object
 * @param {Answer} answer - answer object
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {userAnswerCallback} callback - callback function
 */
module.exports.hasAccessToAnswer = function (user, room, question, answer, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (options.population === undefined) {
		options.population = "";
	}
	module.exports.hasAccessToQuestion(user, room, question, {population: ''}, function (err, user, question) {
		if (err) {
			return callback(err, null, null);
		}
		var _cb = function (err, answer) {
			if (err) {
				return callback(new Error("Answer not found."), null, null);
			}
			return callback(null, user, answer);
		};
		for (var i= 0; i<question.answers.length; i++) {
			if (question.answers[ i ] == answer._id) {
				Answer.getByID(answer._id, {population: options.population}, _cb);
				return;
			}
		}
		return callback(new Error("Access denied."), null, null);
	});
};

/**
 * @callback userCallback
 * @param {Error} err - if an error occurs
 * @param {User} user - updated user object
 */

/**
 * @callback usersCallback
 * @param {Error} err - if an error occurs
 * @param {User[]} users - array of updated user objects
 */

/**
 * @callback userRoomCallback
 * @param {Error} err - if an error occurs
 * @param {User} user - updated user object
 * @param {Room} room - updated room object
 */

/**
 * @callback userQuestionCallback
 * @param {Error} err - if an error occurs
 * @param {User} user - updated user object
 * @param {Question} question - updated question object
 */

 /**
 * @callback userAnswerCallback
 * @param {Error} err - if an error occurs
 * @param {User} user - updated user object
 * @param {Answer} answer - updated answer object
 */
