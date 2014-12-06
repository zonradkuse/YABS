(function(){
    var client = angular.module('client', [
            'ngRoute',
            'clientControllers'
        ]);
    window.client = client;

    client.config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
        $locationProvider.html5Mode(true);
        $routeProvider.
            when('/course/:courseid', {
                templateUrl: 'course.html',
                controller: 'courseController'
            }).
            when('/', {
                templateUrl: 'frontpage.html',
                controller: 'frontpageController'
            }).            
            otherwise({
                redirectTo: '/404'
        });
    }]);

    var controllers = angular.module('clientControllers', []);
    window.clientControllers = controllers;
})();