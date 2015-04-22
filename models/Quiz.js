var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var QuizSchema = mongoose.Schema({
	creator: { type : ObjectId, ref: 'User' },
    creationTime: { type: Date, default: Date.now },
    questions: { type: ObjectId , ref: 'QuizQuestion'},
    visible: { type: Boolean, default: true }
});

QuizSchema.plugin(deepPopulate);
var Quiz = mongoose.model('Quiz', QuizSchema);
module.exports.Quiz = Quiz;