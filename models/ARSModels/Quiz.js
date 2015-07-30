var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var ARSQuizSchema = mongoose.Schema({
    questions: [{ type : ObjectId, ref: 'ARSQuestion'}]
});

ARSQuizSchema.plugin(deepPopulate);
var ARSQuiz = mongoose.model('ARSQuiz', ARSQuizSchema);
module.exports.ARSQuiz = ARSQuiz;
