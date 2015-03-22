clientControllers.controller("frontpageController", ["$scope", "$routeParams", "authentication", "$location",
    function($scope, $routeParams, authentication, $location) {
    	authentication.isUserLoggedIn().then(function(result) {
    		if(result) {
    			$location.path("/rooms");
    		}
    	});
    }
]);