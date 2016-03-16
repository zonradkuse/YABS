// This file is part of YABS. See License for more information

/**
 * Decides whether a user is logged in. Redirects to rooms view if logged in.
 * @module Controllers/frontpageController
 * @requires Services/authentication
 */

clientControllers.controller("frontpageController", ["$scope", "$routeParams", "authentication", "$location",
    function($scope, $routeParams, authentication, $location) {
    	authentication.isUserLoggedIn().then(function(result) {
    		if(result) {
    			$location.path("/rooms");
    		}
    	});
    }
]);