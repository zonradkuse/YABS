/** @module Angular-Controller dashController*/

clientControllers.controller("dashController", ["$scope", "$rootScope", "users", "authentication",
    function($scope, $rootScope, users, auth){
        auth.fetchUserName();
        $scope.$watch(auth.getUserName, function(name) {
            $scope.username = auth.getUserName();
        });
        $scope.$watch(auth.getUser, function(user) {
            $scope.user = user;
        });
        $scope.editUser = false;
        $scope.username = $scope.user;
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
