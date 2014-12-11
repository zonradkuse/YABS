/*! Module to handle all incoming requests.

  Note: the static folder is already set. Here are all needed routes like
  the login post request. 
*/
var https = require('https');
var querystring = require('querystring');
var config = require('../config.json');

module.exports = function(pExpressApp){
  var app = pExpressApp;

  console.log('initialized routes!');
  app.post('/login', function(req,res){
    var auth = require('./Authentication.js');
    auth.loginLocal(req, res, function(res){res.redirect("/sessiontest")}, function(res){res.redirect("/")});
  });
  app.get('/l2plogin', function(req, res){
    //1. get a client id by post req to l2p server 
    //2. redirect user to l2p auth 
    //3. poll for user auth 
    postreqToL2P(function(response){
      //check the answer from the oauth server
      if(response != null){
        if(response.user_code == null){
          //huston, we have a problem
          res.write("error on authentication: " + response);
        }else{
          // we have a user code. post request must be successful - redirect user to rwth auth.
          res.redirect(response.verification_url + "/?q=verify&d=" + response.user_code);
          // now begin to poll until we get access
          
        }
      }else{
        res.write("error on authentication: the response object is null");
      }
      res.end();
    });

  });
  /** A short sessiontest
  */
  app.get('/sessiontest', function(req, res, next){
    var sess = req.session
    res.setHeader('Content-Type', 'text/html');
    res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's (' + (sess.cookie.maxAge/60 / 1000) + ' min)</p>')
    res.write('<p>logged in with Session ID ' + sess.sessionId + '<p>')
    if (sess.sessionId == undefined) {
      res.write('login? \
      <form action="/login" method="post"> \
      First name:<br> \
      <input type="text" name="username" value="Username"> \
      <br><br> \
      <input type="submit" value="Submit"> \
      </form>')
    };
    res.end()
  });


  app.get('/course/*', function(req, res, next){
    var path = require('path');
    path.exists(path.resolve(__dirname, '../', req.originalUrl), function(exists) {
        if (!exists)
            res.sendFile(path.resolve(__dirname, '../', 'public/index.html'));
    });
  });


} 
/**
  This funtion does the post request to the rwth oauth module.
  @param next This is a callback function with one parameter which gets the response object.
*/
function postreqToL2P(next){
  var data = querystring.stringify({
    "client_id" : config.login.l2p.clientID,
    "scope" : config.login.l2p.scope
  });
  var post = {
      host: 'oauth.campus.rwth-aachen.de',
      port: '443',
      path: '/oauth2waitress/oauth2.svc/code',
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.length
      }

  }
  var postRequest = https.request(post, function(res){
    res.setEncoding('utf8');
    res.on('data', function(chunk){
      next(chunk);
    });
  });

  postRequest.write(data);
  postRequest.end();
}



