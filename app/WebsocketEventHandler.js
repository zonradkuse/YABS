var ws = require('./Websocket.js');
var wsFrame = new ws();

// set all event handlers
require('./WebsocketAPI/System.js')(wsFrame);
require('./WebsocketAPI/Room.js')(wsFrame);
require('./WebsocketAPI/User.js')(wsFrame);
require('./WebsocketAPI/Question.js')(wsFrame);
require('./WebsocketAPI/Mod.js')(wsFrame);
require('./WebsocketAPI/Poll.js')(wsFrame);

wsFrame.start();
