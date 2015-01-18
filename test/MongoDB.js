var Room = require('../models/Room.js').Room;
var Question = require('../models/Question.js').Question;
var User = require('../models/User.js').User;
var Answer = require('../models/Answer.js').Answer;
var mongoose = require('mongoose');
var MainController = require('../app/MainController.js');

mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open',function(callback){
MainController(db);

mongoose.connection.db.dropDatabase(function(error) {
    console.log('db dropped');
    var u = new User({name: "Jens"});
	var r = new Room({l2pID: "L2P", name: "DSAL"});
	var r2 = new Room({l2pID: "L2P", name: "DSAL"});
	var a = new Answer({author: u._id, content: "Answering"});
	var q = new Question({author: u._id, content: "Johannes"});

	MainController.createUser(u, function(){
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
	});
	
});

});