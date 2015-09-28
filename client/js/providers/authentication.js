/** @module Angular-Service authentication*/

client.service("authentication", ["$window", "$q", "rpc", function($window, $q, rpc){
	var username = ""; // Do not use default as we check if username is set by checking empty string.
	var user = {};

    /**
     * Function redirects to /login if user is not logged in.
     */
	this.enforceLoggedIn = function() {
		this.isUserLoggedIn().then(function(status) {
			if (!status) {
				$window.location = "/login";
			} 
		});
	};

    /**
     * Checks if embedded into an iFrame.
     * @returns {boolean} - true iff embedded.
     */
    this.checkIfEmbeddedIntoL2P = function () {
        // self !== true iff embedded in iframe
        return self !== top;
    };

    /**
     * Calls system:whoami in order to determine status. As a promise is returned
     * isUserLoggedIn().then(function (status) {}) might be used to process status.
     * @returns {Promise}
     */
	this.isUserLoggedIn = function() {
		var deferred = $q.defer();
		rpc.call("system:whoami", {}, function(data) {
			deferred.resolve(data.status);
		});
		return deferred.promise;
	};
    /**
     * Logout. You should redirect(!!) after that in order to give a new sessionId.
     * @returns {Promise} - .then(cb) called iff server destroyed session successfully.
     */
	this.logout = function() {
		var deferred = $q.defer();
		rpc.call("system:logout", {}, function() {
			deferred.resolve();
		});
		return deferred.promise;
	};

    /**
     * Get username.
     * @returns {String} - directly returns username.
     */
	this.getUserName = function() {
		return username;
	};
    /**
     * Get User Object
     * @returns {Object} - user
     */
	this.getUser = function() {
		return user;
	};

    /**
     * fetches the username and sets it locally in the service. Promise resolves with user object.
     * @returns {Promise}
     */
	this.fetchUserName = function() {
		var deferred = $q.defer();
		if (username) {
			return deferred.resolve(username);
        }
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

    /**
     * Get the login URL asynchronously.
     * @param onSuccess {Function} - will be called iff login was successful.
     * @returns {Promise} - .then() takes function with one parameter, taking the login URL provided by server.
     */
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