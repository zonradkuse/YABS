(function(){
    var client = angular.module('client', [
            'ngRoute',
            'clientControllers',
        ]);
    window.client = client;
    window.appUrl = window.location.host;

    client.config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
        $locationProvider.html5Mode(true);
        $routeProvider.
            when('/course/:courseid', {
                templateUrl: 'course.html',
                controller: 'courseController'
            }).
            when('/login', {
                templateUrl: 'login.html',
                controller: 'loginController'
            }).
            when('/rooms', {
                templateUrl: 'rooms.html',
                controller: 'roomsController'
            }).                    
            when('/', {
                templateUrl: 'frontpage.html',
                controller: 'frontpageController'
            }).            
            otherwise({
                redirectTo: '/404'
        });
    }]);

    client.run(["rpc", "rooms", function(rpc, rooms) {
        rpc.attachFunction("room:add", function(data) {
            rooms.upsertRoom(data.room);
        });
    }]);
    var controllers = angular.module('clientControllers', []);
    //var authenticationProvider = angular.module('authenticationProvider', []);
    window.clientControllers = controllers;
})();