/** @module Misc/Scheduler */

var util = require('util');
var events = require('events');
var TimeableObj = require('./Timeable.js');

/**
 * Timing Service Event Emitter - Inherits from default node EventEmitter
 * @class
 * @alias module:Misc/Scheduler.scheduler
 * @param {Object} config - You can set autoFin (boolean - reschedule automatically) and registerLoopElements
 *                          (number - maximum iterations when calling scheduled objects)
 */
var scheduler = function (config) {
	events.EventEmitter.call(this);

	this.timerCount = 0;
	this.timeables = {};
	this.stack = [];

	var self = this;
	var defaultConfig = {
		autoFin : true,
		registerLoopElements: 10
	}; 

	self.config = config || defaultConfig;
	if (config) {
		self.config = {
			autoFin : config.autoFin,
			registerLoopElements : config.registerLoopElements || defaultConfig.registerLoopElements
		};
	}
	// "event loop" for registering new timing events.
	setInterval(function () {
		var iterations = 0;
		while (self.stack !== [] && iterations < self.config.registerLoopElements) {
			self.schedule();
			iterations++;
		}
	}, 1000);
};
// inheritance here. not below as is overwrties prototypes
util.inherits(scheduler, events.EventEmitter);

scheduler.prototype.schedule = schedule;
scheduler.prototype.addInterval = addInterval;
scheduler.prototype.addTimeout = addTimeout;
scheduler.prototype.clearTimer = clearTimer;

/**
 * Internal function taking care of the timeable events. Compareable to anuglar digest cycle.
 * Every time a timeable is run, an event will be emitted on the created scheduler object. The event to listen on
 * is called like the timeable id that has been returned to you on interval/timeout creation.
 * @memberof module:Misc/Scheduler.scheduler.prototype
 */
function schedule() {
	var self = this;
	var element = self.stack.pop();
	var int;
	if (element && element.isInterval) {
		int = setInterval(function () {
			if (element.scheduled) {
				element.scheduled = false;
				element.exec();
				self.emit(element._id, element);
				if (self.config.autoFin) {
					element.fin();
				}
			}
		}, element.interval);
		element.timer = int;
		self.timeables[ element._id ] = element; 
	} else if (element && element.isTimeout) {
		int = setTimeout(function () {
			element.exec();
			self.emit(element._id, element);
			delete self.timeables[ element._id ];
		}, element.interval);
		element.timer = int;
		self.timeables[ element._id ] = element;
	}
}

/**
 * @memberof module:Misc/Scheduler.scheduler.prototype
 * @param {function} executable - function to be called when interval occurs
 * @param {number} interval - time in ms
 * @returns {number} - the id of the timeable object
 */
function addInterval(executable, interval) {
	var self = this;
	var _timeable = {};
	TimeableObj.bind(_timeable);
	_timeable = new TimeableObj(executable, interval);
	_timeable.setType(false);
	_timeable._id = this.timerCount++;
	self.stack.push(_timeable);
	return _timeable._id;
}

/**
 * @memberof module:Misc/Scheduler.scheduler.prototype
 * @param {function} executable - function to be called when timeout occurs
 * @param {number} timeout - time in ms
 * @returns {number} - the id of the timeable object
 */
function addTimeout(executable, timeout) {
	var self = this;
	var _timeable = {};
	TimeableObj.bind(_timeable);
	_timeable = new TimeableObj(executable, timeout);
	_timeable.setType(true);
	_timeable._id = this.timerCount++;
	self.stack.push(_timeable);
	return _timeable._id;
}

/**
 * @memberof module:Misc/Scheduler.scheduler.prototype
 * @param {number} id - id of the timeable object. It has been returned on adding an interval or timeout
 * @returns {boolean}
 */
function clearTimer(id) {
	var self = this;
	
	if (self.timeables[ id ]) {
		if (self.timeables[ id ].clear()) {
			delete self.timeables[ id ];
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
}

module.exports = scheduler;
