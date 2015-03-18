var Room = require('../models/Room.js');
var Question = require('../models/Question.js');
var User = require('../models/User.js');
var Answer = require('../models/Answer.js');
var mongoose = require('mongoose');
var async = require('async');

mongoose.connect('mongodb://localhost/yabs');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open',function(callback){

	/*mongoose.connection.db.dropDatabase(function(error) {
	    console.log('db dropped');
	    var u = new User.User({name: "Jens"});
		var r = new Room.Room({l2pID: "L2P", name: "DSAL"});
		var r2 = new Room.Room({l2pID: "L2P", name: "DSAL"});
		var a = new Answer.Answer({author: u._id, content: "Answering"});
		var q = new Question.Question({author: u._id, content: "Johannes"});

		async.waterfall([
			function(callback){
				User.create(u, function(err, user){callback(err, user);});
			},
			function(user, callback){
				User.addRoomToUser(user, r, function(err, user){callback(err,user)});
			},
			function(user, callback){
				User.addRoomToUser(user, r, function(err, user){callback(err,user)});
			},
			function(user, callback){
			    Room.addQuestion(r, q, function(err, room, question){callback(err, question)});
			},
			function(question, callback){
			    Question.addAnswer(question, a, function(err, que, answer){
			        callback(err);
			    });
			},
			function(callback){
				User.get(u._id, function(err, user){callback(err, user);});
			}
		], function(err, res){
			if(err)
				throw err;
			console.log(JSON.stringify(res,null,2));
		});
		
	});*/
	
	User.getAll(function(err, users){
		if(err)
			throw err;
		console.log(JSON.stringify(users,null,2));
	});

});