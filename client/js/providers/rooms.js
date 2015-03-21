client.service("rooms", ["rpc", "$rootScope", function(rpc, $rootScope){
	var rooms = [];
	var self = this;

	this.toArray = function() {
		return rooms;
	};

	this.upsertRoom = function(room) {
		for(var i = 0; i < rooms.length; i++) {
			/*jshint loopfunc: true */
			if (rooms[i]._id === room._id) {
				$rootScope.$apply(function (){
					rooms[i] = room;
				});
				return;
			}
		}
		$rootScope.$apply(function (){
			rooms.push(room);
		});
	};

	this.getById = function(id) {
		for(var i = 0; i < rooms.length; i++) {
			if (rooms[i]._id === id) {
				return rooms[i];
			}
		}
	};

	this.enter = function(room) {
		rpc.call("system:enterRoom", {roomId: room._id}, function(result) {
			if (result.status === false) {
				console.log("Could not enter room with id: " + room._id);
			}
		});
	};

	this.addQuestion = function(room, question) {
		rpc.call("user:ask", {roomId: room._id, question: question}, function(data) {
			console.log(data);
		});
	};

	this.addAnswer = function(room, question, answer) {
		rpc.call("user:answer", {roomId: room._id, questionId: question._id, answer: answer}, function(data) {
			console.log(data);
		});
	};

	this.upsertQuestion = function(roomId, question) {
		var room = this.getById(roomId);
		var questions = room.questions;

		for(var i = 0; i < questions.length; i++) {
			/*jshint loopfunc: true */
			if (questions[i]._id === question._id) {
				$rootScope.$apply(function() {
					questions[i] = question;
				});
				return;
			}
		}
		$rootScope.$apply(function (){
			questions.push(question);
		});
	};

	this.getQuestionById = function(room, questionId) {
		for(var i = 0; i < room.questions.length; i++) {
			if (room.questions[i]._id === questionId) {
				return room.questions[i];
			}
		}
		return null;
	};

	this.upsertAnswer = function(roomId, questionId, answer) {
		var room = this.getById(roomId);
		var question = this.getQuestionById(room, questionId);

		for(var i = 0; i < question.answers.length; i++) {
			/*jshint loopfunc: true */
			if (question.answers[i]._id === answer._id) {
				$rootScope.$apply(function() {
					question.answers[i] = answer;
				});
				return;
			}
		}
		$rootScope.$apply(function (){
			question.answers.push(answer);
		});

	};

	this.enableListeners = function() {
		rpc.attachFunction("room:add", function(data) {
			self.upsertRoom(data.room);
		});
		rpc.attachFunction("question:add", function(data) {
			self.upsertQuestion(data.roomId, data.question);
		});
		rpc.attachFunction("answer:add", function(data) {
			self.upsertAnswer(data.roomId, data.questionId, data.answer);
		});		
    };

    this.getQuestions = function(room) {
    	rpc.call("room:getQuestions", {roomId: room._id}, function(data) {});
    };

}]);