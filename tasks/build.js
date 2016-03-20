var gulp            = require('gulp');
var del             = require('del');
var useref          = require('gulp-useref');
var gulpif          = require('gulp-if');
var uglify          = require('gulp-uglify');
var jshint          = require('gulp-jshint');
var minifyCss       = require('gulp-minify-css');
var flatten         = require('gulp-flatten');
var rename          = require('gulp-rename');

module.exports = function build () {
    gulp.task('build', function () {
        var assets = useref.assets();
        del.sync('dist');

        gulp.src(['client/img/**'])
            .pipe(gulp.dest('dist/img'));

        gulp.src(['client/**/fonts/**'])
            .pipe(flatten())
            .pipe(gulp.dest('dist/fonts'));

        gulp.src(['client/html/**'])
            .pipe(gulp.dest('dist/html'));

        return gulp.src('client/index.html')
            .pipe(assets)
            .pipe(gulpif('*.js', uglify()))
            .pipe(gulpif('*.css', minifyCss()))
            .pipe(assets.restore())
            .pipe(useref())
            .pipe(gulp.dest('dist'));
    });
};
