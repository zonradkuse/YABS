/** @module StatisticObj Model*/
var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

// this is only needed for having invisible answers without doing any nasty preparation stuff.
var StatisticObjSchema = mongoose.Schema({
	answer: { type: ObjectId, ref: 'ARSAnswer' },
	count: { type: Number }
});

StatisticObjSchema.plugin(deepPopulate);
var StatisticObj = mongoose.model('StatisticObj', StatisticObjSchema);
module.exports.StatisticObj = StatisticObj;
