var inter = require('./RPC/LocalInterface.json');
var roles = require('../config/UserRoles.json');
var session = require('express-session');
var sessionStore = require('connect-redis')(session);
var sessionStore = new sessionStore();
var logger = require('./Logger.js');

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
function checkAccessBySId(uri, sId, roomId, next){
    sessionStore.get(sId, function(err, session){
        if (err) return next(err, false);
        if (!session) return next(null, false);
        // check if there is anything defined in rights array
        if (session.user && session.user.rights) {
            for (var key in session.user.rights) {
                if(session.user.rights[key].roomId == roomId){
                    return next(null, checkAccess(uri, session.user.rights[key].accessLevel));
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

/**
 * Gets session out of sessionStore and compare the accessLevel to the expected one.
 *
 * @param {sId} the sessionId to check
 * @param {options} fields (requiredAccess, roomMember). roomMember equals true then user have to be active room member
 * @param {roomId} id of room to check
 * @param {next} callback with params (err, bool). bool is set true when access is granted.
 **/
function checkAccessLevel(sId, options, roomId, next){
    if(options.requiredAccess === undefined)
        throw new Error("options must have requiredAccess field.");
    var roomMember = false;
    if(options.roomMember !== undefined)
        roomMember = options.roomMember;

    sessionStore.get(sId, function(err, session){
        if (err) return next(err, false);
        if (!session) return next(null, false);
        // check if there is anything defined in rights array
        if (session.user && session.user.rights) {
            if(!roomMember || session.room == roomId){
                for (var key in session.user.rights) {
                    if(session.user.rights[key].roomId == roomId){
                        return next(null, options.requiredAccess <= session.user.rights[key].accessLevel);
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
module.exports.checkAccessLevel = checkAccessLevel;
module.exports.setAccessBySId = setAccessBySId;

