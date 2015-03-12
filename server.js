var express = require('express');
var app = express();
var config = require('./config.json');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var sessionStore = require('connect-redis')(session);
var config = require('./config.json');
var fs = require('fs');
var compression = require('compression');
var logger = require('./app/Logger.js');
var passport = require('passport');
var mongoose = require('mongoose');
var flash = require('connect-flash');

mongoose.connect(config.database.host)
    /*
     * Initiate Express.js Webserver with
     *  default sessioncookie
     *  /public static file provider
     */
app.use(morgan('dev', {
    stream: logger.stream
}));
app.use(compression({
    threshold: 1024
}));
app.use(cookieParser());
//app.set('trust proxy', 1); // will be needed for production use with nginx
app.use(session({
    store: new sessionStore(),
    sessionId: "",
    secret: config.general.cookie.secret,
    cookie: {
        expires: 1000 * 3600,
        httpOnly: false
    },
    resave: false,
    saveUninitialized: true
}));

app.use(express.static(__dirname + '/public', {
    maxAge: 86400000
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
/* TODO var db = require('./app/DatabaseConnection.js').pool; */
var routes = require('./app/Routes.js');
routes(app);
routes.routes();
logger.info('initialized routes!');

var auth = require('./app/Authentication.js')(passport);

/*
 *   Start the real server. If ssl is enabled start it too! http should not be used!
 */
var server = require('http').createServer(app);
if (config.general.https) {
    var https = require('https');
    https.createServer({
        "key": fs.readFileSync(config.general.https.key),
        "cert": fs.readFileSync(config.general.https.crt)
    }, app).listen(config.general.https.port);
    logger.info('Server now running on ssl ' + config.general.https.port + '!');
}

server.listen(config.general.http.port || 8080);
logger.info('Server now running on ' + config.general.http.port + '!');
module.exports.app = server;
var ws = require('./app/WebsocketEventHandler.js'); //initialise websocket event handlers