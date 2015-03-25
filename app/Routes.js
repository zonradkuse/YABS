  /*! Module to handle all incoming htpp requests. WebSocketRequests are handled in app/WebsocketAPI
         
         */
  var passport = require('passport');
  var querystring = require('querystring');
  var config = require('../config.json');
  var logger = require('./Logger.js');
  var roomDAO = require('../models/Room.js');
  var adminkey = "wurstbrot";
  var roles = require('../config/UserRoles.json');
  var upgrade = require('./AccountUpgrade.js');
  var fileup = require('./FileUpload.js');
  var app;

  module.exports = function(pExpressApp) {
    app = pExpressApp;
  };


  module.exports.routes = function() {
    // route uploads
    fileup(app);
    // route account upgrades
    upgrade(app);
    
    app.post('/login/local', function(req, res) {
      var auth = require('./Authentication.js');
      auth.loginLocal(req, function(err, user) {
        req.flash('message', 'Welcome' + res.name);
        req.session.user = user;
        res.redirect("/sessiontest");
      }, function(err) {
        req.flash('message', err);
        res.redirect("/");
      });
    });

    app.post('/register/local', function(req, res) {
      var auth = require('./Authentication.js');
      auth.registerLocal(req, function(err, user) {
        if (err) {
          req.flash('message', '' + err);
          res.redirect('/sessiontest');
        } else {
          req.flash('message', '' + err);
          req.session.user = user;
          res.redirect('/');
        }

      });
    });

    /** A short sessiontest
     */
    app.get('/sessiontest', function(req, res, next) {
      var sess = req.session;
      if (!sess) {
        res.redirect('/');
      } else {
        res.setHeader('Content-Type', 'text/html');
        res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's (' + (sess.cookie.maxAge / 60 / 1000) + ' min or ' +
          (sess.cookie.maxAge / (60 * 60 * 1000)) + 'h or ' + (sess.cookie.maxAge / (60 * 60 * 24 * 1000)) + 'd)</p>');
        res.write('<p>logged in with Session: ' + JSON.stringify(sess) + '<p>');
        res.write('<p>Your User Information: ' + JSON.stringify(sess.user) + '</p>');
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
        }
        res.end();
      }
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
    
  };

  function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login')
  }