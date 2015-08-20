clientControllers.directive('arsCreator', ['$timeout', 'rooms', function($timeout, rooms){
	return {
		restrict: 'E',
		templateUrl: 'ars_creator.html',
		controller: 'arsMaster',
		link: {
			pre: function(scope, elem, attr){
				//define default data for initialization and define options
				scope.optionQuiz = "Umfragebeschreibung";
                scope.sending = false;
				scope.id = 0;
				/*scope.items = [{
					_id: scope.id,
					type: "checkbox",
					answer: "wundertoll...",
					active: false
				}];*/
				/*scope.questions = [{
					_id: scope.id,
					question: "",
					type: "quiz",
					answers: [{
						_id: ++scope.id,
						type: "checkbox",
						answer: "wundertoll...",
						active: false
					}]
				}];*/
				scope.questions = [{
					_id: scope.id,
					question: "",
					answers: []
				}];
				scope.editQuestionItem = scope.questions[0];
				scope.editAnswerItem = scope.questions[0].answers[0];
				scope.answerType = "";
				scope.type = "poll";
				scope.dropdownSelection = "Frage 1"; 

				scope.setSelection = function(selection) {
			  		scope.dropdownSelection = selection;
				};

				scope.reset = function () {
					scope.optionQuiz = "Umfragebeschreibung";
					scope.qsInputText = "";
					//scope.editQuestionItem = "";
					//scope.editAnswerItem = "";
					scope.answerType = "";
					scope.type = "poll";
					scope.questions = [{
						_id: scope.id,
						question: "",
						answers: []
					}];
					scope.editQuestionItem = scope.questions[0];
					scope.editAnswerItem = scope.questions[0].answers[0];
					scope.dropdownSelection = "Frage 1";
                    scope.qsRuntime = "";
                    scope.sending = false;
				};

				scope.addCheckbox = function() {
					scope.answerType = "checkbox";
					scope.addAnswer();
				};

				scope.addRadiobox = function() {
					scope.answerType = "radiobox";
					scope.addAnswer();
				};

				scope.addTextfield = function() {
					scope.answerType = "text";
					scope.addAnswer();
				};

				scope.addAnswer = function() {
					/*var item = {
						_id: scope.id++,
						active: false,
						answer: "",
						type: scope.answerType
					};
					scope.items.push(item);
					scope.editAnswer(item);*/
					var a = {
						_id: ++scope.id,
						active: false,
						answer: "",
						type: scope.answerType
					};
					scope.editQuestionItem.answers.push(a);
					scope.editAnswer(a);
				};

				/*scope.editAnswer = function(item) {
					scope.editItem = item;
				};

				scope.delete = function(item){
					scope.items.splice(scope.items.indexOf(item), 1 );
					scope.editItem = undefined;
				};*/

				scope.editAnswer = function(arsAnswer) {
					scope.editAnswerItem = arsAnswer;
				};

				scope.deleteAnswer = function(arsQuestion, arsAnswer){
					//$scope.items.splice($scope.items.indexOf(answer), 1 );
					arsQuestion.splice(arsQuestion.answers.indexOf(arsAnswer), 1);
					scope.editAnswerItem = undefined;
				};

				scope.addQuestion = function(){
					var q = {
						question: "",
						answers: []
					};
					scope.questions.push(q);
					scope.editQuestion(q);
					scope.dropdownSelection = "Frage "+(scope.questions.indexOf(q)+1);
				};

				scope.editQuestion = function(arsQuestion){
					scope.editQuestionItem = arsQuestion;
					if(arsQuestion.answers.length > 0){
						scope.editAnswer(arsQuestion.answers[0]);
					} else {
						scope.editAnswerItem = undefined;
					}
				};

                scope.sendPoll = function () {
                    var q = scope.questions[0];
                    var obj = {};
                    obj.description = q.question;
                    obj.answers = [];
                    for (var i = 0; i < q.answers.length; i++) {
                        var ans = {};
                        switch (q.answers[i].type) { // this is needed as the first html-angular layout differs slightly from the server implementation
                            case "checkbox":
                                ans.checkbox = true;
                                break;
                            case "radiobox":
                                ans.radiobox = true;
                                break;
                            case "text":
                                ans.text = true;
                                break;
                            default:
                                ans.checkbox = true;
                                break;
                        }
                        ans.description = q.answers[i].answer;
                        obj.answers.push(ans);
                    }
                    obj.duration = parseInt(scope.qsRuntime);
                    scope.sending = true;
                    rooms.createPoll(scope.room, obj, function(resp) {
                        if(resp && resp.status) {
                            scope.$apply(function () {
                                scope.sending = false;
                                scope.reset();
                            });
                            $('#quizMasterModal').modal('hide');
                        } else {
                            scope.sending = false;
                        }
                    });
                };

                scope.sendQuiz = function () {
                    var obj = {};
                    obj.questions = [];
                    for(var j = 0; j < scope.questions.length; j++){
	                    var question = {};
	                    var q = scope.questions[j];
	                    question.description = q.question;
                    	question.answers = [];
	                    for (var i = 0; i < q.answers.length; i++) {
	                        var ans = {};
	                        switch (q.answers[i].type) { // this is needed as the first html-angular layout differs slightly from the server implementation
	                            case "checkbox":
	                                ans.checkbox = true;
	                                break;
	                            case "radiobox":
	                                ans.radiobox = true;
	                                break;
	                            case "text":
	                                ans.text = true;
	                                break;
	                            default:
	                                ans.checkbox = true;
	                                break;
	                        }
	                        ans.description = q.answers[i].answer;
	                        ans.rightAnswer = q.answers[i].rightAnswer;
	                        question.answers.push(ans);
	                    }
	                    obj.questions.push(question);
                	}
                    obj.duration = parseInt(scope.qsRuntime);
                    scope.sending = true;
                    rooms.createQuiz(scope.room, obj, function(resp) {
                        if(resp && resp.status) {
                            scope.$apply(function () {
                                scope.sending = false;
                                scope.reset();
                            });
                            $('#quizMasterModal').modal('hide');
                        } else {
                            scope.sending = false;
                        }
                    });
                };
			},
			post: function(scope, elem, attr){
				$('#quizMasterModal').modal({
					keyboard: false,
					backdrop: 'static',
					show : false
				});
                $('#quizMasterModal').off().on("show.bs.modal", function () {
                    scope.$apply(function () {
                        scope.reset();
                    });
                });
			}
		}
	};
}]);