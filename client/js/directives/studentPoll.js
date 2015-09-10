clientControllers.directive('studentPoll', ['rooms', function (rooms) {
	return {
		restrict: 'E',
		templateUrl: 'poll_student.html',
		controller: 'studentPollController',
		link: {
            pre: function ($scope, elemt, attrs) {
                $scope.pollSending = true;

                $scope.getNext = function (cb) {
                    rooms.getNextPoll($scope.room, function(data) {
                        if (data && data.arsObj && data.arsObj.poll) {
                            for (var i = 0; i < data.arsObj.poll.answers.length; i++) {
                                data.arsObj.poll.answers[i].checked = false;
                            }
                            $scope.$apply(function () {
                                $scope.question = data.arsObj;
//<<<<<<< HEAD
//                                $scope.sending = false;
//                                $('#pollStudentModal').modal('show');
//=======
                                $scope.pollSending = false;
//>>>>>>> 3474a2ee84e0d3ec7ff6079ba184fa168b61070d
                            });
                            if (cb) cb(true);
                        } else {
                            $scope.$apply(function () {
                                $scope.resetPoll();
                            });
                            if (cb) cb(false);
                        }
                    });
                };

                $scope.resetPoll = function () {
                    $scope.pollSending = false;
                    $scope.question = {};
                };

                $scope.sendPoll = function () {
                    $scope.pollSending = !$scope.pollSending;
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
                                    $scope.resetPoll();
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
                        $scope.pollSending = true;
                        $scope.getNext(function (bool) {
                            if (!bool) {
                                $("#pollStudentModal").modal('hide');
                            } else {
                                $scope.pollSending = false;
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