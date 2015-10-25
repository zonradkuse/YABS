/** @module Directive/ARSStudentPoll */

clientControllers.directive('studentPoll', ['rooms', function (rooms) {
	return {
		restrict: 'E',
		templateUrl: 'poll_student.html',
		controller: 'studentPollController',
		link: {
            pre: function ($scope) {
                $scope.pollSending = true;
                $scope.statisticsShowing = false;
                $scope.hasNext = true;

                $scope.getNext = function (cb) {
                    rooms.getNextPoll($scope.room, function(data) {
                        if (data && data.arsObj && data.arsObj.poll) {
                            for (var i = 0; i < data.arsObj.poll.answers.length; i++) {
                                data.arsObj.poll.answers[i].checked = false;
                            }
                            $scope.$apply(function () {
                                $scope.question = data.arsObj;
                                $scope.pollSending = false;
                            });
                            if (cb) {
                                cb(true);
                            } else {
                                $scope.statisticsShowing = false;
                            }
                        } else {
                            if (cb) {
                                cb(false);
                            } else {
                                $scope.hasNext = false;
                            }
                        }
                        $scope.$digest();
                    });
                };

                $scope.resetPoll = function () {
                    $scope.pollSending = false;
                    $scope.statisticsShowing = false;
                    $scope.hasNext = true;
                    $scope.question = {};
                    $("#pollStudentModal").modal('hide');
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
                        $scope.statisticsShowing = true;
                        $scope.$digest();
                    });
                };
            },
            post : function ($scope) {
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
                    $scope.getNext(function (bool) {
                        if (bool) {
                            $("#pollStudentModal").modal('show');
                        }
                    });
                }, 2000);
            }
        }
	};
}]);