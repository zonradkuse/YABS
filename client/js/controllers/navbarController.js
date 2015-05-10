clientControllers.controller('navbarController', ['$scope', "$rootScope", 'authentication',
    function($scope, $rootScope, authentication) {
		authentication.fetchUserName();
        $scope.$watch(authentication.getUserName, function(name) {
        	$scope.username = name;
        });

        $rootScope.$on("redrawNavbar", function(event, data) {
            $scope.username = data.username;
        });
    }
]);