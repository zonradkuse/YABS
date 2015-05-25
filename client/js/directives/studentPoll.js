clientControllers.directive('studentPoll', ['rpc', function (rpc) {
	return {
		restrict: 'E',
		templateUrl: 'poll_student.html',
		controller: 'studentPollController',
		link: function (scope, element, attrs) {

		}
	};
}]);