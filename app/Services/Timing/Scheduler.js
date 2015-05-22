var util = require('util');
var events = require('events');
var TimeableObj = require('./Timeable.js');

/**
 * Timing Service Event Emitter
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

scheduler.prototype.schedule = function () {
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
};

scheduler.prototype.addInterval = function (executable, interval) {
	var self = this;
	var _timeable = {};
	TimeableObj.bind(_timeable);
	_timeable = new TimeableObj(executable, interval);
	_timeable.setType(false);
	_timeable._id = this.timerCount++;
	self.stack.push(_timeable);
	return _timeable._id;
};

scheduler.prototype.addTimeout = function (executable, timeout) {
	var self = this;
	var _timeable = {};
	TimeableObj.bind(_timeable);
	_timeable = new TimeableObj(executable, timeout);
	_timeable.setType(true);
	_timeable._id = this.timerCount++;
	self.stack.push(_timeable);
	return _timeable._id;
};

scheduler.prototype.clearTimer = function (id) {
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
};


module.exports = scheduler;
