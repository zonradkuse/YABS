var config = require('../config.json');
var logger = require('./Logger.js');
var lwip = require('lwip');
var imageDAO = require('../models/Image.js');
if (config.clamav.enabled) {
    try {
        var clamav = require('clamscan')(config.clamav.options);
    } catch (e) {
        logger.warn("File Uploads are enabled without virus scan! This is not recommended. Install ClamAV." + e);
    }
}
var multer = require('multer');
var fs = require('fs');


module.exports = function(app) {
    // use and configure multer for uploads
    app.use(multer({
        dest: './uploads/',
        limits: config.multer.options,
        onFileUploadStart : function(file, req, res) {
            // set header
            console.log(file);
            res.setHeader('Content-Type', 'application/json');
            // do first checks on file
            if (file === undefined) {
                res.write(JSON.stringify({error: "No image attached."}));
                res.end();
                return false; // don't call upload route
            } else {
                if (config.whitelistMime.indexOf(file.mimetype) < 0) {
                    res.write(JSON.stringify({error: "Mimetype " + file.mimetype + " is not supported"}));
                    res.end();
                    return false;
                }
                
                if (!req.session || !req.session.user || !req.session.user._id) {
                    res.write(JSON.stringify({error: "You are not logged in."}));
                    res.end();
                    return false;
                }
            }
            console.log("lol")
        },
        onFileSizeLimit: function (file) {
          fs.unlink('../public/' + file.path); // delete the partially written file
        },
        onFileUploadComplete: function(file, req, res) {
            console.log(file);
            if (file.size >= config.multer.options.fileSize) {
                res.write(JSON.stringify({error : "Filesize limit exceeded."}));
                req.files = undefined; //indicator to upload route
                res.end();
            }
        }
    }));
     
    if (config.general.env.dev) {
        // a route for testing the upload
        app.get('/upload', function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.write('image upload \
                        <form action="/upload" method="post" enctype="multipart/form-data"> \
                        File:<br> \
                        <input type="file" name="image" value="Your File..."> \
                        <br><br> \
                        <input type="submit" value="Submit"> \
                        </form>');
            res.end();
        });
    }

    app.post('/upload', function(req, res) {
        if (req.files) { // we still have files - so nice. perform virus check and create database entry
            console.log(req.files);
            if (req.files.image) {
                if (clamav) {
                    clamav.is_infected(__dirname + "/../" + req.files.image.path, function(err, file, isVirus) {
                        if (err) {
                            logger.warn(err);
                            res.write(JSON.stringify({error: err}));
                            return res.end();
                        }
                        if(isVirus) {
                            logger.warn("VIRUS DETECTED: \nsender: " + req.ip + "\n session: " + req.session);
                            res.write(JSON.stringify({error: "Virus detected.", message: "This incident has been reported."}));
                            res.end();
                        } else {
                            //check if image and compress
                            processFile(file, req, res);
                        }
                    });
                } else {
                    // only check if file is really a image and compress
                    processFile(file, req, res);
                }
            } else {
                res.write(JSON.stringify({error : "Wrong Field"}));
                res.end();
            }
        }
    });
};

function processFile(file, req, res) {
    lwip.open(file, function(err, image){
        if (err) {
            res.write(JSON.stringify({error: err}));
            return res.end();
        } else {
            //seems like the image could be parsed
            fs.mkdir(__dirname + "/../public/userimages", function(err){
                // TODO check if only not something bad.
                //create a compressed real file
                var webpath = "/userimages/" + req.files.image.name.split('.')[0] + ".jpg"; //webpath
                image.writeFile(__dirname + "/../public/" + webpath,
                    { quality : 50 }, function(err){
                        if (err) {
                            res.send(JSON.stringify({error: "An error occured on processing the image"}));
                            
                            return res.end();
                        }
                        var im = new imageDAO.Image();
                        im.owner = req.session.user._id;
                        im.path = webpath;
                        im.resolution.width = image.width();
                        im.resolution.height = image.height();
                        im.size = req.files.image.size;
                        im.type = 'jpg';
                        im.save(function(err){
                            if (err) {
                                res.write(JSON.stringify({error: "Could not save new Image"}));
                            } else {
                                var i = JSON.parse(JSON.stringify(im.toObject()));
                                i.owner = undefined;
                                res.write(JSON.stringify(i));
                            }
                            res.end();
                        });
                });

            });
        }
    });
}