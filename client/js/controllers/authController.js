clientControllers.controller("authController", ["$scope", "rpc", "$location", "authentication",
    function($scope, rpc, $location, authentication) {
        $scope.password = "";
        $scope.email = "";
        $scope.name = "";

        authentication.isUserLoggedIn().then(function (status) {
            if (status) {
                $location.path("/");
            }
        });

        $scope.reset = function () {
            $scope.error = null;
        };

        $scope.login = function () {
            rpc.call("local:login", { email : $scope.email, password : $scope.password }).then(
                function (data) {
                    window.location.href = "/";
                },function (error) {
                    $scope.error = error;
                });
        };

        $scope.register = function () {
            rpc.call("local:register", { email : $scope.email, password : $scope.password, name : $scope.name }).then(
                function (data) {
                    $location.path("/local/login");
                }
            );
        };
    }
]);
