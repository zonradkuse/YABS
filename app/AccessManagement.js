var inter = require('./RPC/LocalInterface.json');
var roles = require('../config/UserRoles.json');
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
var sessionStore = new sessionStore();

function getEntry(uri) {
    for(var key in inter.data){
        if (inter.data[key].uri === uri){
            return inter.data[key];
        }
    }
    return null;
}

function getAccessLevel(uri) {
    return getEntry(uri).accessLevel;
}

function checkAccess(uri, myAccess) {
    var aL = getAccessLevel(uri);
    if (aL) {
        return aL <= myAccess;
    } else {
        return roles.default;
    }
}

/**
 * Gets session out of sessionStore and checks wether the accessLevel is high enough.
 *
 * @param {uri} uri to check
 * @param {sId} the sessionId to check
 * @param {next} callback with params (err, bool). bool is set true when access is granted.
 **/
function checkAccessBySId(uri, sId, next){
    sessionStore.get(sId, function(err, session){
        if (err) return next(err, false);
        if (!session) return next(null, false);
        
        next(null, checkAcces(uri, session.user.rights));
    });
}

/**
 * Sets a new accessLevel to session.
 *
 * @param {level} accessLevel to set
 * @param {sId} the sessionId to check
 * @param {next} callback with params (err, bool). bool is set true on success.
 **/
function setAccessBySId(level, sId, roomId, next) {
    sessionStore.get(sId, function(err, session){
        if (err) next(err, false);
        if (!session) next(null, false);
        
        session.user.rights.push({ "roomId" : roomId, "accessLevel" : level});

        sessionStore.set(sId, session, function(err){
            if (err) return next(err);
            
            return next(null, true);
        });
    });
}

/**
 * Sets accessLevel by rwth role.
 *
 * @param {rwthRole} rwthRole string that is set in UserRoles.json
 * @param {sId} the sessionId to check
 * @param {next} callback with params (err, bool). bool is set true on success.
 *
 **/
function setAccessByRWTH(rwthRole, sId, roomId, next) {
    for (var key in roles.rwth) {
        if (roles.rwth[key] === rwthRole) {
            for (var r in roles) {
                if (roles.rwth[key] === roles[r]) {
                    return setAccessBySId(roles[r], sId, roomId, next);
                }
            }
            logger.warn("Potential misconfiguration on UserRoles.json!! " + roles.rwth[key] + " seems not to be existing.");
        }
    }
    return next(null, false);
}

module.exports.checkAccessBySId = checkAccessBySId;
module.exports.setAccessBySId = setAccessBySId;

