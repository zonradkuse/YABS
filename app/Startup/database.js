function init () {
    var config = require('../../config.json');
    var mongoose = require('mongoose');
    mongoose.connect(config.database.host);
}

module.exports = init;