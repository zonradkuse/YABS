var gulp            = require('gulp');
var del             = require('del');
var useref          = require('gulp-useref');
var gulpif          = require('gulp-if');
var uglify          = require('gulp-uglify');
var jshint          = require('gulp-jshint');
var minifyCss       = require('gulp-minify-css');
var flatten         = require('gulp-flatten');
var rename          = require('gulp-rename');
var templateCache   = require('gulp-angular-templatecache');
var inject          = require('gulp-inject');
var htmlclean       = require('gulp-htmlclean')

module.exports = function build () {
    
    gulp.task('views-to-js', [], function () {
        return gulp.src(['client/**/*.html', '!client/bower_components/**/*.html'])
           .pipe(htmlclean()) 
           .pipe(templateCache( { module : 'client' } ))
           .pipe(gulp.dest('dist/views'));
    });

    gulp.task('build', ['views-to-js'], function () {
        var assets = useref.assets();

        gulp.src(['client/img/**'])
            .pipe(gulp.dest('dist/img'));

        gulp.src(['client/**/fonts/**'])
            .pipe(flatten())
            .pipe(gulp.dest('dist/fonts'));
        
        return gulp.src('client/index.html')
            .pipe(inject(gulp.src('./dist/views/*.js', { 
                read : false, 
            }),
            {
                ignorePath : 'dist',
                addRootSlash : false
            }))
            .pipe(assets)
            .pipe(gulpif('*.js', uglify()))
            .pipe(gulpif('*.css', minifyCss()))
            .pipe(assets.restore())
            .pipe(useref())
            .pipe(gulp.dest('dist'));
    });
};
