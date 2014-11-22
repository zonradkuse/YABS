var redis = require('node-redis');

var mysql = require('mysql');
var config = require('../config.json');
var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : config.database.host,
  user            : config.database.user,
  password        : config.database.password,
  database        : config.database.db
});

module.exports = pool;