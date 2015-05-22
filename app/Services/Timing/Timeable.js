
/**
 * A Timeable Object.
 */

var self;

var Timeable = function (executable, interval, timer) {
	self = this;
	this._id = -1;
	this.exec = executable;
	this.scheduled = true;
	this.timer = timer || 0;
	this.interval = interval || 5000;
	this.isInterval = true;
	this.isTimeout = false;
};

Timeable.prototype.clear = function () {
	if (self.isInterval) {
		(clearInterval(self.timer) && timer)();
	} else {
		(clearTimeout(self.timer) && timer)();
	}
	if (!timer) {
		return false;
	}
	return true;
};

Timeable.prototype.fin = function () {
	self.scheduled = true;
};

Timeable.prototype.setType = function (isTimeout) {
	if (isTimeout) {
		self.isTimeout = true;
	} else {
		self.isTimeout = false;
	}
	self.isInterval = !self.isTimeout;
};

module.exports = Timeable;
