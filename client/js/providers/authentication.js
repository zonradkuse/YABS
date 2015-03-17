client.service('authentication', ['$window', '$q', 'rpc', function($window, $q, rpc){
	
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

	this.getUserId = function() {
		var deferred = $q.defer();
		this.isUserLoggedIn().then(function(loggedin) {
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
}]);