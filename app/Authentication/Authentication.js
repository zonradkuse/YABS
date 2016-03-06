/** @module Authentication/Local */

var User = require('../../models/User.js');
var logger = require('./../Logger.js');
var conf = require('../../config.json');
var Twitter = require('./PassportTwitter.js');
var Facebook = require('./PassportFacebook.js');
var Google = require('./PassportGoogle.js');
var Github = require('./PassportGithub.js');

module.exports = function (passport) {
	passport.serializeUser(function (user, done) {
		done(null, user);
	});

	passport.deserializeUser(function (obj, done) {
		done(null, obj);
	});
	if (conf.login.other.enabled) {
		logger.info("Initialize Google OAuth.");
		Google(passport);
		logger.info("Initialize Facebook OAuth.");
		Facebook(passport);
		logger.info("Initialize Twitter OAuth.");
		Twitter(passport);
		logger.info("Initialize Github OAuth.");
		Github(passport);
	}

};

 /** Local login.
 * @param {String} mail
 * @param {String} pw
 * @param {successCallback} success - callback if success
 * @param {failCallback} fail - callback if fail
 */
module.exports.loginLocal = function (mail, pw, success, fail) {
	User.User.findOne({
		'local.mail': mail
	}, function (err, user) {
		if (err) {
			return fail(err);
		}
		//genereate a token
		if (!user) {
			return fail(new Error("User not found or wrong password"));
		} else {
			logger.info('local login of: ' + mail);
			if (user.local.password === require('crypto').createHash('sha256').update(pw).digest('hex')) {
				return success(null, user);
			} else {
				return fail(new Error("User not found or wrong password"));
			}
		}
	});
};

/**
 * Register user locally.
 * @param {String} name - user name
 * @param {String} password
 * @param {String} email
 * @param {nextCallback} next - callback function
 */
module.exports.registerLocal = function (name, password, email, next) {
	//perform checks
	if (arguments.length < 4) {
		return next(new Error('Not enough arguments'));
	} else if (name === undefined) {
		return next(new Error('username undefined'));
	} else if (email === undefined) {
		return next(new Error('email undefined'));
	} else if (password === undefined) {
		return next(new Error('password is undefined'));
	}
	User.User.findOne({
		'local.mail' : email
	}, function (err, user) {
		if (err) {
			return next(err);
		}
		if (!user) {
			//the user with this mail address is not existing
			var _user = new User.User({
				'local.name': name,
				'local.mail': email,
				// hash the password.
				'local.password': require('crypto').createHash('sha256').update(password).digest('hex')
			});
			_user.save(function (err) {
				if (err) {
					return next(err);
				}
				logger.info('successfully created user ' + _user.local.name);
				return next(null, _user);
			});
		} else {
			return next(new Error("E-Mail already taken."));
		}
	});
};

/**
 * @callback successCallback
 * @param {Error} err - if an error occurs
 * @param {User} user - user object
 */

 /**
 * @callback failCallback
 * @param {Error} err - occured error
 */

 /**
 * @callback nextCallback
 * @param {Error} err - if an error occurs
 * @param {User} user - user object
 */
