var Room = require('../models/Room.js');
var Question = require('../models/Question.js');
var User = require('../models/User.js');
var Answer = require('../models/Answer.js');
var mongoose = require('mongoose');
var MainController = require('../app/MainController.js');

mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open',function(callback){
	//MainController(db);

	db.db.dropDatabase(function(error) {
	    /*console.log('db dropped');
	    var u = new User.User({name: "Jens"});
		var r = new Room.Room({l2pID: "L2P", name: "DSAL"});
		var r2 = new Room.Room({l2pID: "L2P", name: "DSAL"});
		var a = new Answer.Answer({author: u._id, content: "Answering"});
		var q = new Question.Question({author: u._id, content: "Johannes"});

		User.createUser(u, function(){
			User.getUser(u._id, function(err, res){
				console.log(JSON.stringify(res,null,2));
				db.close();
			});
		});*/
		/*MainController.createUser(u, function(){
			MainController.createRoom(r, function(e, room){
				MainController.addQuestion(room._id, q, function(e,quest){
					MainController.setQuestionContent(quest._id, "Daniel2", function(e){
						MainController.addAnswer(quest._id, a, function(e, ans){
							MainController.setAnswerContent(ans._id, "Testing Answer", function(e){
								MainController.getRooms({population:'questions.answers'}, function(err,res){
									console.log(JSON.stringify(res,null,2));
								});
							});
						});
					});
				});
			});
		});*/
		
	});
});