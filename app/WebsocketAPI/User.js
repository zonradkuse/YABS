var system = require('./System.js');
var userDAO = require('../../models/User.js');

module.exports = function(wsControl){
    wsControl.on('user:fetchRooms', function(wss, ws, session, params, interfaceEntry, refId, sId){
            if(session.user && session.user._id){
                var worker = system.getWorkerMap().sId;
                if(worker){
                    worker.fetchRooms(refId);
                } else {
                    wsControl.build(ws, new Error("Your worker is invalid."), null, refId);
                }
            } else {
                wsControl.build(ws, new Error("Your session is invalid."), null, refId);
            }
    });
    
    wsControl.on('user:getRooms', function(wss, ws, session, params, interfaceEntry, refId, sId){
            if(session.user && session.user._id){
                //query for user rooms
            } else {
                wsControl.build(ws, new Error("Your session is invalid."), null, refId);
            }
    });
};