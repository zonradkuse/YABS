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
            /*$scope.question = {
                _id : "dasfasdw41352",
                description: "is it a radiobox?",
                poll: { answers:
                    [{
                        _id : 1,
                        description: 'This is a radiobox',
                        radiobox: true,
                        checked: false
                    },
                        {
                            _id : 3,
                            description: 'This is a radiobox 2',
                            checkbox: true,
                            checked: false
                        },
                        {
                            _id : 4,
                            description: 'This is a radiobox 2',
                            text: true
                        }]
                }
            };*/
            rooms.getNextPoll($scope.room, function(data) {
                $scope.question = data;
            });

            $scope.checkAnswer = function() {
                var selected = false;
            };
            $scope.send = function () {
                // TODO real sending and error handling
                $scope.sending = !$scope.sending;
                var chk = [];
                for (var i = 0; i < $scope.question.poll.answers.length; i++) {
                    if ($scope.question.poll.answers[i].checked) {
                        chk.push($scope.question.poll.answers[i]._id);
                    }
                }
                rooms.answerPoll($scope.room, $scope.question, chk, function (resp) {
                    console.log(resp);
                });
            };

        }
	};
}]);