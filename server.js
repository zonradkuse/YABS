var express = require('express');
var app = express();
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser   = require('body-parser');
var msql = require('mysql');


var Thread = require('./models/Thread.js');
var Question = require('./models/Question.js');

var t = new Thread();
for(i=0; i<10; i++)
	t.addQuestion(new Question(i,i));
filters = { "id":function(prop){ if(prop == 0 || prop == 5) return true; return false;}};
			/*"content":function(prop){ if(prop == 5) return true; return false;} };*/
var res = t.filterProp(filters);

console.log(res.length);




app.use(morgan('dev'));
app.use(cookieParser());
//app.set('trust proxy', 1); // will be needed for production use with nginx
app.use(session({
  sessionId: "",
  secret:"schalala",
  cookie: { 
    maxAge: 8035200000 //about 3 month
  },
  resave: true,
  saveUninitialized: true
}));

app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var db = require('./app/DatabaseConnection.js').pool;
var routes = require('./app/Routes.js')(app);
//var auth = require('./app/Authentication.js')(passport, LocalStrategy, db);  // TODO: Replace this?

console.log('Now running on 8080!')

app.listen(8080);