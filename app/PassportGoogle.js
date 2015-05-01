/* global process */
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var authConf = require('../config/auth.json');
var User = require('../models/User.js').User;
var logger = require('./Logger.js');

//TODO: Logger work
module.exports = function(passport) {

    passport.use(new GoogleStrategy({
        clientID: authConf.google.key,
        clientSecret: authConf.google.secret,
        callbackURL : authConf.google.callback,
        passReqToCallback: true
    }, function(req, token, refreshToken, profile, done) {
        process.nextTick(function() {
            logger.info("google OAuth request.");
            if (!req.user) {
                User.findOne({
                        'google.id': profile.id
                    },
                    function(err, user) {
                        if (err) return done(err);
                        if (user) {
                            if (!user.google.token) {
                                // there is an existing user but the token is not set
                                user.google.token = token;
                                user.google.name = profile.name.givenName;
                                user.google.email = (profile.emails[0].value || '').toLowerCase();

                                user.save(function(err) {
                                    if (err) return done(err);
                                    logger.info("successful authentication. Altered User info of " + user._id);
                                    return done(null, user); //success
                                });
                            }
                            return done(null, user); // success
                        } else { // we could not find a user
                            var nUser = new User();

                            nUser.google.id = profile.id;
                            nUser.google.token = token;
                            nUser.google.name = profile.name.givenName;
                            nUser.google.email = (profile.emails[0].value || '').toLowerCase();
                            nUser.save(function(err) {
                                    if (err) return done(err);
                                    logger.info("successful authentication. created new User: " + user._id);
                                    done(null, nUser);
                                });
                                //created user - success

                        }
                        
                    });
            } else {
                // there is already an existing user. Link the data
                var _user = req.user; // pull the user out of the session
                User.findOne({_id: _user._id}, function(err, user){
                    user.google.id = profile.id;
                    user.google.token = token;
                    user.google.name = profile.name.givenName;
                    user.google.email = (profile.emails[0].value || '').toLowerCase();

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