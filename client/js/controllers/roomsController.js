(function() {
    clientControllers.controller('roomsController', ['$scope', '$routeParams', "rooms",
        function($scope, $routeParams, rooms) {
        	$scope.rooms = rooms.toArray();
        }
    ]);

})();