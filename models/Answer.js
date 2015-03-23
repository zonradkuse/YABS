/*! Model of Answer
 * @param {Number} author The user identifier.
 * @param {Number} qid The question identifier.
 * @param {Timestamp} time Timestamp of creation
 * @param {String} content The content of this question
 */

var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;
var Question = require('../models/Question.js').Question;

var AnswerSchema = mongoose.Schema({
    author: {
        type: ObjectId,
        ref: 'User'
    },
    creationTime: {
        type: Date,
        default: Date.now
    },
    updateTime: {
        type: Date,
        default: Date.now
    },
    isAnswer: {
        type: Boolean,
        default: false
    },
    content: String,
    images: [{ type: ObjectId, ref:'Image' }],
    visible: {
        type: Boolean,
        default: true
    }
});

AnswerSchema.plugin(deepPopulate);
var Answer = mongoose.model('Answer', AnswerSchema);
module.exports.Answer = Answer;
module.exports.AnswerSchema = AnswerSchema;

/*
* @param answer the target answer object
* @param content the new content of the answer
* @param callback params: error, answer object
*/
module.exports.setContent = function(answer, content, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    Answer.findByIdAndUpdate(answer._id,{ 'content': content, 'updateTime': Date.now() },function(err, answer){
        return callback(err, answer);
    });
}

/*
* @param answer the target answer object
* @param bool the new bool of the answer
* @param callback params: error, answer object
*/
module.exports.setContent = function(answer, bool, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    Answer.findByIdAndUpdate(answer._id,{ 'isAnswer': bool, 'updateTime': Date.now() },function(err, answer){
        return callback(err, answer);
    });
}

/*
* @param answer the target answer object
* @param visible set true for visible, false otherwise
* @param callback params: error, answer object
*/
module.exports.setVisibility = function(answer, visible, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    Answer.findByIdAndUpdate(answer._id,{ 'visible': visible, 'updateTime': Date.now() },function(err, answer){
        return callback(err, answer);
    });
}

/*
* @param answer the target answer object which should be removed
* @param callback params: error
*/
module.exports.remove = function(answer, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    Question.update({'answers': answer._id},{$pull:{'answers': answer._id}},function(err){
        if(err)
            return callback(err);
        Answer.findByIdAndRemove(answer._id,function(err){
            return callback(err);
        });
    });
}

/*
* @param answerID the ID of the target answer object
* @param options used for deepPopulation
* @param callback params: error, answer object
*/
module.exports.getByID = function(answerID, options, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    Answer.findById(answerID).deepPopulate(options.population).exec(function(err,answer){
        return callback(err,answer);
    });
}