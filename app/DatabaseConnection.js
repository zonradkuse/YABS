var redis = require('redis');
var client = redis.createClient();
var logger = null;

exports = function(pLogger){
    this.logger = pLogger;
}

module.exports.addNewQuestion = addNewQuestion;
module.exports.addNewThread = addNewThread;
//todo more functions

client.on('error', function(err){
        //do some fancy error handling
});

function addNewThread(thread){
    client.hmset('system:thread', 'id', thread.id, 'time', thread.time, function(err, result){
        if(err) throw err;
        console.log(result);
    });
}

function addNewQuestion(thread, question){
    client.hmset('system:question', 'threadId', thread.id, 'qId', question.qid, 'qContent', q.content);
}

function addNewUser(user){

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