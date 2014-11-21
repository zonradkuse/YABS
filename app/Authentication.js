exports.passportLocal = function(pPassport, pLocalStrategy, pDBPool){
  var passport = pPassport;
  var LocalStrategy = pLocalStrategy;
  passport.use('local-login', new LocalStrategy({
    passReqToCallback : true
    }, function(req,username, password, done) {
        done(null, null);
    }));
}

exports.loginLocal = function(req, res, success, fail){
  
  /*
  if (UserController.findOne(req.body.username).getPassword() == req.body.password) {
    success();
  } else {
    fail();
  }
  */

  //genereate a token
  var token;
  require('crypto').randomBytes(32, function(ex, buf) {
    token = buf.toString('hex');
    console.log('[USER] > LOGIN: ' + req.body.username + ' ' + token);
    req.session.sessionId = token;
    success(res);
  });

}