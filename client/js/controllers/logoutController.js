// This file is part of YABS. See License for more information

/**
 * @module Controllers/logoutController
 * @requires Services/authentication
 * @requires $window
 */

clientControllers.controller('logoutController', ['$scope', 'authentication', '$window',
    function($scope, authentication, $window) {
        authentication.logout().then(function() {
        	$window.location = document.getElementsByTagName('base')[0].href;
        });
    }
]);