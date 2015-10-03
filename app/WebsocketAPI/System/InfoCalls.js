var roomDAO = require('../../../models/Room.js');
var imageDAO = require('../../../models/Image.js');

module.exports = function (wsControl) {
	wsControl.on("system:benchmark", function (req) {
		if (config.general.env.dev) {
			roomDAO.getAll({ population: 'questions questions.author questions.votes questions.votes.access questions.answers questions.answers.author questions.author.access questions.answers.author.access' }, function (err, rooms) {
				wsControl.build(req.ws, err, rooms, req.refId);
			});
		}
	});

	wsControl.on('system:ping', function (req) {
		wsControl.build(req.ws, null, { message: "pong" }, req.refId);
	});

	wsControl.on("system:whoami", function (req) {
		if (req.refId) {
			if (!req.session || !req.session.user || !req.session.user._id) {
				wsControl.build(req.ws, null, {
					status: false,
					message: "You are currently not logged in."
				}, req.refId);
			} else {
				imageDAO.get(req.session.user.avatar._id, function (err, avatar) {
					wsControl.build(req.ws, null, {
						status: true,
						message: (req.session.user.name ? req.session.user.name : req.session.user._id),
						userId: (req.session.user ? req.session.user._id : null),
						userName: (req.session.user && req.session.user.name ? req.session.user.name : null),
						userAvatar: (!err && avatar ? avatar.path : null),
						user: req.session.passport ? req.session.passport.user : {}
					}, req.refId);
				});
			}
		}
	});

	wsControl.on("system:time", function (req) {
		wsControl.build(req.ws, null, { time: Date.now() }, req.refId);
	});
};
