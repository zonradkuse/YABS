clientControllers.directive('studentPoll', ['rooms', function (rooms) {
	return {
		restrict: 'E',
		templateUrl: 'poll_student.html',
		controller: 'studentPollController',
		link: {
            pre: function ($scope, elemt, attrs) {
                $scope.sending = true;

                $scope.getNext = function (cb) {
                    rooms.getNextPoll($scope.room, function(data) {
                        if (data && data.arsObj && data.arsObj.poll) {
                            for (var i = 0; i < data.arsObj.poll.answers.length; i++) {
                                data.arsObj.poll.answers[i].checked = false;
                            }
                            $scope.$apply(function () {
                                $scope.question = data.arsObj;
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
                };

                $scope.reset = function () {
                    $scope.sending = false;
                    $scope.question = {};
                };

                $scope.send = function () {
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
            },
            post : function ($scope, element, attrs) {
                $('#pollStudentModal').modal({
                    keyboard: false,
                    backdrop: 'static',
                    show: false
                });

                $("#pollStudentModal").off().on("shown.bs.modal", function() {
                    $scope.$apply(function() {
                        $scope.sending = true;
                        $scope.getNext(function (bool) {
                            if (!bool) {
                                $("#pollStudentModal").modal('hide');
                            } else {
                                $scope.sending = false;
                            }
                        });
                    });
                });

                setTimeout(function () {
                    $scope.getNext();
                }, 2000);
            }
        }
	};
}]);