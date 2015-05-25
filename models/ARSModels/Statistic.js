var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

// this is only needed for having invisible answers without doing any nasty preparation stuff.
var ARSStatisticSchema = mongoose.Schema({
	// set of statistical Objects. This is referenced by a quiz or a poll
	statisticAnswer: [{ type: ObjectId, ref: 'ARSStatisticObj' }]
});

ARSStatisticSchema.plugin(deepPopulate);
var ARSStatistic = mongoose.model('ARSStatistic', ARSStatisticSchema);

var applyNewAnswer = function (statAnswerId) {
	ARSStatistic.findById( {_id : statAnswerId}).deepPopulate( ,function (err, res) {

	});
};



module.exports.ARSStatistic = ARSStatistic;
