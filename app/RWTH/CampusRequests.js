var https = require('https');

function postReqCampus(query, data, next) {
    var post = {
        host: 'oauth.campus.rwth-aachen.de',
        port: '443',
        path: '/oauth2waitress/oauth2.svc/' + query,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36',
            'X-ATT-DeviceId' : 'YABS',
            'Content-Length': data.length
        }

    };
    var postRequest = https.request(post, function(res) {
        res.setEncoding('utf8');
        var response = '';
        res.on('data', function(chunk) {
            response += chunk;
        });
        res.on('end',function(){
            next(null, response);
        });
    });
    
    postRequest.write(data);
    postRequest.end();

    postRequest.on('error', function(err){
        next(err);
    });
}

module.exports.postReqCampus = postReqCampus;