var nodemailer = require('nodemailer');
var addresses = require('../config/mails.json').data;
var config = require('../config.json');
var logger = require('./Logger.js');
var roomDAO = require('../models/Room.js');
var adminkey = "wurstbrot";
var roles = require('../config/UserRoles.json');

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'noreply.yabs@gmail.com',
        pass: 'a1b2c3d4$'
    }
});

var mailOptions = {
    from: 'YABS <noreply.yabs@gmail.com>',
    to: '',
    subject: 'YABS admin access',
    text: '',
};


module.exports = function(app){

    /**
     *
     * ONLY UNTIL L2P ROLE MANAGEMENT IS FIXED
     *
     **/
     
    app.get('/roles/admin/:roomId', function (req, res){
        var path = require('path');
        if (req.session && req.session.user) {
            res.sendFile(path.resolve(__dirname, '../', 'public/upgrade.html'));
        } else {
            res.write('you are not logged in.');
            res.end();
        }
    });

    app.post('/roles/admin/:roomId', function(req, res){
        if(req.params.roomId && req.body.email) {
            roomDAO.getByID(req.params.roomId, {population : ''}, function(err, room){
                if(err) res.write(err.message);
                if(room) {
                    //room exists send mail if adress is in list or is a cs.rwth-aachen.de adress
                    if(addresses.indexOf(req.body.email.toLowerCase()) > -1 || req.body.email.toLowerCase().indexOf('@cs.rwth-aachen.de') > -1) {
                        var hash = require('crypto').createHash('sha1').update(req.params.roomId + adminkey + req.session.user._id).digest('hex');
                        mailOptions.text = "Please visit: " + req.protocol + "://" + req.get('Host') + '/roles/admin/' + req.params.roomId + '/' + hash;
                        mailOptions.to = req.body.email;
                        transporter.sendMail(mailOptions, function(error, info){
                        if(error){
                            res.write("An error occured! This has been reported.");
                            logger.err(error);
                        }else{
                            res.write('Message sent! You can now close this window.');
                        }
                        res.end();
                        });
                    } else {
                        res.send("Your address is not listed or invalid formatted. Please contact johannes.neuhaus [at] rwth-aachen.de");
                        res.end();
                    }
                } else {
                    res.write(err.message);
                    res.end();
                }
            });
        } else {
            res.write("missing parameters");
            res.end();
        }
    });
    
    app.get('/roles/admin/:roomId/:key', function(req, res){
        if(req.params.roomId && req.params.key && req.session.user) {
            roomDAO.getByID(req.params.roomId, {population : ''}, function(err, room){
                if (err) {
                    res.write(err.message);
                } else {
                    
                    if(req.params.key == require('crypto').createHash('sha1').update(req.params.roomId + adminkey + req.session.user._id).digest('hex')){
                        //set access right
                        if(req.session.rights) {
                            req.session.user.rights.push({roomId : req.params.roomId, accessLevel: roles.defaultAdmin});
                        } else {
                            req.session.user.rights.push({roomId : req.params.roomId, accessLevel: roles.defaultAdmin});
                        }
                        res.redirect("/course/" + req.params.roomId);
                    } else {
                        res.write("bad key");
                        res.end();
                    }
                }
            });
        } else {
            res.write("Missing Field or bad user. Use the browser you used to send the Request.");
            res.end();
        }
        
    });
    
};