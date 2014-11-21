/*! Module to handle all incoming requests.

  Note: the static folder is already set. Here are all needed routes like
  the login post request. 
*/

module.exports = function(pExpressApp, pPassportAuth){
  var app = pExpressApp;
  var passport = pPassportAuth;
  console.log('initialized routes!');
  app.post('/login', function(req,res){
    
    req.session.currentUser = req.body.username;
    res.redirect("/sessiontest");
  });
	/*
  FOR LATER!
  passport.authenticate('local-login', { 
    successRedirect: '/',
	  failureRedirect: '/login',
	  failureFlash: true }*/

  /*! A short sessiondemo
  */
  app.get('/sessiontest', function(req, res, next){
    var sess = req.session
    if (sess.views) {
      sess.views++
      res.setHeader('Content-Type', 'text/html')
      res.write('<p>views: ' + sess.views + '</p>')
      res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's (' + (sess.cookie.maxAge/60 / 1000) + ' min)</p>')
      res.write('<p>logged in as ' + sess.currentUser + '<p>')
      res.end()
    } else {
      sess.views = 1
      res.end('welcome to the session demo. refresh!')
    }
  });
} 