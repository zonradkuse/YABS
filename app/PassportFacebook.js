/** @module Authentication/Facebook */

var FacebookStrategy = require('passport-facebook').Strategy;
var authConf = require('../config/auth.json');

var UserDAO = require('../models/User.js');
var User = UserDAO.User;
var logger = require('./Logger.js');

//TODO: Logger work
module.exports = function (passport) {
	passport.use(new FacebookStrategy({
		clientID: authConf.facebook.clientID,
		clientSecret: authConf.facebook.clientSecret,
		callbackURL: authConf.facebook.callback,
		passReqToCallback: true
	}, function (req, token, refreshToken, profile, done) {
		process.nextTick(function () {
			if (!req.session.user) {
				// user is not logged in.
				logger.info("Facebook login attempt");
				User.findOne({
					'facebook.id': profile.id
				}).populate('avatar').
					exec(
				function (err, user) {
					if (err) {
						return done(err); //error getting facebook id
					}
					if (user) {
						if (!user.facebook.token) {
							// there is an existing user but the token is not set
							user.facebook.token = token;
							//user.facebook.name = profile.name.givenName;
							//user.facebook.email = (profile.emails[ 0 ].value || '').toLowerCase();

							user.save(function (err) {
								if (err) {
									return done(err);
								}
								logger.info("user successfully altered");
								req.session.user = user.toObject();
								return done(null, user); //success
							});
						}
						logger.info("user successfully authenticated");
						req.session.user = user;
						return done(null, user); // success
					} else { // we could not find a user
						// we do not want new users without valid l2p account - at least now.
						return done(new Error("You have no account."));
					}
				});
			} else {
				// there is already an existing user. Link the data
				var _user = req.session.user; // pull the user out of the session

				User.findOne({
					_id: _user._id
				}).populate('avatar').exec( function (err, user) {
					if (err) {
						done(err);
					}
					user.facebook.id = profile.id;
					user.facebook.token = token;
					//user.facebook.name = profile.name.givenName;
					//user.facebook.email = (profile.emails[ 0 ].value || '').toLowerCase();

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

	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});
};
