var assert = require('assert');
var db = require('../app/DatabaseConnection.js');
var Thread = require('../models/Thread.js');
var Question = require('../models/Thread.js');
var User = require('../models/User.js');
var Room = require('../models/Room.js');

describe('The Redis Databasebackend Testsuite: ', function(){
    describe('Method Tests', function(){
        it('should be of Type DatabaseConnection', function(){
           assert.equal(typeof db, 'object');
        });
        it('should have a addNewThread Method', function(){
           assert.equal(typeof db.addNewThread, 'function');
        });
        it('addNewThread should write some thread to Redis', function(){
            db.addNewThread(new Room("1", "name"), new Thread(), function(err, reply){
                assert.equal(typeof reply, 'number');
            });
        });
        it('addNewQuestion should write a question to redis',function(){
            var t = new Thread();
            var q = new Question(0, "me", "some content");
            t.id = 1;
            db.addNewQuestion(new Room(), t, q, function(err, result, res){
                assert.equal(typeof result, 'number');
                assert.equal(res, "OK");
            });
        });
        it('addNewUser should write a user to redis', function(){ 
            var u = new User('Johannes', '[]', 0, "a538d7a5ff");
            db.addNewUser(u, function(err, userId, queryString){
                assert.equal(typeof userId, 'number');
                assert.equal(queryString, "OK");
            });
        });


    });
});

describe('The model Tests', function(){

});