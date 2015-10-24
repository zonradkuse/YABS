function init(basedir) {
    var fs = require('fs');
    fs.mkdir(basedir + '/images', function (err) { });
    fs.mkdir(basedir + '/logs', function (err) { });
}

module.exports = init;
