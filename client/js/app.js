// This file is part of YABS. See License for more information

(function(){
    var client = angular.module('client', [
            'ngRoute',
            'clientControllers',
            'ngFitText',
            'ja.qr'
        ]);
    window.client = client;
    window.appUrl = window.location.host;

    client.config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
        $locationProvider.html5Mode(true);
        $routeProvider.
            when('/course/:courseid', {
                templateUrl: 'html/views/course.html',
                controller: 'courseController'
            }).
            when('/login', {
                templateUrl: 'html/views/login.html',
                controller: 'loginController'
            }).
            when('/logout', {
                controller: "logoutController",
                templateUrl: 'html/views/frontpage.html'
            }).        
            when('/rooms', {
                templateUrl: 'html/views/rooms.html',
                controller: 'roomsController'
            }).
            when('/dashboard', {
                templateUrl: 'html/views/dash.html',
                controller: 'dashController'
            }).
            when('/', {
                templateUrl: 'html/views/frontpage.html',
                controller: 'frontpageController'
            }).
            when('/news', {
                templateUrl: 'html/views/news.html'
            }).
            when('/local/login', {
                templateUrl : 'html/views/login_local.html',
                controller: 'authController'
            }).
            when('/local/register', {
                templateUrl : 'html/views/register_local.html',
                controller: 'authController'
            }).
            otherwise({
                redirectTo: '/'
        });
        
        $(document).on('click','.navbar-collapse.in',function(e) { // Stolen from http://stackoverflow.com/a/22917099
            if( $(e.target).is('a') && $(e.target).attr('class') != 'dropdown-toggle' ) {
                $(this).collapse('hide');
            }
        });

    }]);

    client.run(["rooms", function(rooms) {
        rooms.enableListeners();
    }]);

    client.run(["authentication", function(authentication) {
        authentication.enableListeners();
    }]);

    var controllers = angular.module('clientControllers', ["angular-chartist"]);
    window.clientControllers = controllers;
})();
