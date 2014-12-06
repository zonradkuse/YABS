/*! Module to handle all incoming requests.

  Note: the static folder is already set. Here are all needed routes like
  the login post request. 
*/

module.exports = function(pExpressApp, pPassportAuth){
  var app = pExpressApp;
  var passport = pPassportAuth;
  console.log('initialized routes!');
  app.post('/login', function(req,res){
    var auth = require('./Authentication.js');
    auth.loginLocal(req, res, function(res){res.redirect("/sessiontest")}, function(res){res.redirect("/")});
  });
	/*
  FOR LATER!
  passport.authenticate('local-login', { 
    successRedirect: '/',
	  failureRedirect: '/login',
	  failureFlash: true }*/

  /*! A short sessiontest
  */
  app.get('/sessiontest', function(req, res, next){
    var sess = req.session
    res.setHeader('Content-Type', 'text/html')
    res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's (' + (sess.cookie.maxAge/60 / 1000) + ' min)</p>')
    res.write('<p>logged in with Session ID ' + sess.sessionId + '<p>')
    if (sess.sessionId == undefined) {
      res.write('login? <a href="/Tests/logintest.html">Login!</a>')
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