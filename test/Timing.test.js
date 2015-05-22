var assert = require('assert');
var scheduler = new require('../app/Services/Timing/Scheduler.js');
scheduler = new scheduler();

describe('Timing', function () {
	it('should have functions', function() {
		assert.equal(typeof(scheduler.addInterval), 'function');
		assert.equal(typeof(scheduler.addTimeout), 'function');
	});
	it('should fire interval events', function(done) {
		var _id1 = scheduler.addInterval(noop, 500);
		scheduler.on(_id1, function (element) {
			done();
		});
	});
	it('should fire timeout events', function(done) {
		var _id1 = scheduler.addTimeout(noop, 500);
		scheduler.on(_id1, function (element) {
			done();
		});
	});
	it('should not fire unfinished events twice', function (done) {
		var _id1 = scheduler.addInterval(noop, 100);
		var lock = false;
		scheduler.on(_id1, function (element) {			
			if (!lock) {
				lock = true;
				setTimeout(function() {
					done();
				}, 1000)
			} else {
				assert.equal(0, 1);
			}
		});
	});
	it('should not fire unfinished events twice but refire when finished', function (done) {
		var _id1 = scheduler.addInterval(noop, 100);
		var fired = false;
		scheduler.on(_id1, function (element) {			
			fired = !fired;
			setTimeout(function() {
				element.fin();
			}, 1000);
			if (!fired) {
				done();
			}
		});
	});
	it('IDs should be correctly processed', function (done) {
		var _id1 = scheduler.addInterval(noop, 500);
		var _id2 = scheduler.addInterval(noop, 500);
		var _id3 = scheduler.addInterval(noop, 500);
		var f1, f2, f3 = 0;
		scheduler.on(_id1, function(element) {
			assert.equal(_id1, element._id);
			f1 = true;
			if (f2 && f3) {
				done();
			}
		});
		scheduler.on(_id2, function(element) {
			assert.equal(_id2, element._id);
			f2 = true;
			if (f1 && f3) {
				done();
			}
		});
		scheduler.on(_id3, function(element) {
			assert.equal(_id3, element._id);
			f3 = true;
			if (f1 && f2) {
				done();
			}
		});
	});
}); 

var noop = function(){};