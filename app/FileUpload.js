/** @module FileUpload */

/* global __dirname */
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
} else {
	logger.warn("File Uploads are enabled without virus scan! This is not recommended. Install ClamAV.");
}
var multer = require('multer');
var fs = require('fs');

/** Init file upload.
 * @param {Object} app - global app object
 */
module.exports = function (app) {
	// use and configure multer for uploads
	app.use(multer({
		dest: './uploads/',
		limits: config.multer.options,
		onFileUploadStart : function (file, req, res) {
			// set header

			res.setHeader('Content-Type', 'application/json');
			// do first checks on file
			if (file === undefined || file === {}) {
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
            
		},
		onFileSizeLimit: function (file) {
			fs.unlink('../public/' + file.path); // delete the partially written file
		},
		onFileUploadComplete: function (file, req, res) {
            
			if (file.size >= config.multer.options.fileSize) {
				res.write(JSON.stringify({error : "Filesize limit exceeded."}));
				req.files = undefined; //indicator to upload route
				res.end();
			}
		}
	}));

	app.post('/upload', function (req, res) {
		if (req.files) { // we still have files - so nice. perform virus check and create database entry
			if (req.files.image) {
				if (clamav) {
					clamav.is_infected(__dirname + "/../" + req.files.image.path, function (err, file, isVirus) {
						if (err) {
							logger.warn(err);
							res.write(JSON.stringify({error: err}));
							return res.end();
						}
						if (isVirus) {
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
					processFile(__dirname + "/../" + req.files.image.path, req, res);
				}
			} else {
				res.write(JSON.stringify({error : "Wrong Field"}));
				res.end();
			}
		}
	});
};

/** Store file to database and save it to filesystem.
 * @param {Object} file - uploaded file object
 * @param {Object} req - request
 * @param {Object} res - response
 */
function processFile(file, req, res) {
	lwip.open(file, function (err, image) {
		if (err) {
			res.write(JSON.stringify({error: err}));
			return res.end();
		} else {
			//seems like the image could be parsed
			fs.mkdir(__dirname + "/../images/userimages", function (err) {
				// TODO check if only not something bad.
				//create a compressed real file
				var webpath = "/images/userimages/" + req.files.image.name.split('.')[ 0 ] + ".jpg"; //webpath
				image.writeFile(__dirname + "/../" + webpath, { quality : 50 }, function (err) {
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
					im.save(function (err) {
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
