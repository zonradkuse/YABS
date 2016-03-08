// This file is part of YABS. See License for more information

/**
 * @module Controllers/dashController
 * @requires Services/users
 * @requires Services/authentication
 */

clientControllers.controller("dashController", ["$scope", "$rootScope", "users", "authentication",
    function($scope, $rootScope, users, auth){
        auth.fetchUserName();
        $scope.$watch(auth.getUserName, function() {
            $scope.username = auth.getUserName();
        });
        $scope.$watch(auth.getUser, function(user) {
            $scope.user = user;
        });
        $scope.editUser = false;
        $scope.username = $scope.user;

        /**
         * saves new user Object and makes sure the new name ist written to the navbar.
         * @param {User} user - a user Object.
         */
        $scope.saveUser = function (user) {
            $scope.editUser = !$scope.editUser;
            if (!$scope.editUser) {
                users.saveUserName(user.name, function (success) {
                    if (success) {
                        $scope.$apply(function () {
                            $rootScope.$broadcast("redrawNavbar" , {
                                username: user.name
                            });
                            $scope.username = user.name;
                        });
                    }
                });
            }
        };
}]);
