/**
 * Created by j0h on 10.05.15.
 */
client.service("users", ["rpc", "$rootScope", '$q', function(rpc, $rootScope, $q){
    this.saveUserName = function (username, next) {
        rpc.call("user:changeName", { "username" : username }, function (data) {
            if (data.status === true) {
                next(true);
            } else {
                next(false);
            }
        });
    };
}]);