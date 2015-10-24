function startUp (basedir) {
    var express = require('express');
    var app = express();
    var config = require('../../config.json');
    var morgan = require('morgan');
    var cookieParser = require('cookie-parser');
    var session = require('express-session');
    var bodyParser = require('body-parser');
    var sessionStore = require('connect-redis')(session);
    var compression = require('compression');
    var logger = require('../Logger.js');
    var passport = require('passport');
    var mongoose = require('mongoose');
    var flash = require('connect-flash');

    app.use(morgan('dev', {
        stream: logger.stream
    }));
    app.use(compression({
        threshold: 1024
    }));
    app.disable('etag');
    app.use(cookieParser());
    app.set('trust proxy', 1); // will be needed for production use with nginx
    app.use(session({
        store: new sessionStore(),
        roomId: "",
        accessLevel: 0,
        secret: config.general.cookie.secret,
        cookie: {
            //expires: new Date(Date.now() + 15778463000), // 6 month
            maAge: 15778463000
        },
        resave: true,
        saveUninitialized: true
    }));

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    var routes = require('../Routes.js');
    routes(app);
    routes.routes();
    logger.info('initialized routes!');

    app.use(express.static(basedir + '/public'));



    app.use(function (req, res) {
        // Use res.sendfile, as it streams instead of reading the file into memory.
        res.sendFile(basedir + '/public/index.html');
    });
    require('../Authentication.js')(passport);

    var server = require('http').createServer(app);

    server.listen(config.general.http.port || 8080);
    logger.info('Server now running on ' + config.general.http.port + '.');

    return server;
}

module.exports = startUp;
