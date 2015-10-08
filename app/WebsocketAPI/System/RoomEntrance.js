var session = require('express-session');
var sessionStore = require('connect-redis')(session);
sessionStore = new sessionStore();
var panicDAO = require('../../Panic.js');
var userWorker = require('../../UserWorker.js');

module.exports = function (wsControl, workerMap) {

	wsControl.on("system:enterRoom", function (req, res) {
		if (req.authed && req.params.roomId !== undefined) {
            if (!workerMap[ req.sId ]) {
                var worker = new userWorker(req.sId, req.session.user, req.ws, req.session.user, wsControl, true);
                worker.session = req.session;
                workerMap[ req.sId ] = worker;
                worker.fetchRooms(function () {
                    worker.getRooms();
                });
            }
            var oldRoom = workerMap[ req.sId ].session.room;
            workerMap[ req.sId ].session.room = req.params.roomId;
			sessionStore.set(req.sId, workerMap[ req.sId ].session, function (err) {
				if (err) {
					wsControl.build(req.ws, err, null, req.refId);
				} else {
					var broadcastOld = function () {
						if (isNaN(oldRoom)) { 
							req.wss.getActiveUsersByRoom(oldRoom, function (err, count) {
								if (!err) {
									res.roomBroadcastAdmins(oldRoom, "room:userCount", {
										roomId : oldRoom,
										count : count
									});
								} else {
									logger.warn(err);
								}
							});
						}
					};
					if (req.params.roomId == 1) {
						wsControl.build(req.ws, null, {
							status: true
						});
						broadcastOld();
					} else {
						panicDAO.isRoomRegistered({ _id: req.params.roomId }, function (isRegistered) {
							panicDAO.hasUserPanic(req.session.user, { _id: req.params.roomId }, function (err, panicEvent) {
								wsControl.build(req.ws, null, {
									status: true,
									hasRoomPanicRegistered: isRegistered,
									hasUserPanic: (panicEvent && !err) ? true : false
								}, req.refId);
							});
						});
						// broadcast new Room
						req.wss.getActiveUsersByRoom(req.params.roomId, function (err, count) {
							if (!err) {
								res.roomBroadcastAdmins(req.params.roomId, "room:userCount", {
									roomId : req.params.roomId,
									count : count 
								});
							}
						});
						broadcastOld();	
					}
				}
			});
		} else {
			wsControl.build(req.ws, null, {
				status: false
			}, req.refId);
		}
	});
};
