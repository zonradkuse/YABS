
/**
 * A Timeable Object.
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

Timeable.prototype.clear = function () {
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
};

Timeable.prototype.fin = function () {
	this.scheduled = true;
};

Timeable.prototype.setType = function (isTimeout) {
	if (!this.immutableType) {
		if (isTimeout) {
			this.isTimeout = true;
		} else {
			this.isTimeout = false;
		}
		this.isInterval = !this.isTimeout;
	}
	this.immutableType = true;
};

var noop = function () {};

module.exports = Timeable;
