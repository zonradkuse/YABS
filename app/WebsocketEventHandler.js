var ws = require('./Websocket.js');
var wsFrame = new ws();
    
wsFrame.on('ping', function(wss, ws, session, params, interfaceEntry){
    console.log('whoop, whoop. a ping.');
    ws.send('pong');
});

wsFrame.start();