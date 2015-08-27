clientControllers.directive('studentQuiz', ['rooms', function (rooms) {
	return {
		restrict: 'E',
		templateUrl: 'quiz_student.html',
		controller: 'studentQuizController',
		link: {
            pre: function ($scope, elemt, attrs) {
                $scope.quizSending = false;
                //$scope.quiz = {};

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

                $scope.reset = function () {
                    $scope.quizSending = false;
                    //$scope.questions = [];
                };

                $scope.sendQuiz = function () {
                    $scope.quizSending = !$scope.quizSending;
                    var chk = [];
                    /*for (var i = 0; i < $scope.question.quiz.answers.length; i++) {
                        if ($scope.question.quiz.answers[i].checked !== false) {
                            chk.push($scope.question.quiz.answers[i]);
                        }
                    }*/
                    /*rooms.answerPoll($scope.room, $scope.question, chk, function (resp) {
                        $scope.getNext(function (bool) {
                            if (!bool) {
                                $('#pollStudentModal').modal('hide');
                                $scope.$apply(function () {
                                    $scope.reset();
                                });
                            }
                        });
                    });*/
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