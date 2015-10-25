/** @module Models/ARSQuiz */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var ARSQuizSchema = mongoose.Schema({
    description: "",
    active: { type: Boolean, default: false },
    questions: [{ type : ObjectId, ref: 'ARSQuestion'}]
});

ARSQuizSchema.plugin(deepPopulate);
var ARSQuiz = mongoose.model('ARSQuiz', ARSQuizSchema);
module.exports.ARSQuiz = ARSQuiz;
