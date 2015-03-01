var GoogleStrategy = require('passport-google').Strategy;
var authConf = require('../config/auth.json');
var User = require('../models/User.js');
var logger = require('./Logger.js');

//TODO: Logger work
module.exports = function(passport){
    
    passport.use(new GoogleStrategy({
        clientID :   authConf.google.key,
        clientSecret : authConf.google.secret,
        returnURL : authConf.google.callback,
        realm: authConf.google.realm,
        passReqToCallback : true
    }, function (req, token, refreshToken, profile, done){
    process.nextTick(function(){
        if(!req.user){
            User.findOne({'google.id' : profile.id},
            function(err, user){
                if(err) return done(err);
            
                if(user) {
                    if (!user.google.token) {
                    // there is an existing user but the token is not set
                        user.google.token = token;
                        user.google.name = profile.name.givenName;
                        user.google.email = (profile.emails[0].value || '').toLowerCase();
              
                        user.save(function(err){
                            if(err) return done(err);
                            return done(null, user); //success
                        });
                    }
                    return done(null, user); // success
                } else { // we could not find a user
                    var nUser = new User();
            
                    nUser.google.id = profile.id;
                    nUser.google.token = token;
                    nUser.google.name = profile.name.givenName;
                    nUser.google.email = (profile.emails[0].value || '').toLowerCase();
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
        user.google.id    = profile.id;
        user.google.token = token;
        user.google.name  = profile.name.givenName;
        user.google.email = (profile.emails[0].value || '').toLowerCase();

        user.save(function(err) {
            if (err) return done(err);
                        
            return done(null, user);
        });
      }
    });
  }));
}