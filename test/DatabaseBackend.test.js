var assert = require('assert');
var db = require('../app/DatabaseConnection.js');
var Thread = require('../models/Thread.js');
var Question = require('../models/Thread.js');

describe('The Redis Databasebackend Testsuite: ', function(){
   describe('Method Tests', function(){
      it('should be of Type DatabaseConnection', function(){
         assert.equal(typeof db, 'object');
      });
      it('should have a addNewThread Method', function(){
         assert.equal(typeof db.addNewThread, 'function');
      });
   });
   it('addNewThread should write some thread to Redis', function(){
      db.addNewThread(new Thread(), function(err, reply){
         assert.equal(typeof reply, 'number');
      });
   });
   it('addNewQuestion should write a question to redis',function(){
      var t = new Thread();
      var q = new Question(0, "me", "some content");
      t.id = 1;
      db.addNewQuestion(t, q, function(err, result, res){
         assert.equal(typeof result, 'number');
         assert.equal(res, "OK");
      });
   })
});

describe('The model Tests', function(){

});