/** @module Routes */

var addresses = require('../config/passwords.json').data;
var config = require('../config.json');
var logger = require('./Logger.js');
var roomDAO = require('../models/Room.js');
var roles = require('../config/UserRoles.json');


module.exports = function (app) {

	/**
     *
     * ONLY UNTIL L2P ROLE MANAGEMENT IS FIXED
     *
     **/
	
	app.get('/roles/admin/:roomId', function (req, res) {
		var path = require('path');
		if (req.session && req.session.user) {
			res.sendFile(path.resolve(__dirname, '../', 'public/upgrade.html'));
		} else {
			res.sendStatus(403);
		}
	});

	app.post('/roles/admin/:roomId', function (req, res) {
		if (req.params.roomId && req.body.password) {
			roomDAO.getByID(req.params.roomId, {population : ''}, function (err, room) {
				if (err) {
					res.json(err.message);
				}
				if (room) {
					if (addresses.indexOf(req.body.password) > -1) {
						req.session.user.rights.push({roomId : req.params.roomId, accessLevel: roles.defaultAdmin});
						res.redirect("/course/" + req.params.roomId);
					} else {
						res.status(403).send("Wrong Password");
					}
				}
			});
		} else {
			res.status(403).send("missing parameters");
		}
	});
    
};
