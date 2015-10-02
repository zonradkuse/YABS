/** @module Directives/ARSStudentQuiz */

clientControllers.directive('studentQuiz', ['rooms', 'errorService', function (rooms, errorService) {
	return {
		restrict: 'E',
		templateUrl: 'quiz_student.html',
		controller: 'studentQuizController',
		link: {
            pre: function ($scope) {
                $scope.quizSending = false;
                $scope.quizQuestionSelection = 0;
                $scope.quizSelection = "";

                $scope.resetQuiz = function () {
                    $scope.quizSending = false;
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

                    rooms.answerQuiz($scope.room, $scope.quiz, chkQuestions, function (data) {
                        $scope.$apply(function () {
                            $scope.resetQuiz();
                        });
                    });
                };

                $scope.changeQuiz = function (selection) {
                    for (var key in $scope.quizzes) {
                        if ($scope.quizzes[key].description === selection) {
                            $scope.quiz = $scope.quizzes[key];
                            break;
                        }
                    }
                };

            },
            post : function ($scope) {
                // do data loading
                rooms.getAllQuizzes($scope.room, function(quizzes){
                    $scope.quizzes = [];
                    for (var key in quizzes.quizzes) { //crappy solution but server gives everything, even inactive objects
                        if (quizzes.quizzes[key].active) {
                            $scope.quizzes.push(quizzes.quizzes[key]);
                        }
                    }
                    $scope.$digest();
                });
            }
        }
	};
}]);