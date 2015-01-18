var express = require('express');
var app = express();
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser   = require('body-parser');
var sessionStore = require('connect-redis')(session);
var config = require('./config.json');
var fs = require('fs');
var compression = require('compression');
var logger = require('./app/Logger.js');
var Thread = require('./models/Thread.js');
var Question = require('./models/Question.js');


//var expressWinston = require('express-winston');

// TODO auslagern in eigene testsuite??
/*var t = new Thread();
for(i=0; i<10; i++)
	t.addQuestion(new Question(i,i%3,i));
filters = { 
   "id": function(prop){
      if(prop == 0 || prop == 5) return true; 
      return false;
   }};
var res = t.filterProp(filters);

console.log("[TEST Thread] Number of Questions after filter: " + res.length);*/


/*
* Initiate Express.js Webserver with
*  default sessioncookie
*  /public static file provider
*/
app.use(morgan('default', {stream: logger.stream}));
app.use(compression({
  threshold: 1024
}));
app.use(cookieParser());
//app.set('trust proxy', 1); // will be needed for production use with nginx
app.use(session({
   store : new sessionStore(),
   sessionId: "",
   secret:"schalala",
   cookie: { 
     maxAge: 8035200000 //about 3 month
   },
   resave: true,
   saveUninitialized: true
}));

app.use(express.static(__dirname + '/public', { maxAge: 86400000}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* TODO var db = require('./app/DatabaseConnection.js').pool; */
var routes = require('./app/Routes.js');
routes(app);
routes.routes();
logger.info('initialized routes!');

//var auth = require('./app/Authentication.js')(passport, LocalStrategy, db);  // TODO: Replace this?

/*
*   Start the real server. If ssl is enabled start it too! http should not be used!
*/
var server = require('http').createServer(app);
if (config.general.https){
   var https = require('https');
   https.createServer({
      "key" : fs.readFileSync(config.general.https.key),
      "cert" : fs.readFileSync(config.general.https.crt)
   }, app).listen(config.general.https.port);
   logger.info('Server now running on ssl ' + config.general.https.port + '!');
}

server.listen(config.general.http.port || 8080);
logger.info('Server now running on ' + config.general.http.port + '!');
module.exports.app = app;
var Websocket = require('./app/Websocket.js')(server);