/** @module MongoDB Test */


var Room = require('../models/Room.js');
var Question = require('../models/Question.js');
var User = require('../models/User.js');
var Answer = require('../models/Answer.js');
var Image = require('../models/Image.js');

var Quiz = require('../models/ARSModels/Quiz.js');
var QuizQuestion = require('../models/ARSModels/QuizQuestion.js');
var QuizAnswer = require('../models/ARSModels/Answer.js');
var QuizCtrl = require('../app/Services/ARS/QuizCtrl.js');


var mongoose = require('mongoose');
var async = require('async');

mongoose.connect('mongodb://localhost/yabsTest');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open',function(callback){

	mongoose.connection.db.dropDatabase(function(error) {
	    //console.log('db dropped');
	    /*var u = new User.User({name: "Jens"});
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
		});*/
		
		/*var u = new User.User({name: "Jens"});
		User.create(u, function(err, user){

			var quiz = new Quiz.Quiz({creator: u._id});
			var quizQuestion = new QuizQuestion.QuizQuestion({creator: u._id, question:"Favorite song?"});
			var quizAnswer = new QuizAnswer.QuizAnswer({creator: u._id, question: quizQuestion._id, type: QuizAnswer.Types.QA_ID, answer:"Who let's the dog out!"});
			var quizAnswer2 = new QuizAnswer.QuizAnswer({creator: u._id, question: quizQuestion._id, type: QuizAnswer.Types.QA_ID, answer:"Lollipop!"});
			var userAnswer = new QuizAnswer.QuizAnswer({creator: u._id, question: quizQuestion._id, type: QuizAnswer.Types.UA_ID, answer:quizAnswer._id});
			quiz.save(function(err){
				Quiz.addQuestion(quiz, quizQuestion, function(err, quiz){
					QuizQuestion.addQuizAnswer(quizQuestion, quizAnswer2, function(err, quizQuestion, quizAnswer2){
						QuizQuestion.addQuizAnswer(quizQuestion, quizAnswer, function(err, quizQuestion, quizAnswer){
							//QuizQuestion.markAnswerAsRight(quizQuestion, quizAnswer2, function(err, quizQuestion){
								QuizQuestion.markAnswerAsRight(quizQuestion, quizAnswer, function(err, quizQuestion){
									QuizWorker.loadQuiz(quiz, u, function(err, quiz2){
										QuizQuestion.addUserAnswer(quizQuestion, userAnswer, function(err, quizQuestion, userAnswer){
											QuizWorker.loadQuiz(quiz, u, function(err, quiz){
												if(err)
													throw err;
												console.log("\n\n\n\nQUIZ:");
												console.log(JSON.stringify(quiz,null,2));
											});
										});
									});
								});
							//});
						});
					});
				});
			});

		});*/
	

		var u = new User.User({name: "Jens"});
		var r = new Room.Room({l2pID: "L2P6", name: "DSAL"});
		User.create(u, function(userErr, user){
			r.save(function(roomErr){
				var params = {
					roomId: r._id,
					dueDate: 1,
					questions: [{
						description: "Test",
						answers: [{
							description: "A",
							radiobox: true,
							rightAnswer: true
						}]
					}]
				};

				QuizCtrl.newQuiz(params, function(err,quiz){
					var params = {};
					params.userId = user._id;
					params.answerIds = [quiz.questions[0].quizQuestion.answers[0]._id];
					params.arsId = quiz.questions[0]._id;

					QuizCtrl.answer(params, function(err, q){
						QuizCtrl.getQuiz(u._id, quiz._id, {}, function(err, quiz){
							if(err)
								throw err;
							console.log("\nquiz:");
							console.log(JSON.stringify(quiz,null,2));
						});
					});				
				});
			});
		});



	
	});
	
});

/** This function change the name of a user object.
* @param {User} user - The User object
* @param {String} name - New name of user
* @param {callbackChangeUserName} callback - callback function
*/
module.exports.changeUserName = function(user, name, callback){

}

/**
* @callback callbackChangeUserName
* @param {User} user - user with new name
*/

/**
* @callback callbackGetUserByID
* @param {User} user - user object
*/

/**
* @callback callbackSetVisibility
* @param {User} user - user object
* @param {Boolean} visibility - visibility of user
*/