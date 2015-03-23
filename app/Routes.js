  /*! Module to handle all incoming htpp requests. WebSocketRequests are handled in app/WebsocketAPI
         
         */
  var passport = require('passport');
  var querystring = require('querystring');
  var config = require('../config.json');
  var logger = require('./Logger.js');
  var roomDAO = require('../models/Room.js');
  var adminkey = "wurstbrot";
  var modkey = "käsebrötchen";
  var roles = require('../config/UserRoles.json');
  var app;
  var nodemailer = require('nodemailer');
  var addresses = require('../config/mails.json').data
   
  // create reusable transporter object using SMTP transport 
  var transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
          user: 'noreply.yabs@gmail.com',
          pass: 'a1b2c3d4$'
      }
  });
   
   
  // setup e-mail data with unicode symbols 
  var mailOptions = {
      from: 'YABS <yabs@gmail.com>', 
      to: '', 
      subject: 'YABS admin access',
      text: '',
  };

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
      console.log(JSON.stringify(req.files, null, 2));
      if (req.files.image === undefined)
        res.write('<p>No file selected</p>');
      else
        res.write('<p>File <b>' + req.files.image.originalname + '</b> uploaded!</p>');
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
    
    /**
     *
     * ONLY UNTIL L2P ROLE MANAGEMENT IS FIXED
     *
     **/
    app.get('/roles/admin/:roomId', function (req, res){
      if (req.session && req.session.user) {
        res.setHeader('Content-Type', 'text/html');
        res.write('   </form>Please enter your mailadress to upgrade your account \
                      <form action="/roles/admin/' + req.params.roomId +  '" method="post"> \
                      E-Mail:<br> \
                      <input type="text" name="email" value="Email"> \
                      <br> \
                      <input type="submit" value="Submit"> \
                      </form>');
      } else {
        res.write('you are not logged in.')
      }
      res.end();
    });

    app.post('/roles/admin/:roomId', function(req, res){
      if(req.params.roomId && req.body.email) {
        roomDAO.getByID(req.params.roomId, {population : ''}, function(err, room){
          if(err) res.write(err.message);
          if(room) {
            //room exists send mail
            if(addresses.indexOf(req.body.email) > -1) {
              var hash = require('crypto').createHash('sha1').update(req.params.roomId + adminkey + req.session.user._id).digest('hex');
              mailOptions.text = "Please visit: http://" + config.general.domain + ':8080/roles/admin/' + req.params.roomId + '/' + hash;
              mailOptions.to = req.body.email;
              transporter.sendMail(mailOptions, function(error, info){
                  if(error){
                      res.write("An error occured! This has been reported.")
                      logger.err(err);
                  }else{
                      res.write('Message sent: ' + info.response);
                  }
                  res.end(); 
              });
            } else {
              res.send("Your address is not listed. Please contact johannes.neuhaus [at] rwth-aachen.de");
              res.end();
            }
          } else {
            res.write(err.message);
            res.end();
          }
        });
      } else {
        res.write("missing parameters")
        res.end();
      }
    });
    
    app.get('/roles/admin/:roomId/:key', function(req, res){
        if(req.params.roomId && req.params.key && req.session.user) {
            roomDAO.getByID(req.params.roomId, {population : ''}, function(err, room){
                if (err) {
                    res.write(err.message);
                } else {
                    
                    if(req.params.key == require('crypto').createHash('sha1').update(req.params.roomId + adminkey + req.session.user._id).digest('hex')){
                        //set access right
                        if(req.session.rights) {
                          req.session.user.rights.push({roomId : req.params.roomId, accessLevel: roles.defaultAdmin});
                        } else {
                          req.session.user.rights = [{roomId : req.params.roomId, accessLevel: roles.defaultAdmin}];
                        }
                        res.write("success");
                    } else {
                        res.write("bad key");
                    }
                }
                res.end();
            });
        } else {
            res.write("Missing Field.");
            res.end();
        }
        
    });
    
    app.post('/roles/mod/:roomId', function(req, res){
        if(req.params.roomId && req.body.key) {
            roomDAO.getByID(req.params.roomId, {population : ''}, function(err, room){
                if (err) {
                    res.write(err.message);
                } else {
                    if(req.body.key == require('crypto').createHash('sha1').update(req.params.roomId + modkey).digest('hex')){
                        //set access right
                        req.session.rights.push({roomId : roles.defaultMod});
                        res.write("success");
                    } else {
                        res.write("bad key");
                    }
                }
                res.end();
            });
        } else {
            res.write("Missing Field.");
            res.end();
        }
        
    });
  };

  function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login')
  }