/** @model app*/
(function(){
    var client = angular.module('client', [
            'ngRoute',
            'clientControllers',
            'ngFitText',
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
            when('/logout', {
                controller: "logoutController",
                templateUrl: 'frontpage.html',
            }).        
            when('/rooms', {
                templateUrl: 'rooms.html',
                controller: 'roomsController'
            }).
            when('/dashboard', {
                templateUrl: 'dash.html',
                controller: 'dashController'
            }).
            when('/', {
                templateUrl: 'frontpage.html',
                controller: 'frontpageController'
            }).
            when('/news', {
                templateUrl: 'news.html',
                //controller: 'frontpageController'
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
        $('#creators').tooltip();
    }]);

    var controllers = angular.module('clientControllers', ["angular-chartist"]);
    window.clientControllers = controllers;
})();