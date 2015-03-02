var MainController = require('./MainController.js');
var User = require('../models/User.js');
var logger = require('./Logger.js');
var authConf = require('../config/auth.json');
var LocalStrategy = require('passport-local').Strategy;
var Twitter = require('./PassportTwitter.js');
var Facebook = require('./PassportFacebook.js');
var Google = require('./PassportGoogle.js');
var Github = require('./PassportGithub.js');

// Passport Functionality
module.exports = function(passport) {
    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });
    logger.info("Initialize Google OAuth.")
    Google(passport);
    logger.info("Initialize Facebook OAuth.")
    Facebook(passport);
    logger.info("Initialize Twitter OAuth.")
    Twitter(passport);
    logger.info("Initialize Github OAuth.")
    Github(passport);

}

module.exports.loginLocal = function(req, success, fail) {
    User.User.findOne({
        mail: req.body.email
    }, function(err, user) {
        if (err) fail(err);
        //genereate a token
        if (!user) {
            fail(new Error("User not found or wrong password"));
        } else {
            require('crypto').randomBytes(32, function(ex, buf) {
                var token = buf.toString('hex');
                logger.info('LOGIN: ' + req.body.username + ' ' + token);
                if (user.password === require('crypto').createHash('sha1').update(req.body.password).digest('hex')) {
                    req.session.sessionId = token;
                    success(null, user);
                } else {
                    fail(new Error("User not found or wrong password"));
                }
            });
        }
    });


}

module.exports.registerLocal = function(req, next) {
    //perform checks
    if (req.body === undefined) {
        next(new Error('request object undefined'));
    } else if (req.body.username === undefined) {
        next(new Error('username undefined'));
    } else if (req.body.email === undefined) {
        next(new Error('email undefined'));
    } else if (req.body.password === undefined) {
        next(new Error('password is undefined'));
    }
    User.User.findOne({
        mail: req.body.email
    }, function(err, user) {
        if (err) next(err);
        if (!req.user) { //not logged in
            if (!user) {
                //the user with this mail address is not existing
                var _user = new User.User({
                    name: req.body.username,
                    mail: req.body.email,
                    password: require('crypto').createHash('sha1').update(req.body.password).digest('hex')
                });
                _user.save(function(err) {
                    if (err) next(err);
                    logger.info('successfully created user ' + _user.name);
                    next(null, user);
                });
            } else {
                next(new Error("E-Mail already taken."))
            }
        } else {
            //logged in - get user and edit it (do not! create an new one)
            // TODO
                var _user = new User.User({
                    name: req.body.username,
                    mail: req.body.email,
                    password: require('crypto').createHash('sha1').update(req.body.password).digest('hex')
                });
                _user.save(function(err) {
                    if (err) next(err);
                    logger.info('successfully created user ' + _user.name);
                    next(null, user);
                });
        }

    })
}

