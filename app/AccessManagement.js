/** @module Misc/AccessManagement */

var inter = require('./RPC/LocalInterface.js');
var roles = require('../config/UserRoles.json');
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
var sessionStore = new sessionStore();
var logger = require('./Logger.js');

/** Get uri from rpc interface.
 * @param {String} uri - rpc uri
 * @returns {Object} rpc object 
 */
function getEntry(uri) {
	for (var key in inter.data) {
		if (inter.data[ key ].uri === uri) {
			return inter.data[ key ];
		}
	}
	return null;
}

/** Get required access level of rpc uri.
 * @param {String} uri - rpc uri
 * @returns {Number} access level 
 */
function getAccessLevel(uri) {
	return getEntry(uri).accessLevel;
}

/** Check if user has permission to call rpc uri.
 * @param {String} uri - rpc uri
 * @param {Number} myAccess - user access
 * @returns {Boolean} true if user has access, false otherwise
 */
function checkAccess(uri, myAccess) {
	var aL = getAccessLevel(uri);
	if (aL !== null && aL !== undefined) {
		return aL <= myAccess;
	} else {
		return roles.default;
	}
}

/** Gets session out of sessionStore and checks wether the accessLevel is high enough.
 * @param {String} uri - uri to check
 * @param {SessionId} sId - the sessionId to check
 * @param {nextCallback} next - callback function
 */
function checkAccessBySId(uri, sId, roomId, next) {
	sessionStore.get(sId, function (err, session) {
		if (err) {
			return next(err, false);
		}
		if (!session) {
			return next(null, false);
		}
		// check if there is anything defined in rights array
		if (session.user && session.user.rights) {
			for (var key in session.user.rights) {
				if (session.user.rights[ key ].roomId == roomId) {
					return next(null, checkAccess(uri, session.user.rights[ key ].accessLevel), session.user.rights[ key ].accessLevel);
				}
			}
		}

		if (session.user) {
			return next(null, checkAccess(uri, roles.defaultLoggedIn));
		} else {
			next(null, checkAccess(uri, roles.default));
		}
        
	});
}

/** Gets session out of sessionStore and compare the accessLevel to the expected one.
 * @param {SessionId} sId the sessionId to check
 * @param {Object} options - options
 * @param {Boolean} options.requiredAccess - equals true then user must have this access level or higher
 * @param {Boolean} [options.roomMember] - equals true then user have to be active room member
 * @param {ObjectId} roomId - id of room to check
 * @param {nextCallback} next - callback function
 */
function checkAccessLevel(sId, options, roomId, next) {
	if (options.requiredAccess === undefined) {
		throw new Error("options must have requiredAccess field.");
	}
	var roomMember = false;
	if (options.roomMember !== undefined) {
		roomMember = options.roomMember;
	}

	sessionStore.get(sId, function (err, session) {
		if (err) {
			return next(err, false);
		}
		if (!session) {
			return next(null, false);
		}
		// check if there is anything defined in rights array
		if (session.user && session.user.rights) {
			if (!roomMember || session.room == roomId) {
				for (var key in session.user.rights) {
					if (session.user.rights[ key ].roomId == roomId) {
						return next(null, options.requiredAccess <= session.user.rights[ key ].accessLevel);
					}
				}
			} else {
				return next(null, false);
			}
		}
		if (session.user) {
			return next(null, options.requiredAccess <= roles.defaultLoggedIn);
		} else {
			next(null, options.requiredAccess <= roles.default);
		}
	});
}

/** Sets a new accessLevel to session.
 * @param {Number} level - accessLevel to set
 * @param {SessionId} sId - the sessionId to check
 * @param {nextCallback} next - callback function
 */
function setAccessBySId(level, sId, roomId, next) {
	sessionStore.get(sId, function (err, session) {
		if (err) {
			next(err, false);
		}
		if (!session) {
			next(null, false);
		}
        
		session.user.rights.push({ "roomId" : roomId, "accessLevel" : level});

		sessionStore.set(sId, session, function (err) {
			if (err) {
				return next(err);
			}
            
			return next(null, true);
		});
	});
}

/** Sets accessLevel by rwth role.
 * @param {String} rwthRole - is set in UserRoles.json
 * @param {SessionId} sId - the sessionId to check
 * @param {nextCallback} next - callback function
 */
function setAccessByRWTH(rwthRole, sId, roomId, next) {
	for (var key in roles.rwth) {
		if (roles.rwth[ key ] === rwthRole) {
			for (var r in roles) {
				if (roles.rwth[ key ] === roles[ r ]) {
					return setAccessBySId(roles[ r ], sId, roomId, next);
				}
			}
			logger.warn("Potential misconfiguration on UserRoles.json!! " + roles.rwth[ key ] + " seems not to be existing.");
		}
	}
	return next(null, false);
}

module.exports.checkAccessBySId = checkAccessBySId;
module.exports.checkAccessLevel = checkAccessLevel;
module.exports.setAccessBySId = setAccessBySId;

/**
 * @callback nextCallback
 * @param {Error} err - if an error occurs
 * @param {Boolean} bool - true if successful
 */
