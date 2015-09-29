/**
 * @module Controllers/logoutController
 * @requires Services/authentication
 * @requires $window
 */

clientControllers.controller('logoutController', ['$scope', 'authentication', '$window',
    function($scope, authentication, $window) {
        authentication.logout().then(function() {
        	$window.location = "/";
        });
    }
]);