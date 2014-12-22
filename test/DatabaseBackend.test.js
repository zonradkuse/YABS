var assert = require('assert');
var db = ''

describe('The Redis Databasebackend Testsuite', function(){
   describe('Method Tests', function(){
      it('should be of Type DatabaseConnection', function(){
         assert(typeof db, 'DatabaseConnection');
      });
      it('should have a addNewThread Method', function(){
         assert(typeof db.addNewThread, 'function');
      });
   });
});