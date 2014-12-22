var redis = require('redis');
exports.addNewQuestion = addNewQuestion;
//todo more functions

function initClient(){
    var client = redis.createClient();
    client.on('error', function(err){
        //do some fancy error handling
    });
    return client;
}
function addNewThread(thread){
    var client = initclient();
    client.hset('system:thread', 'id', thread.id);
    client.close();
}

function addNewQuestion(thread, question){
    var client = initClient();
    client.hmset('system:question', 'threadId', thread.id, 'qId', question.qid, 'qContent', q.content);
    client.close();
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