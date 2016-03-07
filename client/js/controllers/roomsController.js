/**
 * Takes care that a user is logged in when trying to access rooms.
 * @module Controllers/roomsController
 * @requires $scope
 * @requires $routeParams
 * @requires module:Services/rooms
 * @requires module:Services/authentication
 */

clientControllers.controller("roomsController", ["$scope", "$timeout", "$routeParams", "rooms", "authentication",
    function($scope, $timeout, $routeParams, rooms, authentication) {
    	authentication.enforceLoggedIn();
    	$scope.rooms = rooms.toArray();
    	rooms.enter({_id: 1});

		$timeout(function () {
			if ($scope.rooms.length === 0) {
				$scope.rooms = null;
				$scope.$digest();
			}
		}, 1000);
    }
]);