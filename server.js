var express = require('express');
var app = express();
var morgan = require('morgan');
app.use(morgan('dev'));
app.use(express.static(__dirname + '/public'))

var db = require('./app/DatabaseConnection.js').pool;

console.log('Now running on 8080!')
app.listen(8080);