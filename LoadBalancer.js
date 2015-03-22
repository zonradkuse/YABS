var cluster = require('cluster');

if(cluster.isMaster) {
    for(var i = 2; i > 0; i--){
        cluster.fork();
    }
} else {
    var app = require('./server.js');
}