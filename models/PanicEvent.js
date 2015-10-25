/**
 * @file
 * @author Jens Piekenbrinck [jens.piekenbrinck@rwth-aachen.de]
 * @module Models/PanicEvent
 */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var PanicEventSchema = mongoose.Schema({
	user: { type: ObjectId, ref: 'User' },
	room: { type: ObjectId, ref: 'Room' },
	time: { type: Date, default: Date.now }
});

PanicEventSchema.plugin(deepPopulate);
/**
 * @class
 * @classdesc This is a moongose schema for panic event.
 * @property {ObjectId} user - user refId
 * @property {ObjectId} room - room refId
 * @property {Date} time=Date.now - time when event occured
 * @example
 * new PanicEvent({user: ObjectId{User}, room: ObjectId{Room}});
 */
var PanicEvent = mongoose.model('PanicEvent', PanicEventSchema);
module.exports.PanicEvent = PanicEvent;

/** Get all panic events.
 * @param {Room} room - room object
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {eventsCallback} callback - callback function
 */
module.exports.getAll = function (room, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	PanicEvent.find({room: room._id}).deepPopulate(options.population).exec(function (err, events) {
		if (err) {
			return callback(err, null);
		}
		return callback(null, events);
	});
};

/** Remove all panic events from room.
 * @param {Room} room - room object
 * @param {errorCallback} callback - callback function
 */
module.exports.remove = function (room, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	PanicEvent.find({room: room._id}).remove(function (err) {
		if (err) {
			return callback(err);
		}
		return callback(null);
	});
};

/**
 * @callback eventsCallback
 * @param {Error} err - if an error occurs
 * @param {PanicEvent[]} events - array of updated panic event objects
 */

/**
 * @callback errorCallback
 * @param {Error} err - if an error occurs
 */

