(function() {
    clientControllers.controller('loginController', ['$scope', '$routeParams', 'authentication', '$window', '$q', '$location',
        function($scope, $routeParams, authentication, $window, $q, $location) {
        	authentication.isUserLoggedIn()
				.then(function(result) {
					var deferred = $q.defer();
					if (!result) {
						return authentication.getLoginUrl(function() {
							$location.path("/");
							$scope.$apply();
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