/**
 * @file
 * @author Jens Piekenbrinck [jens.piekenbrinck@rwth-aachen.de]
 * @module Panic
 *
 * Rewrite this
 */

var roles = require('../config/UserRoles.json');
var Room = require('../models/Room.js');
var System = require('./API/System.js');
var PanicGraph = require('../models/PanicGraph.js');
var PanicEvent = require('../models/PanicEvent.js');

/**Map with roomId as key and RoomWorker as objects. */
var workerMap = [];
/**{room: roomId, user: userId} as key. Timeout function handler as objects.*/
var userMap = [];

/** Worker class which manages the processing of live data and creation of graph
 * @constructor
 * @param {ObjectId} roomID - ObjectId of the target room object
 * @param {Object} wsControl
 * @param {WebsocketServer} wss - websocket server
 * @param {Websocket} wss - websocket of initiator
 * @param {Object} options
 * @param {Object} [options.intervals]
 * @param {Number} [options.intervals.live=30] - live update 
 * @param {Number} [options.intervals.graph=60] - graph clustering
 * @param {Number} [options.intervals.panicReset=450] - user panic reset
 * @param {Object} [options.inportantQuestions]
 * @param {Number} [options.inportantQuestions.interval=900]
 * @param {Number} [options.inportantQuestions.votes=10] - minimum votes of an important question
 */
var RoomWorker = function (roomID, wsControl, wss, ws, options) {
	if (options.intervals === undefined) {
		options.intervals = {};
	}
	if (options.intervals.live === undefined) {
		options.intervals.live = 30;
	}
	if (options.intervals.graph === undefined) {
		options.intervals.graph = 60;
	}
	if (options.intervals.panicReset === undefined) {
		options.intervals.panicReset = 7* 60* 1000+ 30* 1000;
	} else {
		options.intervals.panicReset = options.intervals.panicReset* 1000;
	}
	
	if (options.importantQuestions === undefined) {
		options.importantQuestions = {};
	}
	if (options.importantQuestions.interval === undefined) {
		options.importantQuestions.interval = 90 * 60 * 1000;
	}
	if (options.importantQuestions.votes === undefined) {
		options.importantQuestions.votes = 10;
	}
    Room.Room.findOne({ _id : roomID }, function (err, room) {
        options.importantQuestions.votes = room.config.thresholdForImportantQuestion;
    });

	var self = this;

	this.wsControl = wsControl;
	this.wss = wss;
	this.ws = ws;
	this.options = options;
	this.graphDaemonTime = new Date();

	this.liveDaemon = setInterval(function () {
		PanicEvent.getAll({_id: roomID}, {population: ''}, function (err, events) {
			if (err) {
				throw err;
			}
			Room.getByID(roomID, {population: 'questions'}, function (err, room) {
				if (err) {
					throw err;
				}
				var important = 0;
				var date = new Date().getTime()- options.importantQuestions.interval;
				for (var i= 0; i<room.questions.length; i++) {
					if (room.questions[ i ].creationTime.getTime() > date && room.questions[ i ].votes.length > options.importantQuestions.votes) {
						important++;
					}
				}

				wss.getActiveUsersByRoom(roomID, function (err, count) {
					var data = { panics: events.length };
					data.activeUsers = !err ? count : 0;
					data.importantQuestions = important;
					wss.roomAccessLevelBroadcast(ws, 'room:livePanic', data, roomID, {
						requiredAccess: roles.defaultMod, roomMember: true
					});
				});
			});
		});
	}, options.intervals.live* 1000);


	this.graphDaemon = setInterval(function () {
		var endTime = new Date(self.graphDaemonTime.getTime()+ options.intervals.graph* 1000);
		clusterEvents({_id: roomID}, {population: '', end: endTime}, function (err) {
			if (err) {
				throw err;
			}
			self.graphDaemonTime = endTime;
		});
	}, options.intervals.graph* 1000);
};

RoomWorker.prototype.stop = function () {
	clearInterval(this.liveDaemon);
	clearInterval(this.graphDaemon);
};

/** Register room for tracking live panics.
 * @param {Room} room - room the room object to be registered
 * @param {wsControl} wsControl
 * @param {WebsocketServer} wss - websocket server
 * @param {Websocket} ws - websocket of initiator
 * @param {Object} options - options for RoomWorker class
 * @param {errorCallback} callback - callback function
 */
module.exports.register = function (room, wsControl, wss, ws, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (workerMap[ room._id ] !== undefined) {
		return callback(new Error("Room already registered")); 
	}
	workerMap[ room._id ] = new RoomWorker(room._id, wsControl, wss, ws, options);
	PanicGraph.PanicGraph.find({room: room._id}).remove(function (err) {
		if (err) {
			return callback(err);
		}
		clusterEvents(room, {population: ''}, function (err) {
			if (err) {
				throw err;
			}
			return callback(null);
		});
	});
};

/** Unregister room from panic tracking.
 * @param {Room} room - room object to be unregistered
 * @param {errorCallback} callback - callback function
 */
