var https = require('https');

function getAllCourses(token, next) {
    var options = {
        host: 'www3.elearning.rwth-aachen.de',
        port: '443',
        path: '/_vti_bin/l2pservices/api.svc/v1/viewAllCourseInfo?accessToken=' + token,
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    var req = https.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            next(null, chunk);
        });
    });
    req.end();
    
    req.on('error', function(err){
       next(err);
    });
}

module.exports.getAllCourses = getAllCourses;