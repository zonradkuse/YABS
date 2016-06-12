// This file is part of YABS. See License for more information

/**
 * Takes care that a user is logged in when trying to access rooms.
 * @module Controllers/roomsController
 * @requires $scope
 * @requires $routeParams
 * @requires module:Services/rooms
 * @requires module:Services/authentication
 */

clientControllers.controller("roomsController", ["$scope", "$timeout", "$routeParams", "rooms", "authentication",
        function($scope, $timeout, $routeParams, rooms, authentication) {
            authentication.enforceLoggedIn();
            rooms.toArray().then(function (rooms) {
               $scope.rooms = rooms;
            });
            rooms.enter({_id: 1});

            $scope.checkRoom = function (roomName) {
                $scope.roomExisting = null;
                rooms.hasUserAccess({ _id : 0, name : roomName }).then(function (access) {
                    $scope.roomExisting = access;
                });
            }
        }
]);
