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
            $scope.rooms = [];
            fetchRooms();
            rooms.enter({_id: 1});

            $timeout(function () {
                if ($scope.rooms.length === 0) {
                    fetchRooms(function () {
                        if ($scope.rooms.length === 0) {
                            $scope.rooms = null;
                        }
                    });
                }
            }, 3000);

            $scope.checkRoom = function (roomName) {
                $scope.roomExisting = null;
                rooms.hasUserAccess({ _id : 0, name : roomName }).then(function (access) {
                    $scope.roomExisting = access;
                });
            };

            function fetchRooms (cb) {
                rooms.toArray().then(function (rooms) {
                    $scope.rooms = rooms;
                    if (cb) {
                        cb ();
                    }
                });
            }
        }
]);
