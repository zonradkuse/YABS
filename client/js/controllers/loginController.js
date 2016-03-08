// This file is part of YABS. See License for more information

/**
 * Takes care of Client OAuth with Campus. Displays the link to the login page
 * @module Controllers/loginController
 * @requires Services/authentication
 */

clientControllers.controller("loginController", ["$scope", "$sce", "$routeParams", "authentication", "$window", "$q", "$location",
    function($scope, $sce, $routeParams, authentication, $window, $q, $location) {
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
					$window.location = document.getElementsByTagName('base')[0].href;
				}
			})
			.then(function(url) {
				$scope.loginurl = $sce.trustAsResourceUrl(url);
				$window.open(url);
				//$('#loginModal').modal('show');
			});
	}	
]);