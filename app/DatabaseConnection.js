var mysql = require('mysql');

var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'test',
  password        : 'test',
  database        : 'auth'
});

module.exports = pool;