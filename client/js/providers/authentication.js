/** @module Angular-Service authentication*/

client.service("authentication", ["$window", "$q", "rpc", function($window, $q, rpc){
	var username = false;
	var user = {};

	this.enforceLoggedIn = function() {
		this.isUserLoggedIn().then(function(status) {
			if (!status) {
				$window.location = "/login";
			} 
		});
	};

    this.checkIfEmbeddedIntoL2P = function () {
        if (document.cookie.indexOf('sourceLocation=embedded') > -1) {
            return true;
        } else {
            return false;
        }
    };


	this.isUserLoggedIn = function() {
		var deferred = $q.defer();
		rpc.call("system:whoami", {}, function(data) {
			deferred.resolve(data.status);
		});
		return deferred.promise;
	};

	this.logout = function() {
		var deferred = $q.defer();
		rpc.call("system:logout", {}, function() {
			deferred.resolve();
		});
		return deferred.promise;
	};

	this.getUserName = function() {
		return username;
	};

	this.getUser = function() {
		return user;
	};

	this.fetchUserName = function() {
		var deferred = $q.defer();
		if (username)
			return deferred.resolve(username);
		return this.isUserLoggedIn().then(function(loggedin) {
			if (loggedin) {
				rpc.call("system:whoami", {}, function(data) {
					username = data.message;
					user = data;
					deferred.resolve(data);
				});
			}
			else {
				deferred.resolve(false);
			}
			return deferred.promise;
		});
	};

	this.getLoginUrl = function(onSuccess) {
		var deferred = $q.defer();
		rpc.call("system:login", {}, function(data) {
			if ("url" in data) {
				deferred.resolve(data.url);
			}
			else if ("status" in data && data.status) {
				onSuccess();
			}
		});
		return deferred.promise;
	};
}]);