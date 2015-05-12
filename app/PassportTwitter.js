/* global process */
var TwitterStrategy = require('passport-twitter').Strategy;
var authConf = require('../config/auth.json');
var User = require('../models/User.js').User;
var logger = require('./Logger.js');

//TODO: Logger work
module.exports = function (passport) {
    
	passport.use(new TwitterStrategy({
		consumerKey :   authConf.twitter.key,
		consumerSecret : authConf.twitter.secret,
		callbackURL : authConf.twitter.callback,
		passReqToCallback : true
	}, function (req, token, refreshToken, profile, done) {
		process.nextTick(function () {
			if (!req.user) {
				logger.info("Twitter login attempt");
				User.findOne({'twitter.id' : profile.id},
	            function (err, user) {
		if (err) {
			return done(err);
		}
				            
		if (user) {
			if (!user.twitter.token) {
				// there is an existing user but the token is not set
				user.twitter.token = token;
				//user.twitter.username = profile.username;
				//user.twitter.displayName = profile.displayName;
				              
				user.save(function (err) {
								if (err) {
									return done(err);
								}
								logger.info("user successfully altered");
								return done(null, user); //success
							});
			}
			return done(null, user); // success
		} else { // we could not find a user
			logger.info("creating a new user");
			var nUser = new User();
				            
			nUser.twitter.id = profile.id;
			nUser.twitter.token = token;
			//nUser.twitter.username = profile.username;
			//nUser.twitter.displayName = profile.displayName;
			nUser.save(function (err) {
							if (err) {
								return done(err);
							}
							logger.info("new user created: " + nUser._id);
							done(null, nUser);
						});
			//created user - success
				                    
		}
		return done(null); //can not be reached. just for reasons of completeness.
	});
			} else {
				// there is already an existing user. Link the data
				var _user = req.user; // pull the user out of the session
				User.findOne({_id : _user._id}, function (err, user) {
					user.twitter.id    = profile.id;
					user.twitter.token = token;
					//user.twitter.username  = profile.username;
					//user.twitter.displayName = profile.displayName;

					user.save(function (err) {
						if (err) {
							return done(err);
						}
						logger.info("added credentials to user: " + user._id);            
						return done(null, user);
					});
				});
			}
		});
	}));
};
