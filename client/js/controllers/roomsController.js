/** @model Angular-Controller roomsController*/
clientControllers.controller("roomsController", ["$scope", "$routeParams", "rooms", "authentication",
    function($scope, $routeParams, rooms, authentication) {
    	authentication.enforceLoggedIn();
    	$scope.rooms = rooms.toArray();
    	rooms.enter({_id: 1});
    }
]);