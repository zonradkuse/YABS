var util = require('util');
var events = require('events');
var TimeableObj = require('./Timeable.js');

var timeables = {};
var stack = [];
var timerCount = 0;
var self;
/**
 * Timing Service Event Emitter
 */

var scheduler = function () {
	events.EventEmitter.call(this);
	self = this;
	
	// "event loop" for registering new timing events.
	setInterval(function () {
		iterations = 0;
		while (stack !== [] && iterations < 10) {
			self.schedule();
			iterations++;
		}
	}, 1000);
};
// inheritance here. not below as is overwrties prototypes
util.inherits(scheduler, events.EventEmitter);

scheduler.prototype.schedule = function () {
	var element = stack.pop();
	var int;
	if (element && element.isInterval) {
		int = setInterval(function () {
			if (element.scheduled) {
				element.scheduled = false;
				element.exec();
				self.emit(element._id, element);
			}
		}, element.interval);
		element.timer = int;
		timeables[ element._id ] = element; 
	} else if (element && element.isTimeout) {
		int = setTimeout(function () {
			element.exec();
			self.emit(element._id, element);
			delete timeables[ element._id ];
		}, element.interval);
		element.timer = int;
		timeables[ element._id ] = element;
	}
};

scheduler.prototype.addInterval = function (executable, interval) {
	var _timeable = new TimeableObj(executable, interval);
	_timeable._id = timerCount++;
	stack.push(_timeable);
	return _timeable._id;
};

scheduler.prototype.addTimeout = function (executable, timeout) {
	var _timeable = new TimeableObj(executable, timeout);
	_timeable.setType(true);
	_timeable._id = timerCount++;
	stack.push(_timeable);
	return _timeable._id;
};


module.exports = scheduler;
