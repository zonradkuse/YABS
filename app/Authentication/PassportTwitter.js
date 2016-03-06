/** @module Authentication/Twitter */

var TwitterStrategy = require('passport-twitter').Strategy;
var authConf = require('../../config/auth.json');
var User = require('../../models/User.js').User;
var logger = require('./../Logger.js');

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
				User.findOne({'twitter.id' : profile.id}).populate('avatar').
					exec(
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
								logger.debug("user successfully altered");
								req.session.user = user.toObject();
								return done(null, user); //success
							});
						}
						req.session.user = user.toObject();
						return done(null, user); // success
					} else { // we could not find a user
						// new users via 3rd party oauth is not allowed
						return done(new Error("You did not authorize with L2P yet"));
					}
					return done(null); //can not be reached. just for reasons of completeness.
				});
			} else {
				// there is already an existing user. Link the data
				var _user = req.user; // pull the user out of the session
				User.findOne({_id : _user._id}).populate('avatar').
					exec( function (err, user) {
					user.twitter.id    = profile.id;
					user.twitter.token = token;
					//user.twitter.username  = profile.username;
					//user.twitter.displayName = profile.displayName;

					user.save(function (err) {
						if (err) {
							return done(err);
						}
						logger.info("added credentials to user: " + user._id);
						req.session.user = user.toObject();
						return done(null, user);
					});
				});
			}
		});
	}));
};
