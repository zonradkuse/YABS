var config = require('../config.json');
var logger = require('./Logger.js');
if (config.clamav.enabled) {
    try {
        var clamav = require('clamscan')(config.clamav);
    } catch (e) {
        logger.warn("File Uploads are enabled without virus scan! This is not recommended. Install ClamAV.");
    }
}

module.exports = function(app) {
    
     
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
        console.log(JSON.stringify(req.files, null, 2));
        if (req.files.image === undefined) {
            res.write('<p>No file selected</p>');
        } else {
            res.write('<p>File <b>' + req.files.image.originalname + '</b> uploaded!</p>');
        }
        res.end();
    });
};