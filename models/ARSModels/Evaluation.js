var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

// this is only needed for having invisible answers without doing any nasty preparation stuff.
var EvaluationSchema = mongoose.Schema({
	answers: {
		type: ObjectId
	}
});

EvaluationSchema.plugin(deepPopulate);
var Evaluation = mongoose.model('Evaluation', EvaluationSchema);
module.exports.Evaluation = Evaluation;