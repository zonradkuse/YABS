/** @model Angular-Directive-studentQuiz */

clientControllers.directive('studentQuiz', ['rooms', function (rooms) {
	return {
		restrict: 'E',
		templateUrl: 'quiz_student.html',
		controller: 'studentQuizController',
		link: {
            pre: function ($scope, elemt, attrs) {
                $scope.quizSending = false;
                $scope.quizQuestionSelection = 0;

                /*$scope.getAll = function(cb){
                    rooms.getAllQuizzes($scope.room, function(data){
                        console.log(JSON.stringify(data,null,2));
                        if(data && data.quizzes && data.quizzes.length > 0) {
                            $scope.quiz = data.quizzes[0];
                            console.log(JSON.stringify(quiz,null,2));
                        }
                        if(cb){
                            cb(true);
                        }
                    });
                };*/

                /*$scope.getNext = function (cb) {
                    rooms.getNextPoll($scope.room, function(data) {
                        if (data && data.arsObj && data.arsObj.poll) {
                            for (var i = 0; i < data.arsObj.poll.answers.length; i++) {
                                data.arsObj.poll.answers[i].checked = false;
                            }
                            $scope.$apply(function () {
                                $scope.quiz = data.arsObj;
                                $scope.sending = false;
                            });
                            if (cb) cb(true);
                        } else {
                            $scope.$apply(function () {
                                //$scope.reset();
                            });
                            if (cb) cb(false);
                        }
                    });
                };*/

                $scope.resetQuiz = function () {
                    $scope.quizSending = false;
                    //$scope.questions = [];
                };

                $scope.sendQuiz = function () {
                    $scope.quizSending = true;
                    var chkQuestions = [];

                    for (var i = 0; i < $scope.quiz.questions.length; i++) {
                        var question = $scope.quiz.questions[i];
                        var chkAnswers = [];
                        for (var j = 0; j < question.quizQuestion.answers.length; j++) {
                            var answer = question.quizQuestion.answers[j];
                            if (answer.radiobox) {
                                if (question.quizQuestion.radioChecked && chkAnswers.indexOf(question.quizQuestion.radioChecked) < 0) {
                                    chkAnswers.push(question.quizQuestion.radioChecked);
                                }
                            } else {
                                if (answer.checked && answer.checked !== false) {
                                    chkAnswers.push(answer._id);
                                }
                            }
                        }
                        chkQuestions.push({question: question._id, answers: chkAnswers});

                    }
                    //console.log(JSON.stringify(chkQuestions,null,2));
                    rooms.answerQuiz($scope.room, $scope.quiz, chkQuestions, function (data) {
                        //$scope.getNext(function (bool) {
                            //if (!bool) {
                                $('#quizStudentModal').modal('hide');
                                $scope.$apply(function () {
                                    $scope.resetQuiz();
                                });
                            //}
                        //});
                    });
                    /*setTimeout(function(){
                        setTimeout(function(){
                            $('#quizStudentModal').modal('hide');
                            $scope.$apply(function(){
                                $scope.resetQuiz();
                            });
                        },100);
                    },1500);*/
                };
            },
            post : function ($scope, element, attrs) {
                $('#quizStudentModal').modal({
                    keyboard: false,
                    backdrop: 'static',
                    show: false
                });

                /*$("#quizStudentModal").off().on("shown.bs.modal", function() {
                    $scope.$apply(function() {
                        $scope.sending = true;
                        $scope.getAll(function (bool) {
                            if (!bool) {
                                $("#pollStudentModal").modal('hide');
                            } else {
                                $scope.sending = false;
                            }
                        });
                    });
                });*/
            }
        }
	};
}]);