var FacebookStrategy = require('passport-facebook').Strategy;
var authConf = require('../config/auth.json');

var User = require('../models/User.js').User;
var logger = require('./Logger.js');

//TODO: Logger work
module.exports = function(passport){
    logger.info(authConf.facebook.callback);
    passport.use(new FacebookStrategy({
        clientID :   authConf.facebook.clientID,
        clientSecret : authConf.facebook.clientSecret,
        callbackURL : authConf.facebook.callback,
        passReqToCallback : true
    }, function (req, token, refreshToken, profile, done){
    process.nextTick(function(){
        if(!req.user){
            User.findOne({'facebook.id' : profile.id},
            function(err, user){
                if(err) return done(err);
            
                if(user) {
                    if (!user.facebook.token) {
                    // there is an existing user but the token is not set
                        user.facebook.token = token;
                        user.facebook.name = profile.name.givenName;
                        user.facebook.email = (profile.emails[0].value || '').toLowerCase();
              
                        user.save(function(err){
                            if(err) return done(err);
                            return done(null, user); //success
                        });
                    }
                    return done(null, user); // success
                } else { // we could not find a user
                    var nUser = new User();
            
                    nUser.facebook.id = profile.id;
                    nUser.facebook.token = token;
                    nUser.facebook.name = profile.name.givenName;
                    nUser.facebook.email = (profile.emails[0].value || '').toLowerCase();
                    nUser.save(function(err){
                        if(err) return done(err);
                        done(null, nUser);
                    })
                    //created user - success
                    
                }
                return done(null); //can not be reached. just for reasons of completeness.
            })
      } else {
          // there is already an existing user. Link the data
        var user = req.user; // pull the user out of the session
        user.facebook.id    = profile.id;
        user.facebook.token = token;
        user.facebook.name  = profile.name.givenName;
        user.facebook.email = (profile.emails[0].value || '').toLowerCase();

        user.save(function(err) {
            if (err)
                return done(err);
                        
                return done(null, user);
            });
        }
    });
  }));
}

