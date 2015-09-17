/** @module Angular-Controller logoutController*/
clientControllers.controller('logoutController', ['$scope', 'authentication', '$window',
    function($scope, authentication, $window) {
        authentication.logout().then(function() {
        	$window.location = "/";
        });
    }
]);