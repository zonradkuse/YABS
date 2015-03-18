client.service('authentication', ['$window', '$q', 'rpc', function($window, $q, rpc){
	var username = false;

	this.enforceLoggedIn = function(basedata) {
		this.isUserLoggedIn().then(function(status) {
			if (!status) {
				$window.location = "/login";
			} 
		});
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
		rpc.call("system:logout", {}, function(data) {
			deferred.resolve();
		});
		return deferred.promise;
	};

	this.getUserName = function() {
		var deferred = $q.defer();
		if (username)
			return deferred.resolve(username);
		return this.isUserLoggedIn().then(function(loggedin) {
			if (loggedin) {
				rpc.call("system:whoami", {}, function(data) {
					deferred.resolve(data.message);
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