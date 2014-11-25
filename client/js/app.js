(function(){
    var client = angular.module('client', [
            'ngRoute',
            'clientControllers'
        ]);
    window.client = client;

    client.config(['$routeProvider', function($routeProvider) {
        $routeProvider.
            when('/', {
                templateUrl: 'frontpage.html',
                controller: 'frontpageController'
            }).
            otherwise({
                redirectTo: '/frontpage.html'
        });
    }]);

    var controllers = angular.module('clientControllers', []);
    window.clientControllers = controllers;
})();