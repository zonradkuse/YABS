var FacebookStrategy = require('passport-facebook').Strategy;
var authConf = require('../config/auth.json');

var User = require('../models/User.js').User;
var logger = require('./Logger.js');

//TODO: Logger work
module.exports = function(passport) {
    passport.use(new FacebookStrategy({
        clientID: authConf.facebook.clientID,
        clientSecret: authConf.facebook.clientSecret,
        callbackURL: authConf.facebook.callback,
        passReqToCallback: true
    }, function(req, token, refreshToken, profile, done) {
        process.nextTick(function() {
            if (!req.user) {
                logger.info("Facebook login attempt")
                User.findOne({
                        'facebook.id': profile.id
                    },
                    function(err, user) {
                        logger.info("break 1");
                        if (err) return done(err);
                        logger.info("write user to database")
                        if (user) {
                            logger.info("break 2");
                            if (!user.facebook.token) {
                                // there is an existing user but the token is not set
                                user.facebook.token = token;
                                user.facebook.name = profile.name.givenName;
                                user.facebook.email = (profile.emails[0].value || '').toLowerCase();

                                user.save(function(err) {
                                    if (err) return done(err);
                                    logger.info("user successfully altered")
                                    return done(null, user); //success
                                });
                            }
                            logger.info("user successfully authenticated")
                            return done(null, user); // success
                        } else { // we could not find a user
                            logger.info("creating a new user")
                            var nUser = new User();
                            logger.info("new user created: " + nUser);
                            nUser.facebook.id = profile.id;
                            nUser.facebook.token = token;
                            nUser.facebook.name = profile.name.givenName;
                            nUser.facebook.email = (profile.emails[0].value || '').toLowerCase();
                            nUser.save(function(err) {
                                    if (err) return done(err);
                                    logger.info("successfully saved user")
                                    done(null, nUser);
                                })
                                //created user - success
                        }
                    })
            } else {
                // there is already an existing user. Link the data
                var _user = req.user; // pull the user out of the session
                logger.info(_user._id);
                User.findOne({
                    _id: _user._id
                }, function(err, user) {
                    if (err) done(err);
                    user.facebook.id = profile.id;
                    user.facebook.token = token;
                    user.facebook.name = profile.name.givenName;
                    user.facebook.email = (profile.emails[0].value || '').toLowerCase();

                    user.save(function(err) {
                        if (err) return done(err);
                        return done(null, user);
                    });
                });

            }
        });
    }));

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
}