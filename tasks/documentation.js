var gulp        = require('gulp');
var del         = require('del');
var shell       = require('gulp-shell');


module.exports = function () {
    gulp.task('cleanDoc', function () {
        del.sync('doc/server/');
        del.sync('doc/client/');
    });

    gulp.task('doc', ['cleanDoc'], shell.task(
        ['./node_modules/.bin/jsdoc models/* app/* -r -c .jsdoc -d doc/server',
            './node_modules/.bin/jsdoc client/js/* -r -c .jsdoc -d doc/client']
    ));
};