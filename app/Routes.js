  /*! Module to handle all incoming requests.

                  Note: the static folder is already set. Here are all needed routes like
                  the login post request.
                */
  var passport = require('passport')
  var https = require('https');
  var querystring = require('querystring');
  var config = require('../config.json');
  var logger = require('./Logger.js');
  var mainController = require('./MainController.js');
  var app;


  module.exports = function(pExpressApp) {
      app = pExpressApp;
  }


  module.exports.routes = function() {

      app.post('/login/local', function(req, res) {
          var auth = require('./Authentication.js');
          auth.loginLocal(req, function(err, user) {
              req.flash('message', 'Welcome' + res.name);
              req.user = user;
              res.redirect("/sessiontest")
          }, function(err) {
              req.flash('message', 'Error:' + err);
              res.redirect("/")
          });
      });

      app.post('/register/local', function(req, res) {
          var auth = require('./Authentication.js');
          auth.registerLocal(req, function(err, user) {
              req.flash('message', err);
              req.user = user;
              res.redirect('/');
          });
      });


      app.get('/l2plogin', function(req, res) {
          //1. get a client id by post req to l2p server
          //2. redirect user to l2p auth
          //3. poll for user auth
          postreqToL2P(function(response) {
              //check the answer from the oauth server
              if (response !== null) {
                  if (response.user_code === null) {
                      //huston, we have a problem
                      res.write("error on authentication: " + response);
                  } else {
                      // we have a user code. post request must be successful - redirect user to rwth auth.
                      res.redirect(response.verification_url + "/?q=verify&d=" + response.user_code);
                      // now begin to poll until we get access

                  }
              } else {
                  res.write("error on authentication: the response object is null");
              }
              res.end();
          });

      });
      /** A short sessiontest
       */
      app.get('/sessiontest', function(req, res, next) {
          var sess = req.session
          res.setHeader('Content-Type', 'text/html');
          res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's (' + (sess.cookie.maxAge / 60 / 1000) + ' min)</p>')
          res.write('<p>logged in with Session: ' + JSON.stringify(sess) + '<p>');
          res.write('<p>Your User Information: ' + JSON.stringify(req.user) + '</p>');
          if (sess.user === undefined) {
              res.write('login? \
                  <form action="/login/local" method="post"> \
                  First name:<br> \
                  <input type="text" name="username" value="Username"> \
                  <br><br> \
                  <input type="submit" value="Submit"> \
                  </form>register? \
                  <form action="/register/local" method="post"> \
                  First name:<br> \
                  <input type="text" name="username" value="Username"> \
                  <br> \
                  <input type="text" name="email" value="Email"> \
                  <br> \
                  <input type="password" name="password" value="Password"> \
                  <br><br> \
                  <input type="submit" value="Submit"> \
                  </form>');
          };
          res.end()
      });


      app.get('/course/*', function(req, res, next) {
          var path = require('path');
          path.exists(path.resolve(__dirname, '../', req.originalUrl), function(exists) {
              if (!exists)
                  res.sendFile(path.resolve(__dirname, '../', 'public/index.html'));
          });
      });
      // Courseadmin is for demo only, will be integrated into course
      app.get('/courseadmin/*', function(req, res, next) {
          var path = require('path');
          path.exists(path.resolve(__dirname, '../', req.originalUrl), function(exists) {
              if (!exists)
                  res.sendFile(path.resolve(__dirname, '../', 'public/index.html'));
          });
      });

      // Facebook OAuth
      app.get('/login/facebook', passport.authenticate('facebook', {
          scope: 'email',
      }));
      app.get('/auth/facebook/callback', passport.authenticate('facebook', {
          successRedirect: '/',
          failureRedirect: '/login'
      }));
      // Twitter OAuth
      app.get('/login/twitter', passport.authenticate('twitter'));
      app.get('/auth/twitter/callback', passport.authenticate('twitter', {
          successRedirect: '/',
          failureRedirect: '/login'
      }));
      // GitHub OAuth
      app.get('/login/github', passport.authenticate('github', {
          scope: 'user'
      }));
      app.get('/auth/github/callback', passport.authenticate('github', {
          successRedirect: '/',
          failureRedirect: '/login'
      }));
      // Google OAuth
      app.get('/login/google', passport.authenticate('google', {
          scope: 'email'
      }));
      app.get('/auth/google/callback', passport.authenticate('google', {
          successRedirect: '/',
          failureRedirect: '/login'
      }));

      // Logout route
      app.get('/logout', function(req, res) {
          req.logout();
          res.redirect('/');
      })
  }



  /**
    This funtion does the post request to the rwth oauth module.
    @param next This is a callback function with one parameter which gets the response object.
  */

  function postreqToL2P(next) {
      var data = querystring.stringify({
          "client_id": config.login.l2p.clientID,
          "scope": config.login.l2p.scope
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
      var postRequest = https.request(post, function(res) {
          res.setEncoding('utf8');
          res.on('data', function(chunk) {
              next(chunk);
          });
      });

      postRequest.write(data);
      postRequest.end();
  }

  function isAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
          return next();
      }
      res.redirect('/login')
  }