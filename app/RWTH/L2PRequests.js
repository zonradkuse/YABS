/**
 * L2PRequests.js - Collection of L2P API calls.
 *
 * Consult L2P API - Sometimes they rename things like status to Status.
 * https://www3.elearning.rwth-aachen.de/_vti_bin/l2pservices/api.svc/v1/documentation
 */

var https = require('https');
var logger = require('../Logger.js');

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


function getAllCourses(cb) {
	this.options.path = '/_vti_bin/l2pservices/api.svc/v1/viewAllCourseInfo?accessToken=' + this.token;
	request(this.options, cb);
}

function getAllDiscussions(cid, cb) {
	this.options.path = '/_vti_bin/l2pservices/api.svc/v1/viewAllDiscussionItems?accessToken=' + this.token + '&cid=' + cid;
	request(this.options, cb);
}

function getUserContext (cb) {
    this.options.path = '/_vti_bin/l2pservices/ExternalAPI.svc/Context?token=' + this.token;
    request(this.options, cb);
}

function getCourseInfo(cid, cb) {
    this.options.path = '/_vti_bin/l2pservices/api.svc/v1/viewCourseInfo?accessToken=' + this.token + '&cid=' + cid;
    request(this.options, cb);
}

function getUserRole(cid, cb) {
    logger.debug('called getUserRole.');
    this.options.path = '/_vti_bin/l2pservices/api.svc/v1/viewUserRole?accessToken=' + this.token + '&cid=' + cid;
    request(this.options, function (err, data) {
        if (data && data.Status && data.role) {
            cb(null, data.role);
        } else {
            cb(new Error("L2P said no."));
        }
    });
}

function parseData(data) {
    var parsedData;
    try {
        parsedData = JSON.parse(data);
    } catch (e) {
        logger.warn("L2P Data malformed.");
        return false;
    }
    return parsedData;
}

/**
 * This function does the real request and parses the data before passing it to the callback
 * @param options
 * @param next
 */
function request(options, next) {
    checkMethod(options.method);
	var req = https.request(options, function (res) {
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

function checkMethod(method) {
    if (!(method === 'GET' || method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        throw new Error('Invalid HTTP Method ' + method);
    }
}

module.exports.l2pRequest = l2pRequest;
