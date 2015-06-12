/** @module Logger */

var winston = require('winston');
var config = require('../config.json');
winston.emitErrs = true;

var logger = new winston.Logger({
	levels: {
		'info': 1,
		'debug' : 0,
		'warn' : 2,
		'err' : 3,
		'yabs': 42
	},
	colors: {
		'info' : 'green',
		'debug' : 'blue',
		'warn' : 'yellow',
		'err' : 'red',
		'yabs': 'cyan'
	},
	transports: [
        new winston.transports.File({
			level: config.general.loglevelFile ? config.general.loglevelFile : "info",
			filename: './system.log',
			handleExceptions: true,
			json: true,
			maxsize: 5242880, //5MB
			maxFiles: 5,
			colorize: false
		}),
		new winston.transports.Console({
			level: config.general.loglevelConsole ? config.general.loglevelConsole : "debug",
			handleExceptions: true,
			prettyPrint: true,
			//json: false,
			colorize: true
		})
	],
	exitOnError: false
});

module.exports = logger;
module.exports.stream = {
	write: function (message, encoding) {
		logger.info(message);
	}
};
