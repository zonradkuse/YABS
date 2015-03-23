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
        return roles.defaultGuest;
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
        
        next(null, checkAcces(uri, session.accessLevel));
    });
}

/**
 * Sets a new accessLevel to session.
 *
 * @param {level} uri to
 * @param {sId} the sessionId to check
 * @param {next} callback with params (err, bool). bool is set true on success.
 **/
function setAccessBySId(level, sId, next) {
    sessionStore.get(sId, function(err, session){
        if (err) next(err, false);
        if (!session) next(null, false);
        
        session.accessLevel = level;
        
        sessionStore.set(sId, session, function(err){
            if (err) return next(err);
            
            return next(null, true);
        });
    });
}

function

module.exports.checkAccessBySId = checkAccessBySId;
module.exports.setAccessBySId = setAccessBySId;

