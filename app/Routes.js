/*! Module to handle all incoming htpp requests. WebSocketRequests are handled in app/WebsocketAPI */

var passiveL2PAuth = require('./RWTH/Authentication/Passive.js');
var passport = require('passport');
var config = require('../config.json');
var logger = require('./Logger.js');
var userDAO = require('../models/User.js');
var roles = require('../config/UserRoles.json');
var upgrade = require('./AccountUpgrade.js');
var fileup = require('./FileUpload.js');
var fs = require('fs');
var path = require('path');
var app;

module.exports = function (pExpressApp) {
    app = pExpressApp;
};


module.exports.routes = function () {
    app.get('/', function (req, res, next) { // this was formerly /login - as the iframe connects to /, the parameters are passed to /
        var course = req.query.courseId;
        var token = req.query.accessToken;
        logger.debug("Course: " + course + " with Token: " + token);
        if (course && token) {
            var authReq = new passiveL2PAuth(token, room, function () {

            });

            authReq.process();
        } else {
            next();
        }
        //if parameters are set, log in (set cookies, generate everything) -> redirect to room
    });

    // route uploads
    fileup(app);
    // route account upgrades - deprecated
    upgrade(app);

    /**
     * A short sessiontest
     */
    app.get('/sessiontest', function (req, res, next) {
        var sess = req.session;
        if (!sess || !config.general.env.dev) {
            res.redirect('/404');
        } else {
            res.setHeader('Content-Type', 'text/html');
            res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's (' + (sess.cookie.maxAge / 60 / 1000) + ' min or ' +
                (sess.cookie.maxAge / (60 * 60 * 1000)) + 'h or ' + (sess.cookie.maxAge / (60 * 60 * 24 * 1000)) + 'd)</p>');
            res.write('<p>logged in with Session: ' + JSON.stringify(sess) + '<p>');
            res.write('<p>Your User Information: ' + JSON.stringify(sess.user) + '</p>');
            res.end();
        }
    });

    // Facebook OAuth
    if (config.login.other.enabled) {
        app.get('/login/facebook', passport.authenticate('facebook', {
            scope: 'email'
        }));
        app.get('/auth/facebook/callback', passport.authenticate('facebook', {
            successRedirect: '/dashboard',
            failureRedirect: '/login'
        }));
        // Twitter OAuth
        app.get('/login/twitter', passport.authenticate('twitter'));
        app.get('/auth/twitter/callback', passport.authenticate('twitter', {
            successRedirect: '/dashboard',
            failureRedirect: '/login'
        }));
        // GitHub OAuth
        app.get('/login/github', passport.authenticate('github', {
            scope: 'user'
        }));
        app.get('/auth/github/callback', passport.authenticate('github', {
            successRedirect: '/dashboard',
            failureRedirect: '/login'
        }));
        // Google OAuth
        app.get('/login/google', passport.authenticate('google', {
            scope: 'email'
        }));
        app.get('/auth/google/callback', passport.authenticate('google', {
            successRedirect: '/dashoboard',
            failureRedirect: '/login'
        }));
    }

    app.get('/images/*/*', function (req, res) {
        if (req.session && req.session.user && req.session.user._id) {
            fs.exists(path.resolve(__dirname + '/../' + req.originalUrl), function (exists) {
                if (exists) {
                    res.sendFile(path.resolve(__dirname + '/../' + req.originalUrl));
                } else {
                    res.status(404);
                    res.end();
                }
            });
        } else {
            logger.debug("unauthorized media access: " + req.session);
            res.status(404);
            res.end();
        }
    });

};
