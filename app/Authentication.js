module.exports = function(pPassport, pLocalStrategy, pDBPool){
  var passport = pPassport;
  var LocalStrategy = pLocalStrategy;
  passport.use('local-login', new LocalStrategy({
    passReqToCallback : true
    }, function(req,username, password, done) {
        done(null, null);
    }));
}