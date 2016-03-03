var exec = require('child_process').exec;
var gulp;


module.exports = function (cb) {
    // installation tasks like npm and bower install which are needed in order to build correctly
    try {
        gulp = require('gulp');
        cb();
    } catch (e) {
        install(function (err) {
            if (err) console.log("An error occurred during dependency installation: " + err);
        });
        gulp = require('gulp');
        cb();
    }

    gulp.task('install', function(cb){
        install(cb);
    });
};

function install (cb) {
    exec('npm install', function(err, stdout, stderr) {
        if(err) {
            return cb(err);
        }
        if(stdout) {
            process.stdout.write("NPM STDOUT: \n" + stdout + "\n\0");
        }
        if(stderr) {
            process.stdout.write("NPM STDERR: \n" + stderr + "\n\0");
        }
        // bower install
        exec('bower install', function(err, stdout, stderr) {
            if(stdout) {
                process.stdout.write("BOWER STDOUT: \n" + stdout + "\n\0");
            }
            if(stderr) {
                process.stdout.write("BOWER STDERR: \n" + stderr + "\n\0");
            }
            if(err) {
                return cb(err);
            }
            cb();
        });
    });
}