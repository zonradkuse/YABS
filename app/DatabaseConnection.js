/**
Controller for the Database. Redis is in use.
- Room -> Thread -> [Questions] -> [Answers]
- User

Query URI:
system:rooms:{curRoomId}
system:rooms:room:{roomId}
system:rooms:room:{roomId}:threads:{curThreadId}
system:rooms:room:{roomId}:threads:thread:{threadId}
system:rooms:room:{roomId}:threads:thread:{threadId}:questions:curQuestionId
system:rooms:room:{roomId}:threads:thread:{threadId}:questions:question:{questionId}
system:rooms:room:{roomId}:threads:thread:{threadId}:questions:question:{questionId}:answers:curAnswerId
system:rooms:room:{roomId}:threads:thread:{threadId}:questions:question:{questionId}:answers:answer:{answerId}
system:relation:map:answer:{uniqueId} [{qId}, {tId}, {rId}]
system:relation:map:question:{uniqueId} [{tId}, {rId}]
system:relation:map:thread:{uniqueId} rId - as this thread belongs to rId
system:users:curUserId
system:users:user:{id}
*/


var redis = require('redis');
var client = redis.createClient();
var logger = null;

exports = function(pLogger){
    this.logger = pLogger;
}

module.exports.addNewQuestion = addNewQuestion;
module.exports.addNewThread = addNewThread;
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

function addNewThread(room, thread, callback){
    if (thread === null || thread === null){
        throw new Error("The passed thread is not initialized.");
    } else {
        client.incr('system:rooms:room:' + room.id + ':threads:curThreadId', function(err, reply){
            if(err) throw err;
            var uniqueId = "t:" + room.id + ":" + reply;
            client.hmset('system:rooms:room:' + room.id + ':threads:thread:' + reply,{
                'uniqueId' : uniqueId,
                'id': reply,
                'time': thread.time
            }, function(err, queryResult){
                callback(err, uniqueId, queryResult);
            });
            
        });     
    }
    
}

/** addNewQuestion calls a callback function with the new QuestionId

    @param {Room} room is the room object associated to the thread.
    @param {Thread} thread is the thread object. The id needs to be set.
    @param {Question} question is the question object. The id will be generated
    @param {function} callback Your callback function. function(err, questionId, queryString){...}.
        queryString should be "OK".

    @return returns the uniqueId as a String.
*/

function addNewQuestion(room, thread, question, callback){
    if(thread.id === null || thread.id === undefined){
        throw new Error("thread.id is not set");
    } else {
        client.incr('system:rooms:room:' + room.id + ':threads:thread:' + thread.id + ':questions:curQuestionId', function(err, reply){
            if(err) throw err;
            var uniqueId = "q:" +room.id + ":" + thread.id + ":" + reply;
            client.hmset('system:rooms:room:' + room.id + ':threads:thread:' + thread.id + ":questions:question:" + reply, {
                "uniqueId" : uniqueId,
                "threadId" : thread.id,
                "qId" : reply,
                "qContent": question.content,
                "qTime" : question.time,
                "qAuthor": question.author,
                "qVisible" : question.visible 
                }, function(err, queryResult){
                    callback(err, uniqueId, queryResult);
                });
        });
    }
}

/** addNewUser calls a callback function with the new QuestionId

    @param {User} user is the thread object. The callback takes to new id
    @param {function} callback Your callback function. function(err, userId, queryString){...}.
        queryString should be "OK".
*/

function addNewUser(user, callback){
    if(user === undefined || user === null){
        throw new Error("the user cannot be undefined or null");    
    } else {
        client.incr('system:users:curUserId', function(err, userId){
            var uniqueId = "u:" + userId;
            client.hmset('system:users:user:' + userId, {
                "uniqueId" : uniqueId,
                "uId" : userId,
                "l2pApi" : user.l2pAPIKey,
                "uName" : user.name
            }, function(err, res){
                callback(err, uniqueId, res);
            });
        });
    }
}

/** addNewRoom calls a callback function with the new roomId

    @param {User} user is the thread object. The callback takes to new id
    @param {number} threadId is the threadId which is associated to the room.
    @param {function} callback Your callback function. function(err, userId, queryString){...}.
        queryString should be "OK".

*/
function addNewRoom(room, callback){
    if(room === undefined || room === null){
        callback(new Error("the room cannot be undefined or null"));    
    } else {
        client.incr('system:rooms:curRoomId', function(err, roomId){
            var uniqueId = "r:" + roomId;
            client.hmset('system:rooms:' + roomId, {
                "uniqueId" : uniqueId, 
                "rId" : userId,
                "rName" : room.name
            }, function(err, res){
                callback(err, roomId, res);
            });
        });
    }
}


function addNewAnswer(room, thread, question, answer, callback){
    if(thread.id === null || thread.id === undefined){
        throw new Error("thread.id is not set");
    } else {
        client.incr('system:rooms:room:' + room.id + ':threads:thread:' + thread.id + ':questions:curQuestionId', function(err, reply){
            if(err) throw err;
            var uniqueId = "a:" +room.id + ":" + thread.id + ":" + question.id + ":" + reply;
            client.hmset('system:rooms:room:' + room.id + ':threads:thread:' + thread.id + ":questions:question:" + reply, {
                "uniqueId" : uniqueId,
                "qId" : question.id,
                "aContent": answer.content,
                "aTime" : answer.time,
                "aAuthor": answer.author
                }, function(err, queryResult){
                    callback(err, uniqueId, queryResult);
                });
        });
    }
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