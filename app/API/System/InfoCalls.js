var roomDAO = require('../../../models/Room.js');
var imageDAO = require('../../../models/Image.js');

module.exports = function (wsControl) {
	wsControl.on("system:benchmark", function (req, res) {
		if (config.general.env.dev) {
			roomDAO.getAll({ population: 'questions questions.author questions.votes questions.votes.access questions.answers questions.answers.author questions.author.access questions.answers.author.access' }, function (err, rooms) {
				res.setError(err);
				res.send(rooms);
			});
		}
	});

	wsControl.on('system:ping', function (req, res) {
		res.send({ message: "pong" });
	});

	wsControl.on("system:whoami", function (req, res) {
		if (!req.session || !req.session.user || !req.session.user._id) {
			res.send({
				status: false,
				message: "You are currently not logged in."
			});
		} else {
			imageDAO.get(req.session.user.avatar._id, function (err, avatar) {
				res.send({
					status: true,
					message: (req.session.user.name ? req.session.user.name : req.session.user._id),
					userId: (req.session.user ? req.session.user._id : null),
					userName: (req.session.user && req.session.user.name ? req.session.user.name : null),
					userAvatar: (!err && avatar ? avatar.path : null),
					user: req.session.passport ? req.session.passport.user : {}
				}, req.refId);
			});
		}
	});

	wsControl.on("system:time", function (req, res) {
		res.send({ time: Date.now() });
	});
};
