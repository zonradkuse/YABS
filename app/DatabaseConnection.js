var redis = require('redis');
var client = redis.createClient();
var logger = null;

exports = function(pLogger){
    this.logger = pLogger;
}

module.exports.addNewQuestion = addNewQuestion;
module.exports.addNewThread = addNewThread;
module.exports.addNewQuestion = addNewQuestion;
module.exports.addNewUser = addNewUser;

//todo more functions

client.on('error', function(err){
        throw err;
});

/** addNewThread calls a callback function with the new ThreadId

    @param {Thread} thread is the thread object. The Id will be set by redis. Then it will
        passed to your callback.
    @param {function} callback Your callback function. function(err, reply){...}.
*/

function addNewThread(thread, callback){
    if (thread === null || thread === null){
        callback(new Error("The passed thread is not initialized."), -1);
    } else {
        client.incr('system:curThreadId', function(err, reply){
            if(err) throw err;
            client.hmset('system:thread:' + reply, 'id', reply, 'time', thread.time, function(err, queryResult){
                callback(err, reply, queryResult);
            });
            
        });     
    }
    
}

/** addNewQuestion calls a callback function with the new ThreadId

    @param {Thread} thread is the thread object. The id needs to be set.
    @param {Question} question is the question object. The id will be generated
    @param {function} callback Your callback function. function(err, questionId, queryString){...}.
        queryString should be "OK".
*/

function addNewQuestion(thread, question, callback){
    if(thread.id === null || thread.id === undefined){
        callback(new Error("thread.id is not set"), -1);
    } else {
        client.incr('system:thread:' + thread.id + ':questions:curQuestionId', function(err, reply){
            if(err) throw err;
            //I smell code injection
            client.hmset("system:thread:" + thread.id + ":questions:question:" + reply, {
                "threadId" : thread.id,
                "qId" : reply,
                "qContent": question.content,
                "qTime" : question.time,
                "qAuthor": question.author,
                "qVisible" : question.visible 
                }, function(err, queryResult){
                    callback(err, reply, queryResult);
                });
        });
    }
}

function addNewUser(user, callback){

}

function addNewRoom(room){

}

function addNewAnswer(question, answer){

}

function getThreadById(id){

}
function getQuestionById(id){

}

function getUserById(id){

}

function getUserByName(name){

}

function getRoomById(id){

}

function getRoomByName(name){

}
/* TODO: Redis abstraction */