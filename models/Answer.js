/*! Model of Answer 
* @param {Number} author The user identifier.
* @param {Number} qid The question identifier.
* @param {Timestamp} time Timestamp of creation
* @param {String} content The content of this question
*/

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var AnswerSchema = mongoose.Schema({
    author: { type : ObjectId, ref: 'User' },
    creationTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now },
    content: String,
    visible: { type: Boolean, default: true }
});

AnswerSchema.plugin(deepPopulate);
module.exports.Answer = mongoose.model('Answer',AnswerSchema);
module.exports.AnswerSchema = AnswerSchema;

