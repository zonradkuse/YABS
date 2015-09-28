/**
 * This module makes calls to {@link https://oauth.campus.rwth-aachen.de/doc/ Campus API} possible.
 * @module CampusRequests
 */

var https = require('https');

/**
 * This function calls the Campus API and gives the response to next.
 * @param {String} query - the extension to /oauth2waitress/oauth2.svc/
 * @param {String} data - data for campus
 * @param {Function} next - will be called with (err, response)
 */
function postReqCampus(query, data, next) {
	var post = {
		host: 'oauth.campus.rwth-aachen.de',
		port: '443',
		path: '/oauth2waitress/oauth2.svc/' + query,
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'X-ATT-DeviceId' : 'YABS',
			'Content-Length': data.length
		}

	};
	var postRequest = https.request(post, function (res) {
		res.setEncoding('utf8');
		var response = '';
		res.on('data', function (chunk) {
			response += chunk;
		});
		res.on('end', function () {
			next(null, response);
		});
	});
    
	postRequest.write(data);
	postRequest.end();

	postRequest.on('error', function (err) {
		next(err);
	});
}

module.exports.postReqCampus = postReqCampus;
