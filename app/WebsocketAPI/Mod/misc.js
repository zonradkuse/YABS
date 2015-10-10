
var accessManager = require('../../AccessManagement.js');


module.exports = {
	checkAccess : checkAccess
};

/**
 * Calls Callback iff all requirements are met. This is only for mod uris containing nswer or question as they are similar
 */
function checkAccess (req, res, cb) {
	if (req.authed) {
		if ((req.uri.indexOf("nswer") > -1 && req.params.roomId && req.params.questionId && req.params.answerId) ||
			(req.uri.indexOf("uestion") > -1 && req.params.roomId && req.params.questionId)) {
			accessManager.checkAccessBySId("mod:markAsAnswer", req.sId, req.params.roomId, function (err, bool) {
				if (bool) {
					cb();
				} else {
					res.setError(new Error("Access Denied.")).send();
				}
			});
		} else {
			res.setError(new Error("Missing Parameters.")).send();
		}
	} else {
		res.setError(new Error("Access Denied.")).send();
	}
};
