clientControllers.controller('navbarController', ['$scope', 'authentication',
    function($scope, authentication) {
		authentication.fetchUserName();
        $scope.$watch(authentication.getUserName, function(name) {
        	$scope.username = name;
        });
    }
]);