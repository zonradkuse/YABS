  /*! Module to handle all incoming htpp requests. WebSocketRequests are handled in app/WebsocketAPI

    */
  var passport = require('passport');
  var querystring = require('querystring');
  var config = require('../config.json');
  var logger = require('./Logger.js');
  var mainController = require('./MainController.js');
  var app;


  module.exports = function(pExpressApp) {
      app = pExpressApp;
  };


  module.exports.routes = function() {

      app.get('/upload', function(req, res) {
          res.setHeader('Content-Type', 'text/html');
          res.write('image upload \
                      <form action="/upload" method="post" enctype="multipart/form-data"> \
                      File:<br> \
                      <input type="file" name="image" value="Your File..."> \
                      <br><br> \
                      <input type="submit" value="Submit"> \
                      </form>');
          res.end();
      });

      app.post('/upload', function(req, res) {
          console.log(JSON.stringify(req.files,null,2));
          if(req.files.image === undefined)
            res.write('<p>No file selected</p>');
          else
            res.write('<p>File <b>'+req.files.image.originalname+'</b> uploaded!</p>');
          res.end();
      });

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
                if(err){
                    req.flash('message', '' + err);
                    res.redirect('/sessiontest');
                }else{
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
          if(!sess) {
            res.redirect('/');
          } else {
              res.setHeader('Content-Type', 'text/html');
              res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's (' + (sess.cookie.maxAge / 60 / 1000) + ' min or ' +
               (sess.cookie.maxAge / (60 * 60 * 1000)) + 'h or ' + (sess.cookie.maxAge / ( 60 * 60 * 24 * 1000)) + 'd)</p>');
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


      app.get('/course/*', function(req, res, next) {
          var fs = require('fs');
          var path = require('path');
          fs.exists(path.resolve(__dirname, '../', req.originalUrl), function(exists) {
              if (!exists)
                  res.sendFile(path.resolve(__dirname, '../', 'public/index.html'));
          });
      });
      // Courseadmin is for demo only, will be integrated into course
      app.get('/courseadmin/*', function(req, res, next) {
          var fs = require('fs');
          var path = require('path');
          fs.exists(path.resolve(__dirname, '../', req.originalUrl), function(exists) {
              if (!exists)
                  res.sendFile(path.resolve(__dirname, '../', 'public/index.html'));
          });
      });

      app.get('/login', function(req, res, next) {
          var fs = require('fs');
          var path = require('path');
          fs.exists(path.resolve(__dirname, '../', req.originalUrl), function(exists) {
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
  }

  function isAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
          return next();
      }
      res.redirect('/login')
  }