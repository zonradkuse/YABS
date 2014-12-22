var assert = require('assert');
var db = require('../app/DatabaseConnection.js');
var Thread = require('../models/Thread.js');

describe('The Redis Databasebackend Testsuite', function(){
   describe('Method Tests', function(){
      it('should be of Type DatabaseConnection', function(){
         assert.equal(typeof db, 'object');
      });
      it('should have a addNewThread Method', function(){
         assert.equal(typeof db.addNewThread, 'function');
      });
   });
   it('addNewThread should write some users to Redis', function(){
      assert.equal(db.addNewThread(new Thread()))
   });
});

describe('The model Tests', function(){

});