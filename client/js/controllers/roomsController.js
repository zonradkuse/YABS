/**
 * Takes care that a user is logged in when trying to access rooms.
 * @module Controllers/roomsController
 * @requires $scope
 * @requires $routeParams
 * @requires module:Services/rooms
 * @requires module:Services/authentication
 */

clientControllers.controller("roomsController", ["$scope", "$routeParams", "rooms", "authentication",
    function($scope, $routeParams, rooms, authentication) {
    	authentication.enforceLoggedIn();
    	$scope.rooms = rooms.toArray();
    	rooms.enter({_id: 1});
    }
]);