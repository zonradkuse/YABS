/** @module Angular-Controller-loginController */

clientControllers.controller("loginController", ["$scope", "$routeParams", "authentication", "$window", "$q", "$location",
    function($scope, $routeParams, authentication, $window, $q, $location) {
    	$scope.loginurl = "";
    	authentication.isUserLoggedIn()
			.then(function(result) {
				if (!result) {
					return authentication.getLoginUrl(function() {
						authentication.fetchUserName().then(function() {
								$location.path("/");
						});
					});
				}
				else {
					$window.location = "/";
				}
			})
			.then(function(url) {
				$scope.loginurl = url;
				$window.open(url);
			});
	}	
]);