// This file is part of YABS. See License for more information

/**
 * @module Services/users
 * @requires module:Services/rpc
 */
client.service("users", ["rpc", function(rpc){
    /**
     * Takes care of saving a new username
     * @param {String} username -
     * @param {function} next - callback taking a boolean for status
     */
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