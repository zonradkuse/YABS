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
    content: String,
    visible: {
        type: Boolean,
        default: true
    }
});

AnswerSchema.plugin(deepPopulate);
var Answer = mongoose.model('Answer', AnswerSchema);
module.exports.Answer = Answer
module.exports.AnswerSchema = AnswerSchema;

module.exports.addAnswer = function(questionID, answer, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    answer.save(function(eAnswer){
        if(eAnswer) 
            return callback(eAnswer);
        Question.findByIdAndUpdate(questionID,{$push:{'answers': answer._id}},function(eQuestion){
            return callback(eQuestion, answer);
        });
    });
}

module.exports.setAnswerContent = function(answerID, content, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    Answer.findByIdAndUpdate(answerID,{ 'content': content, 'updateTime': Date.now() },function(eAnswer){
        return callback(eAnswer);
    });
}

module.exports.setAnswerVisibility = function(answerID, visible, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    Answer.findByIdAndUpdate(answerID,{ 'visible': visible, 'updateTime': Date.now() },function(eAnswer){
        return callback(eAnswer);
    });
}

module.exports.removeAnswer = function(answerID, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    Question.update({'answers': answerID},{$pull:{'answers': answerID}},function(eQuestion){
        if(eQuestion) 
            return callback(eQuestion);
        Answer.findByIdAndRemove(answerID,function(eAnswer){
            return callback(eAnswer);
        });
    });
}

module.exports.getAnswer = function(answerID, options, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    Answer.findById(answerID).deepPopulate(options.population).exec(function(eAnswer,answer){
        return callback(eAnswer,answer);
    });
}