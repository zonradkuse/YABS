/**
 * L2PRequests.js - Collection of L2P API calls.
 *
 * TODO refactor this such that every request has a prototype and makeCopy is not needed.
 * 		Do not touch this before not having refactored the request error todo below.
 *
 * Consult L2P API - Sometimes they rename things like status to Status.
 * https://www3.elearning.rwth-aachen.de/_vti_bin/l2pservices/api.svc/v1/documentation
 */

var https = require('https');
var logger = require('../Logger.js');

var options = {
	host: 'www3.elearning.rwth-aachen.de',
	port: '443',
	path: '',
	method: 'GET',
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
	}
};

function makeCopy() {
	return JSON.parse(JSON.stringify(options));
}

function getAllCourses(token, next) {
	var options = makeCopy();
	options.path = '/_vti_bin/l2pservices/api.svc/v1/viewAllCourseInfo?accessToken=' + token;
	request(options, next); 
}

function getAllDiscussions(token, cid, next) {
	var options = makeCopy();
	options.path = 'viewAllDiscussionItems?accessToken=' + token + '&cid=' + cid;
	request(options, next);
}

function request(options, next) {
	var req = https.request(options, function (res) {
		var response = '';
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			response += chunk;
		});
		res.on('end', function () {
			next(response);
		});
	});
	req.end();
    
	req.on('error', function (err) {
		logger.warn(err);
		next(null, err); // TODO refactor this. swap err and null. Could have huge impact on request.
	});
}

module.exports.getAllDiscussions = getAllDiscussions;
module.exports.getAllCourses = getAllCourses;
