(function() {
    clientControllers.controller('loginController', ['$scope', '$routeParams', 'authentication', '$window', '$q', '$location',
        function($scope, $routeParams, authentication, $window, $q, $location) {
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
					$window.open(url);
				});
		}	
    ]);
})();