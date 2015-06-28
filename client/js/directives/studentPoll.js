clientControllers.directive('studentPoll', ['rooms', function (rooms) {
	return {
		restrict: 'E',
		templateUrl: 'poll_student.html',
		controller: 'studentPollController',
		link: function ($scope, element, attrs) {
            $('#pollStudentModal').modal({
                keyboard: false,
                backdrop: 'static',
                show: false
            });

            $scope.getNext = function (cb) {
                rooms.getNextPoll($scope.room, function(data) {
                    if (data && data.arsObj && data.arsObj.poll) {
                        for (var i = 0; i < data.arsObj.poll.answers.length; i++) {
                            data.arsObj.poll.answers[i].checked = false;
                        }
                        $scope.question = data.arsObj;
                        if (cb) cb(true);
                    } else {
                        $scope.question = {};
                        if (cb) cb(false);
                    }
                });
            };
            $scope.getNext();
            $scope.checkAnswer = function() {
                var selected = false;
            };
            $scope.reset = function () {
                $scope.sending = false;
                $scope.question = {};
            };

            $scope.send = function () {
                // TODO real sending and error handling
                $scope.sending = !$scope.sending;
                var chk = [];
                for (var i = 0; i < $scope.question.poll.answers.length; i++) {
                    if ($scope.question.poll.answers[i].checked !== false) {
                        chk.push($scope.question.poll.answers[i]);
                    }
                }
                rooms.answerPoll($scope.room, $scope.question, chk, function (resp) {
                    $scope.getNext(function (bool) {
                        if (!bool) {
                            $('#pollStudentModal').modal('hide');
                            $scope.$apply(function () {
                                $scope.reset();
                            });
                        }
                    });
                });
            };
        }
	};
}]);