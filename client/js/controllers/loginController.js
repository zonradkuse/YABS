(function() {
    clientControllers.controller('loginController', ['$scope', '$routeParams', 'authentication', 
        function($scope, $routeParams, authentication) {
        	authentication.isUserLoggedIn().then(function(result) {
        		console.log(result);
        	});
        }
    ]);
})();