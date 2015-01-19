// TODO REPLACE LOGS WITH ASSERTIONS FOR REAL TESTING

var assert = require('assert');
var Question = require('../models/Question.js').Question;
var Answer = require('../models/Answer.js').Answer;
var Room = require('../models/Room.js');
var mongoose = require('mongoose');

describe('The Thread Testsuite: ', function(){
	it('create Question',function(){
        var q = new Question({author: "Jens", time: new Date(), content: "Johannes",
        	visible: false	
    	});
    	console.log("Question: "+JSON.stringify(q));
    });
    it('create Answer',function(){
        var a = new Answer({author: "Jens", time: new Date(), content: "Johannes",
        	visible: false	
    	});
    	console.log("Answer: "+JSON.stringify(a));
    });
    it('add Answer to Question',function(){
        var q = new Question({author: "Jens", time: new Date(), content: "Johannes",
        	visible: false	
    	});
        var a = new Answer({author: "Jens", time: new Date(), content: "Johannes",
        	visible: false	
    	});
    	var a2 = new Answer({author: "Johannes", time: new Date(), content: "Daniel",
        	visible: true	
    	});
    	q.addAnswer(a);
    	q.addAnswer(a2);
    	console.log("Index of Answer a2: "+q.indexOfAnswer(a2.id));
    	console.log("Question: "+JSON.stringify(q));
    });
});

describe('The Room Testsuite: ', function(){
    it('create Room',function(){
        var r = new Room({name: "Jens", time: new Date(), visible: true});
        var q = new Question({author: "Jens", time: new Date(), content: "Johannes",
        	visible: false	
    	});
    	r.addQuestion(q);
    	console.log("Room: "+JSON.stringify(r));
    });
});