clientControllers.controller('navbarController', ['$scope', 'authentication',
    function($scope, authentication) {
        authentication.getUserName().then(function(name) {
            $scope.username = name;
        });
    }
]);