clientControllers.controller("roomsController", ["$scope", "$routeParams", "rooms", "authentication",
    function($scope, $routeParams, rooms, authentication) {
    	authentication.enforceLoggedIn();
    	$scope.rooms = rooms.toArray();
    	rooms.enter({roomId: 0});
    }
]);