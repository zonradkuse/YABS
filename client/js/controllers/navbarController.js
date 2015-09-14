/** @module Angular-Controller navbarController*/
clientControllers.controller('navbarController', ['$scope', "$rootScope", 'authentication',
    function($scope, $rootScope, authentication) {
		authentication.fetchUserName();
        $scope.$watch(authentication.getUserName, function(name) {
        	$scope.username = name;
        });

        $scope.embedded = authentication.checkIfEmbeddedIntoL2P();
        // whiten background for l2p
        if($scope.embedded) {
            $('body').css('background-color', '#fff');
            $('body, .container.rooms').css('margin-top', '0');
        }

        $rootScope.$on("redrawNavbar", function(event, data) {
            $scope.username = data.username;
        });
    }
]);