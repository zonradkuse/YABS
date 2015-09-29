/**
 * @module Services/errorService
 * @requires $rootScope
 * @requires $timeout
 */

client.service("errorService", ["$rootScope", "$timeout", function ($rootScope, $timeout) {
    /**
     * This writes an error text to $rootScope.error for 5 seconds.
     * @param {Boolean} cycleDigest - if set a rootScope digestCycle will we applied after timeout OPTIONAL
     */
    this.drawError = function (message, cycleDigest) {
        $rootScope.error = message;
        $timeout(function () {
            $rootScope.error = undefined;
            if (cycleDigest) {
                $rootScope.$digest();
            }
        }, 5000);
    };
}]);