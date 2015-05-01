var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

//answers = answers of the question, like A,B,C,D
//rightAnswers = right answers of question, maybe input field
//userAnswers = the answers of all users

var QuizQuestionSchema = mongoose.Schema({
	creator: { type : ObjectId, ref: 'User' },
    creationTime: { type: Date, default: Date.now },
    question: String,
    answers: [{ type: ObjectId , ref: 'QuizAnswer'}],
    rightAnswers: [{ type: ObjectId, ref: 'QuizAnswer' }],
    userAnswers: [{ type: ObjectId, ref: 'QuizAnswer' }],
    visible: { type: Boolean, default: true }
});

QuizQuestionSchema.plugin(deepPopulate);
var QuizQuestion = mongoose.model('QuizQuestion', QuizQuestionSchema);
module.exports.QuizQuestion = QuizQuestion;

module.exports.getByID = function(questionID, options, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    if(options.population === undefined)
		options.population = "";
    QuizQuestion.findById(questionID).deepPopulate(options.population).exec(function(err, question){
        return callback(err, question);
    });
}

module.exports.addQuizAnswer = function(question, answer, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    answer.save(function(err){
        if(err)
            return callback(err);
        QuizQuestion.findByIdAndUpdate(question._id,{$push:{'answers': answer._id}},function(err, question){
            return callback(err, question, answer);
        });
    });
}

module.exports.markAnswerAsRight = function(question, answer, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    QuizQuestion.findByIdAndUpdate(question._id,{$push:{'rightAnswers': answer._id}},function(err, question){
        return callback(err, question);
    });
}

module.exports.addUserAnswer = function(question, answer, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    if(answer.type === undefined || answer.type < 10)
    	throw new Error("answer.type not correct, it must be greater than 10");
    answer.save(function(err){
        if(err)
            return callback(err);
        QuizQuestion.findByIdAndUpdate(question._id,{$push:{'userAnswers': answer._id}},function(err, question){
            return callback(err, question, answer);
        });
    });
}