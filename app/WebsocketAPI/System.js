var logger = require('../Logger.js');
var config = require('../../config.json');
var querystring = require('querystring');
var https = require('https');
var User = require('../../models/User.js').User;
var session = require('express-session');
var sessionStore = require('connect-redis')(session);

module.exports = function(wsControl){
    wsControl.on('system:ping', function(wss, ws, session, params, interfaceEntry, refId){
        ws.send(wsControl.build(null, "pong", refId));
    });
    
    wsControl.on('system:login', function(wss, ws, session, params, interfaceEntry, refId, sId){
        postReqCampus('code' ,querystring.stringify({
            "client_id": config.login.l2p.clientID,
            "scope": config.login.l2p.scope
        }), function(answer){
            logger.debug(answer);
            if(answer){
                try{
                    answer = JSON.parse(answer);
                } catch(e) {
                    ws.send(wsControl.build(new Error("An error occured when communicating with Campus. lol."), null, refId));
                    logger.warn('An error occured whon communicating with Campus OAuth. Response was: ' + answer);
                    return;
                }
                var _url = answer.verification_url + '?q=verify&d=' + answer.user_code;
                logger.debug(_url);
                ws.send(wsControl.build(null, {
                    message: "Please visit the provided url.",
                    url: _url
                }, refId));
                var auth = false;
                var reqTime = 0;
                var timer = setInterval(function(){
                    if(!auth && reqTime < answer.expires_in){
                        // poll
                        postReqCampus('token', querystring.stringify({
                            "client_id": config.login.l2p.clientID,
                            "code": answer.device_code,
                            "grant_type": "device"
                        }), function(response){
                            if(response){
                                logger.debug(response);
                                try{
                                    response = JSON.parse(response);
                                } catch(e) {
                                    logger.error();
                                    ws.send(wsControl.build(new Error("An error occured when communicating with Campus. lol."), null, refId));
                                    logger.warn('An error occured when communicating with Campus OAuth. Response was: ' + response);
                                }
                                if(response.status){
                                    if(response.status === "ok"){
                                        // it's an access token. wuhsa!
                                        logger.debug(response);
                                        auth = true;
                                        clearInterval(timer);
                                        var _user = new User();
                                        _user.token = response.access_token;
                                        _user.refresh_token = response.refresh_token;
                                        _user.expires_in = response.expires_in;
                                        _user.save(function(err){
                                            if(err) {
                                                ws.send(err, null, refId);
                                                logger.warn(err);
                                                return;
                                            }
                                            session.user = _user;
                                            sessionStore.set(_user, sId);
                                            ws.send(null, { "status": "succes" }, refId);
                                            logger.info("created new user.");
                                        });
                                        
                                    } else if(response.status === "error: authorization pending."){
                                        ws.send(wsControl.build(new Error("still waiting"), null, refId));
                                    }

                                }
                            }
                        });
                    }else if(reqTime >= answer.expires_in){
                        ws.send(wsControl.build(new Error("Your authentication request failed. Please try again."), null, refId));
                    }else{ // authenticated
                        clearInterval(timer);
                    }
                    reqTime += answer.interval;
                }, answer.interval * 1000);
            } else {
                ws.send(wsControl.build(new Error("Campus Response not set.")));
                logger.debug("Campus Response not set. Answer was " + answer);
            }
        });
    });
};

function postReqCampus(query, data, next) {
    logger.debug(query + "  " + data);
    var post = {
        host: 'oauth.campus.rwth-aachen.de',
        port: '443',
        path: '/oauth2waitress/oauth2.svc/' + query,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }

    }
    var postRequest = https.request(post, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            next(chunk);
        });
    });

    postRequest.write(data);
    postRequest.end();
  }