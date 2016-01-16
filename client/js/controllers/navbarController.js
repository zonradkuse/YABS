/**
 * Takes care of near to global things like checking for embeddedness into L2P and loading the username to the navbar.
 * @module Controllers/navbarController
 * @requires $scope
 * @requires $rootScope
 * @requires Services/authentication
 */

clientControllers.controller('navbarController', ['$scope', "$rootScope", 'authentication',
    function($scope, $rootScope, authentication) {
        $scope.developerMail = "johannes neuhaus_asd-aachen de".replace(' ', '.').replace('_', '@').replace('asd', 'rwth');
		authentication.fetchUserName();
        $scope.$watch(authentication.getUserName, function(name) {
        	$scope.username = name;
        });

        $scope.embedded = authentication.checkIfEmbeddedIntoL2P(self);
        $rootScope.embedded = $scope.embedded;
        // whiten background for l2p
        if($scope.embedded) {
            $('body, .panel').css('background-color', '#eee');
            $('body').css('margin-top', '0');
            $('.container.rooms').css('margin-top', '0');
        }

        $rootScope.$on("redrawNavbar", function(event, data) {
            $scope.username = data.username;
        });
    }
]);