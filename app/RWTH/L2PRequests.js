/**
 * Collection of L2P API calls. For further RWTH API-Documentation consult
 * {@link https://www3.elearning.rwth-aachen.de/_vti_bin/l2pservices/api.svc/v1/documentation L2P API Docs}
 * @module RWTH/L2PRequests
 */

var https = require('https');
var logger = require('../Logger.js');

/**
 * @class
 * @alias module:RWTH/L2PRequests.l2pRequest
 * @example
 * var req = new l2pRequest(user.rwth.token);
 * req.getAllCourses(function (err, data) {
 *      console.log(data);
 * });
 *
 * @param {String} token - The user token stored in rwth.token
 */
var l2pRequest = function (token) {
    this.options = {
        host: 'www3.elearning.rwth-aachen.de',
        port: '443',
        path: '',
        method: 'GET', // default is get. Should be set individually in preparation method
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    this.token = token;
};

l2pRequest.prototype.getUserContext = getUserContext;
l2pRequest.prototype.getAllCourses = getAllCourses;
l2pRequest.prototype.getAllDiscussions = getAllDiscussions;
l2pRequest.prototype.getCourseInfo = getCourseInfo;
l2pRequest.prototype.getUserRole = getUserRole;

/**
 * @memberof module:RWTH/L2PRequests.l2pRequest.prototype
 *
 * @param {Function} cb - callback. Takes (err, parsedData)
 */
function getAllCourses(cb) {
	this.options.path = '/_vti_bin/l2pservices/api.svc/v1/viewAllCourseInfo?accessToken=' + this.token;
	request(this.options, cb);
}

/**
 * @memberof module:RWTH/L2PRequests.l2pRequest.prototype
 *
 * @param {String} cid - l2p courseId for API-Call
 * @param {Function} cb - callback. Takes (err, parsedData)
 */
function getAllDiscussions(cid, cb) {
	this.options.path = '/_vti_bin/l2pservices/api.svc/v1/viewAllDiscussionItems?accessToken=' + this.token + '&cid=' + cid;
	request(this.options, cb);
}
/**
 * @memberof module:RWTH/L2PRequests.l2pRequest.prototype
 *
 * @param {Function} cb - callback. Takes (err, parsedData)
 */
function getUserContext (cb) {
    this.options.path = '/_vti_bin/l2pservices/ExternalAPI.svc/Context?token=' + this.token;
    request(this.options, cb);
}

/**
 * @memberof module:RWTH/L2PRequests.l2pRequest.prototype
 *
 * @param {String} cid - l2p courseId for API-Call
 * @param {Function} cb - callback. Takes (err, parsedData)
 */
function getCourseInfo(cid, cb) {
    this.options.path = '/_vti_bin/l2pservices/api.svc/v1/viewCourseInfo?accessToken=' + this.token + '&cid=' + cid;
    request(this.options, cb);
}

/**
 * @memberof module:RWTH/L2PRequests.l2pRequest.prototype
 *
 * @param {String} cid - l2p courseId for API-Call
 * @param {Function} cb - callback. Takes (err, parsedData)
 */
function getUserRole(cid, cb) {
    logger.debug('called getUserRole.');
    this.options.path = '/_vti_bin/l2pservices/api.svc/v1/viewUserRole?accessToken=' + this.token + '&cid=' + cid;
    request(this.options, function (err, data) {
        if (data && data.Status && data.role) {
            cb(null, data.role);
        } else {
            cb(err ? err : new Error("unknown error."));
        }
    });
}

/**
 * Parses String to JSON and returns it.
 * @param data
 * @returns {Object|Boolean} - Parsed Object or false when an error occured.
 */
function parseData(data) {
    var parsedData;
    try {
        parsedData = JSON.parse(data);
    } catch (e) {
        logger.warn("L2P Data malformed. Answer was: " + data);
        return false;
    }
    return parsedData;
}

/**
 * This function does the real request and parses the data before passing it to the callback
 * @param {Object} options - take a look at the constructor implementation
 * @param next
 */
function request(options, next) {
    checkMethod(options.method);
	var req = https.request(options, function (res) {
		if (res.statusCode === 401) {
            return next(new Error("Access Denied"));
        }
        var response = '';
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			response += chunk;
		});
		res.on('end', function () {
			var data = parseData(response);
            next(!data ? (new Error("Parse error")) : false, data);
		});
	});
	req.end();
    
	req.on('error', function (err) {
		logger.warn(err);
		next(err);
	});
}

/**
 * Checks if provided method is valid HTTP Method
 * @param {String} method
 */
function checkMethod(method) {
    if (!(method === 'GET' || method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        throw new Error('Invalid HTTP Method ' + method);
    }
}

module.exports.l2pRequest = l2pRequest;
