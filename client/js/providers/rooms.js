/** @module Angular-Service rooms*/

client.service("rooms", ["rpc", "$rootScope", '$q', function(rpc, $rootScope, $q){
	var rooms = [];
	var self = this;

	/** Get the array of rooms.
 	* @returns {Room[]} - array of room objects
 	*/
	this.toArray = function() {
		return rooms;
	};

	/** Check if user has access to room.
	* @param {Room} room - room object to check
 	* @returns {Boolean} - true if user has access, false otherwise
 	*/
	this.hasUserAccess = function(room) {
		var deferred = $q.defer();
		rpc.call("room:exists", {roomId: room._id}, function(result) {
			deferred.resolve(result.exists === true);
		});	
		return deferred.promise;
	};

	/** Upsert room object.
 	* @param {Room} room - room object to check
 	*/
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

	/** Get room by id.
	* @param {ObjectId} id - object id of target room object
 	* @returns {Room} - room object to check
	*/
	this.getById = function(id) {
		for(var i = 0; i < rooms.length; i++) {
			if (rooms[i]._id === id) {
				return rooms[i];
			}
		}
	};

	/** Enter a room.
	* @param {Room} room - target room object
	*/
	this.enter = function(room) {
		rpc.call("system:enterRoom", {roomId: room._id}, function(result) {
			if (result.status === false) {
				console.log("Could not enter room with id: " + room._id);
			}
		});
	};

	/** Add question to room, optional with images.
	* @param {Room} room - target room object
	* @param {Question} question - asked question
	* @param {Image[]} images - array of image objects
 	*/
	this.addQuestion = function(room, question, images) {
		var imageIds = [];
		for (var i = 0; i < images.length; i++) {
			imageIds.push(images[i]._id);
		}
		rpc.call("user:ask", {roomId: room._id, question: question, images: imageIds}, function(data) {
			console.log(data);
		});
	};

	/** Add answer to question, optional with images.
	* @param {Room} room - target room object
	* @param {Question} question - target question object
	* @param {Answer} answer - given answer
	* @param {Image[]} images - array of image objects
 	*/
	this.addAnswer = function(room, question, answer, images) {
		var imageIds = [];
		for (var i = 0; i < images.length; i++) {
			imageIds.push(images[i]._id);
		}
		rpc.call("user:answer", {roomId: room._id, questionId: question._id, answer: answer, images: imageIds}, function(data) {
			console.log(data);
		});
	};

	/** Upsert a question.
	* @param {ObjectId} roomId - object id of room of question
	* @param {Question} question - question object to upsert
	*/
	this.upsertQuestion = function(roomId, question) {
		var room = this.getById(roomId);
		var questions = room.questions;

		for(var i = 0; i < questions.length; i++) {
			/*jshint loopfunc: true */
			if (questions[i]._id === question._id) {
				$rootScope.$apply(function() {
					questions[i].votes = question.votes;
                    questions[i].visible = question.visible;
                    questions[i].content = question.content;
                    questions[i].elapsedSince = question.elapsedSince;
                    questions[i].updateTime = question.updateTime;
                    questions[i].hasVote = question.hasVote;
				});
				return;
			}
		}
		$rootScope.$apply(function (){
			questions.push(question);
		});
	};

    /**
     * This adds a new poll to the rooms polls or alters it.
     * @param roomId
     * @param poll
     */
    this.upsertPoll = function (roomId, poll) {
        var room = this.getById(roomId);
        var polls = room.poll;

        for (var i = 0; i < polls.length; i++) {
            /* jshint loopfunc: true */
            if (polls[i]._id === poll._id) {
                $rootScope.$apply(function() {
                    polls[i] = poll;
                });
            }
            return;
        }
        $rootScope.$apply(function () {
            polls.push(poll);
        });
    };

	/** Get a question by id.
	* @param {Room} room - room object of question
	* @param {ObjectId} questionId - object id of target question
	*/
	this.getQuestionById = function(room, questionId) {
		for(var i = 0; i < room.questions.length; i++) {
			if (room.questions[i]._id === questionId) {
				return room.questions[i];
			}
		}
		return null;
	};

	/** Upsert an answer.
	* @param {ObjectId} roomId - object id of room of question
	* @param {ObjectId} questionId - question of target answer
	* @param {Answer} answer - answer object to upsert
	*/
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

	/** Enable listeners for room:add, question:add and answer:add.*/
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
        rpc.attachFunction("poll:do", function(data) {
            $("#pollStudentModal").modal('show');
        });
        rpc.attachFunction("poll:statistic", function(data) {
           // coming soon
        });
    };

    /** Get all questions of a room.
	* @param {Room} room - room object of questions
	*/
    this.getQuestions = function(room) {
    	rpc.call("room:getQuestions", {roomId: room._id}, function(data) {});
    };

    this.answerPoll = function(room, poll, answers, cb) {
        var ids = [];
        for (var i = 0; i < answers.length; i++) {
            ids.push(answers[i]._id);
        }
        rpc.call("poll:answer", {
            roomId : room._id,
            arsId : poll._id,
            answerId : ids
        }, function (data) {
            cb(data);
        });
    };

    this.getNextPoll = function(room, cb) {
        if (room) {
            rpc.call("poll:getNext", {
                roomId : room._id
            }, function (data) {
                cb(data);
            });
        }
    };

    this.createPoll = function(room, poll, cb) {
        rpc.call("poll:create", {
            roomId : room._id,
            answers : poll.answers,
            dueDate : poll.duration,
            description : poll.description
        }, function(data){
            cb(data);
        });
    };

    /** Vote for a question.
	* @param {Room} room - room object of questions
	* @param {Question} question - voted question object
	*/
    this.voteQuestion = function(room, question) {
    	rpc.call("user:vote", {roomId: room._id, questionId: question._id}, function(data) {});
    };

    /** User has panic.
	* @param {Room} room - room object of panic event
	*/
    this.panic = function(room) {
    	rpc.call("user:panic", {roomId: room._id}, function(data) {});
    };

    /** User has no panic anymore.
	* @param {Room} room - room object of panic event
	*/
    this.unpanic = function(room) {
    	rpc.call("user:unpanic", {roomId: room._id}, function(data) {});
    };

	/** Enable panic events of room.
	* @param {Room} room - room object which should be enabled
	*/
    this.enablePanicEvents = function(room) {
    	rpc.call("room:enablePanicEvents", {roomId: room._id, intervals: {live: 5}}, function(data) {});
    };

    /** Disable panic events of room.
	* @param {Room} room - room object which should be disabled
	*/
    this.disablePanicEvents = function(room) {
    	rpc.call("room:disablePanicEvents", {roomId: room._id}, function(data) {});
    };

    /** Mark answer as right answer.
	* @param {Room} room - room object
	* @param {Question} question - question object
	* @param {Answer} answer - answer object which should be marked as right
	*/
    this.markAsAnswer = function(room, question, answer) {
    	rpc.call("mod:markAsAnswer", {roomId: room._id, questionId: question._id, answerId: answer._id}, function(data) {});
    };    

    /** Get access level of user for a specific room.
	* @param {Room} room - target room object
	*/
    this.getAccessLevel = function(room) {
    	var deferred = $q.defer();
		rpc.call("user:getAccessLevel", {roomId: room._id}, function(result) {
			deferred.resolve(result.accessLevel);
		});	
		return deferred.promise;
    };

    /** Get panic graph data.
	* @param {Room} room - room object of panic graph
	*/
    this.getPanicGraph = function(room) {
  		var deferred = $q.defer();
		rpc.call("room:getPanicGraph", {roomId: room._id}, function(result) {
			deferred.resolve(result);
		});	
		return deferred.promise;  	
    };

    /** Delete question from room.
	* @param {Room} room - room object
	* @param {Question} question - question object which should be deleted
	*/
    this.deleteQuestion = function(room, question) {
    	rpc.call("mod:deleteQuestion", {roomId: room._id , questionId: question._id}, function(data){});
    };

    /** Delete answer of specific question.
	* @param {Room} room - room object
	* @param {Question} question - question object
	* @param {Answer} answer - answer object which should be deleted
	*/
    this.deleteAnswer = function(room, question, answer) {
    	rpc.call("mod:deleteAnswer", {roomId: room._id , questionId: question._id, answerId: answer._id}, function(data){});
    };

}]);