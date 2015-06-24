var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var ARSAnswerSchema = mongoose.Schema({
	creator: { type : ObjectId, ref: 'User' },
    timestamp: { type : Date, default: Date.now },
    visible: { type : Boolean, default: true },
    description : String, 
    // boolean to have it "clean" without building some kind of struct that needs to be handled. easily expandable
    checkbox: { type : Boolean }, 
    radiobox: { type : Boolean },
    text: { type : Boolean },
    checked : Boolean, // for real answers, made by users
    userText: String // this will be ugly. we should have used some sql
});

ARSAnswerSchema.plugin(deepPopulate);
var ARSAnswer = mongoose.model('ARSAnswer', ARSAnswerSchema);
module.exports.ARSAnswer = ARSAnswer;
