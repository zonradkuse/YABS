(function() {
    clientControllers.controller('courseController', ['$scope', '$routeParams',  'rooms',
        function($scope, $routeParams, rooms) {
        	var room = rooms.getById($routeParams.courseid);
        	if (room) {
        		$scope.room = room;
        	}
        	else {
				$location.path("/");
				$scope.$apply();
        	}
        }
    ]);

})();