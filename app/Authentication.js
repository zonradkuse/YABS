var MainController = require('./MainController.js');
var UserModel = require('../models/User.js');
var logger = require('./Logger.js');

exports.loginLocal = function(req, success, fail) {


    //genereate a token
    require('crypto').randomBytes(32, function(ex, buf) {
        var token = buf.toString('hex');
        logger.info('LOGIN: ' + req.body.username + ' ' + token);
        req.session.sessionId = token;
        success();
    });
}

exports.registerLocal = function(req, res, next) {
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
    var _user = new UserModel.User({
        name: req.body.username,
        mail: req.body.email,
        password: require('crypto').createHash('sha1').update(req.body.password).digest('hex')
    });
    _user.save(function(err) {
        if (err) next(err);
        logger.info('successfully created user ' + _user.name);
        next(null, res);
    })
}