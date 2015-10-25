/**
 * @file
 * @author Jens Piekenbrinck [jens.piekenbrinck@rwth-aachen.de]
 * @module Models/PanicGraph
 */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var PanicGraphSchema = mongoose.Schema({
	room: { type: ObjectId, ref: 'Room' },
	data: [{ time: { type: Date, default: Date.now }, 
	panics: { type: Number } }]
});

PanicGraphSchema.plugin(deepPopulate);
/**
 * @class
 * @classdesc This is a moongose schema for a panic graph.
 * @property {ObjectId} room - room refId
 * @property {Object[]} data - array of events
 * @property {Date} data.time=Date.now - time
 * @property {Number} data.panics - amount of events at time
 * @example
 * var graph = new PanicGraph({room: ObjectId{Room}});
 * graph.save();
 */
var PanicGraph = mongoose.model('PanicGraph', PanicGraphSchema);
module.exports.PanicGraph = PanicGraph;

/** Get image object by ObjectId.
 * @param {Room} room - room object
 * @param {Object} options - options
 * @param {String} [options.population=""] - param for deepPopulate plugin
 * @param {graphCallback} callback - callback function
 */
module.exports.getGraph = function (room, options, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	PanicGraph.findOne({room: room._id}).deepPopulate(options.population).exec(function (err, graph) {
		if (err) {
			return callback(err, null);
		}
		return callback(null, graph);
	});
};

/**
 * @callback graphCallback
 * @param {Error} err - if an error occurs
 * @param {PanicGraph} graph - updated graph object
 */
