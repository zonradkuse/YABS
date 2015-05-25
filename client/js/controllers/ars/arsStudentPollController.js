clientControllers.controller('studentPollController', ['$scope', function ($scope) {
	$scope.question = {
		description: "is it a radiobox?",
		options: [{
			_id : 1,
			description: 'This is a radiobox',
			radiobox: true,
		},
		{
			_id : 3,
			description: 'This is a radiobox 2',
			checkbox: true
		},
		{
			_id : 4,
			description: 'This is a radiobox 2',
			text: true
		}]
	};

	$scope.checkAnswer = function() {
		var selected = false;
	};
	$scope.send = function () {
		// TODO real sending and error handling 
		$scope.sending = !$scope.sending;
	};
	
}]);