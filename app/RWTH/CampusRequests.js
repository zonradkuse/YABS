var https = require('https');

function postReqCampus(query, data, next) {
    var post = {
        host: 'oauth.campus.rwth-aachen.de',
        port: '443',
        path: '/oauth2waitress/oauth2.svc/' + query,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }

    };
    var postRequest = https.request(post, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            next(null, chunk);
        });
    });
    
    postRequest.write(data);
    postRequest.end();

    postRequest.on('error', function(err){
        next(err);
    });
}

module.exports.postReqCampus = postReqCampus;