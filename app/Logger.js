var winston = require('winston');
winston.emitErrs = true;

var logger = new winston.Logger({
    levels: {
        'info': 0,
        'debug' : 1,
        'warn' : 2,
        'err' : 3
    },
    colors: {
        'info' : 'green',
        'debug' : 'blue',
        'warn' : 'yellow',
        'err' : 'red'
    },
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: './system.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.Console({
            //level: 'debug',
            handleExceptions: true,
            //json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding) {
        logger.info(message);
    }
};