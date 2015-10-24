/**
 * We provide different loglevels. Instead of console.log() use logger.debug(). If the debug level is configured this
 * output will be shown. <br>
 * Output will be printed to console/file iff. loglevel >= config.general.loglevel*
 * <br>  <br>
 * Possible transports are: <br>
 * <table>
 * <tr><td>transport</td>         <td>loglevel<td></tr>
 * <tr><td>debug</td>             <td>0<td></tr>
 * <tr><td>info</td>              <td>1<td></tr>
 * <tr><td>warn</td>              <td>2<td></tr>
 * <tr><td>err</td>               <td>3<td></tr>
 * <tr><td>yabs</td>              <td>42<td></tr>
 *</table>
 * @module Misc/Logger
 * @example
 * var logger = require("Logger.js") // remember specifying the correct path.
 * logger.debug("42");
 * logger.info("test");
 * // ...
 * logger.yabs("")
 */

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
			filename: './logs/system.log',
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
	write: function (message) {
		logger.info(message);
	}
};
