var GithubStrategy = require('passport-github').Strategy;
var authConf = require('../config/auth.json');
var User = require('../models/User.js').User;
var logger = require('./Logger.js');

//TODO: Logger work
module.exports = function(passport) {
    passport.use(new GithubStrategy({
        clientID: authConf.github.key,
        clientSecret: authConf.github.secret,
        callbackURL: authConf.github.callback,
        passReqToCallback: true
    }, function(req, token, refreshToken, profile, done) {

        process.nextTick(function() {
            if (!req.user) {
                logger.info("Github login attempt");
                User.findOne({
                        'github.id': profile.id
                    },
                    function(err, user) {
                        if (err) return done(err); //error getting github id
                        if (user) {
                            if (!user.github.token) {
                                // there is an existing user but the token is not set
                                user.github.token = token;
                                user.github.name = profile.name;
                                user.github.email = (profile.email || '').toLowerCase();

                                user.save(function(err) {
                                    if (err) return done(err);
                                    logger.info("user successfully altered");
                                    return done(null, user); //success
                                });
                            }
                            logger.info("user successfully authenticated");
                            return done(null, user); // success
                        } else { // we could not find a user
                            logger.info("creating a new user");
                            var nUser = new User();
                            
                            nUser.github.id = profile.id;
                            nUser.github.token = token;
                            nUser.github.name = profile.name;
                            nUser.github.email = (profile.email || '').toLowerCase();
                            nUser.save(function(err) {
                                    if (err) return done(err);
                                    logger.info("new user created: " + nUser._id);
                                    done(null, nUser);
                                });
                                //created user - success
                        }
                    });
            } else {
                // there is already an existing user. Link the data
                var _user = req.user; // pull the user out of the session

                User.findOne({
                    _id: _user._id
                }, function(err, user) {
                    if (err) done(err);
                    user.github.id = profile.id;
                    user.github.token = token;
                    user.github.name = profile.name;
                    user.github.email = (profile.email || '').toLowerCase();

                    user.save(function(err) {
                        if (err) return done(err);
                        logger.info("added credentials to user: " + user._id);
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
};