module.exports.unregister = function (room, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (workerMap[ room._id ] === undefined) {
		return callback(new Error("Room not registered"));
	}
	workerMap[ room._id ].stop();
	delete workerMap[ room._id ];
	PanicEvent.remove(room, function (err) {
		if (err) {
			return callback(err);
		}
		return callback(null);
	});
};

/** Cluster the live events and store them in the graph.
 * @param {Room} room - room object of the target graph
 * @param {Object} options - options used for interval [begin, end]
 * @param {errorCallback} callback - callback function
 */
var clusterEvents = function (room, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	var search = {room: room._id};
	if (options.begin !== undefined && options.end !== undefined) {
		search.time = {$gte: options.begin, $lte: options.end};
	} else if (options.begin !== undefined) {
		search.time = {$gte: options.begin};
	} else if (options.end !== undefined) {
		search.time = {$lte: options.end};
	}
	PanicEvent.PanicEvent.find(search).exec(function (err, panicEvents) {
		if (err) {
			return callback(err);
		}
		var data = {time: (options.end !== undefined) ? options.end : new Date(),
		panics: panicEvents.length};
		PanicGraph.PanicGraph.update({room: room._id}, {$push: {'data': data}},
            {upsert: true}, function (err, graph) {
	if (err) {
		return callback(err);
	}
	return callback(null);
        });        
	});
};

/** Check if user has panic.
 * @param {User} user - user object which should be checked
 * @param {Room} room - target room object
 * @param {panicEventCallback} callback - callback function
 */
module.exports.hasUserPanic = function (user, room, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	PanicEvent.PanicEvent.findOne({user: user._id, room: room._id}).exec(function (err, panicEvent) {
		if (err) {
			return callback(err, null);
		}
		return callback(null, panicEvent);
	});
};

/** Check if room is registered.
 * @param {Room} room - room object which should be registered
 * @param {boolCallback} callback - callback function
 */
module.exports.isRoomRegistered = function (room, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (workerMap[ room._id ] !== undefined) {
		return callback(true);
	} else {
		return callback(false);
	}
};

/** Set user to panic mode.
 * @param {User} user - user object which has panic
 * @param {Room} room - room object of the panic event
 * @param {errorCallback} callback - callback function
 */
module.exports.panic = function (user, room, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (workerMap[ room._id ] === undefined) {
		return callback(new Error("Room not registered"));
	}
	module.exports.hasUserPanic(user, room, function (err, panicEvent) {
		if (err) {
			return callback(err);
		}
		if (panicEvent) {
			return callback(new Error("User has already panic"));
		}
		var p = new PanicEvent.PanicEvent({room: room._id, user: user._id});
		p.save(function (err, panicEvent) {
			if (err) {
				return callback(err);
			}
			userMap[{room: room._id, user: user._id}] = createUserTimeout(room, user);
			return callback(null);
		});
	});
};

/** User leaves panic mode. 
 * @param {User} user - user object which has no panic anymore
 * @param {Room} room - room object of the panic event
 * @param {errorCallback} callback - callback function
 */
module.exports.unpanic = function (user, room, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	if (workerMap[ room._id ] === undefined) {
		return callback(new Error("Room not registered"));
	}
	PanicEvent.PanicEvent.find({room: room._id, user: user._id}).remove(function (err, count) {
		if (err) {
			return callback(err);
		}
		if (count === 0) {
			return callback(new Error("User has already no panic"));
		}
		var userTimeout = userMap[{room: room._id, user: user._id}];
		if (userTimeout !== undefined) {
			clearTimeout(userTimeout);
			delete userMap[{room: room._id, user: user._id}];
		}
		return callback(null);
	});
};

/** Creates the timeout when user should automatically leave the panic mode. 
 * @param {Room} room - room object
 * @param {User} user - user object
 */
function createUserTimeout(room, user) {
	return setTimeout(function () {
		var roomWorker = workerMap[ room._id ];
		if (roomWorker === undefined) {
			return;
		}
		PanicEvent.PanicEvent.find({room: room._id, user: user._id}).remove(function (err, count) {
			if (err || count === 0) {
				return;
			}
			var userWorkerMap = System.getWorkerMap();
			for (var key in userWorkerMap) {
				if (userWorkerMap[ key ].user && userWorkerMap[ key ].user._id == user._id) {
					roomWorker.wsControl.build(userWorkerMap[ key ].ws, null, null, null, "room:panicStatus", {isEnabled: true, hasUserPanic: false});
				}
			}
		});
	}, workerMap[ room._id ].options.intervals.panicReset);
}

/**
 * @callback errorCallback
 * @param {Error} err - if an error occurs
 */

/**
 * @callback panicEventCallback
 * @param {Error} err - if an error occurs
 * @param {PanicEvent} panicEvent - panic event object
 */

/**
 * @callback boolCallback
 * @param {Error} err - if an error occurs
 * @param {Boolean} bool - true on success
 */
 