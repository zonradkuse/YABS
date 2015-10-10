var session = require('express-session');
var sessionStore = require('connect-redis')(session);
sessionStore = new sessionStore();
var panicDAO = require('../../Panic.js');
var userWorker = require('../../UserWorker.js');

module.exports = function (wsControl, workerMap) {

	wsControl.on("system:enterRoom", function (req, res) {
		if (req.authed && req.params.roomId !== undefined) {
            if (!workerMap[ req.sId ]) {
                var worker = new userWorker(req, res, req.session.user, true);
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
					res.setError(err).send();
				} else {
					var broadcastOld = function () {
						if (isNaN(oldRoom)) { 
							req.wss.getActiveUsersByRoom(oldRoom, function (err, count) {
								if (!err) {
									res.roomBroadcastAdmins("room:userCount", {
										roomId : oldRoom,
										count : count
									}, oldRoom);
								} else {
									logger.warn(err);
								}
							});
						}
					};
					if (req.params.roomId == 1) {
						res.send({
							status: true
						});
						broadcastOld();
					} else {
						panicDAO.isRoomRegistered({ _id: req.params.roomId }, function (isRegistered) {
							panicDAO.hasUserPanic(req.session.user, { _id: req.params.roomId }, function (err, panicEvent) {
								res.send({
									status: true,
									hasRoomPanicRegistered: isRegistered,
									hasUserPanic: (panicEvent && !err) ? true : false
								});
							});
						});
						// broadcast new Room
						req.wss.getActiveUsersByRoom(req.params.roomId, function (err, count) {
							if (!err) {
								res.roomBroadcastAdmins("room:userCount", {
									roomId : req.params.roomId,
									count : count 
								}, req.params.roomId);
							}
						});
						broadcastOld();	
					}
				}
			});
		} else {
			res.send({ status: false });
		}
	});
};
