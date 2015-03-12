module.exports = function(wsControl){
    wsControl.on('system:ping', function(wss, ws, session, params, interfaceEntry){
        ws.send('pong');
    });
};