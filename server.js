require("./app/Startup/filesystemDependencies.js")(__dirname);

var logger = require('./app/Logger.js');

logger.yabs("\n" +
".----------------.  .----------------.  .----------------.  .----------------. \n " +
"| .--------------. || .--------------. || .--------------. || .--------------. | \n " +
"| |  ____  ____  | || |      __      | || |   ______     | || |    _______   | | \n " +
"| | |_  _||_  _| | || |     /  \\     | || |  |_   _ \\    | || |   /  ___  |  | | \n " +
"| |   \\ \\  / /   | || |    / /\\ \\    | || |    | |_) |   | || |  |  (__ \\_|  | | \n " +
"| |    \\ \\/ /    | || |   / ____ \\   | || |    |  __'.   | || |   '.___`-.   | | \n " +
"| |    _|  |_    | || | _/ /    \\ \\_ | || |   _| |__) |  | || |  |`\\____) |  | | \n " +
"| |   |______|   | || ||____|  |____|| || |  |_______/   | || |  |_______.'  | | \n " +
"| |              | || |              | || |              | || |              | | \n " +
"| '--------------' || '--------------' || '--------------' || '--------------' | \n " +
"'----------------'  '----------------'  '----------------'  '----------------' \n" +
"\n \n" +
"Scotty, beam me up! \n");

process.on('uncaughtException', function (err) {
	process.exit(1)
});

var webserver = require("./app/Startup/webserver.js")(__dirname);
var wss = require('./app/Websocket/server.js')(webserver);
require('./app/WebsocketEventHandler.js')(wss);
require("./app/Startup/database.js")();

logger.yabs("We are online!");
