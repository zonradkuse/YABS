var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var ARSQuizSchema = mongoose.Schema({
<<<<<<< HEAD
	description: "",
	active: { type: Boolean, default: false },
=======
>>>>>>> 1d64e0a85b77aa763f2e92f7a1a0a6e6785dbb99
    questions: [{ type : ObjectId, ref: 'ARSQuestion'}]
});

ARSQuizSchema.plugin(deepPopulate);
var ARSQuiz = mongoose.model('ARSQuiz', ARSQuizSchema);
module.exports.ARSQuiz = ARSQuiz;
