/**
 * @class
 * @alias module:Misc/Scheduler.Timeable
 * @param executable
 * @param interval
 * @param timer
 * @constructor
 */
var Timeable = function (executable, interval, timer) {
	this._id = -1;
	this.exec = executable || noop;
	this.scheduled = true;
	this.timer = timer || 0;
	this.interval = interval || 5000;
	this.isInterval = true;
	this.isTimeout = false;
	this.immutableType = false;
};

Timeable.prototype.clear = clear;
Timeable.prototype.fin = fin;
Timeable.prototype.setType = setType;

/**
 * @memberof module:Misc/Scheduler.Timeable.prototype
 * @returns {boolean} - iff successful.
 */
function clear() {
	var self = this;
	if (self.isInterval) {
		clearInterval(self.timer);
	} else {
		(clearTimeout(self.timer) && self.timer)();
	}
	if (!self.timer) {
		return false;
	}
	return true;
}

/**
 * @memberof module:Misc/Scheduler.Timeable.prototype
 */
function fin() {
	this.scheduled = true;
}

/**
 * @memberof module:Misc/Scheduler.Timeable.prototype
 * @param isTimeout
 *
 * Sets the type of this Timable Element. Might be set only once.
 */
function setType(isTimeout) {
	if (!this.immutableType) {
		if (isTimeout) {
			this.isTimeout = true;
		} else {
			this.isTimeout = false;
		}
		this.isInterval = !this.isTimeout;
	}
	this.immutableType = true;
}

var noop = function () {};

module.exports = Timeable;
