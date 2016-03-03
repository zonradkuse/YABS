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
    gulp.task('build', ['install', 'fast-build']);


    gulp.task('full', ['check', 'install' ,'build', 'jscs-app']);

    //build the client and only the client
    gulp.task('clean', function (cb) {
        del.sync('public/*');
        cb(null);
    });

    gulp.task('fast-build', ['clean', 'js', 'css', 'img', 'html'], function() {
        gulp.src(['client/bower_components/bootstrap/fonts/*.*'])
            .pipe(flatten())
            .pipe(gulp.dest('public/fonts/'));

        gulp.src(['client/bower_components/font-awesome/fonts/*.*'])
            .pipe(flatten())
            .pipe(gulp.dest('public/fonts/'));
    });

    gulp.task('js', function() {
        gulp.src(['client/bower_components/**/*.{js,map}',
                '!client/bower_components/jquery/src/**/*.js',
                '!client/bower_components/bootstrap/{grunt,js}/*.js',
                '!client/bower_components/angular-chartist.js/{example,spec}/**/*.js',
                '!client/bower_components/bootstrap-switch/{src,dist/**/bootstrap2}/**/*.js',
                '!client/bower_components/**/{grunt,gruntfile,Gruntfile,npm,karma.conf,gulpfile}.js',
                '!client/bower_components/**/*.min.js'])
            .pipe(flatten())
            .pipe(gulp.dest('public/'));

        gulp.src(['client/js/**/*.js'])
            .pipe(jshint())
            .pipe(jshint.reporter('default'));

        gulp.src(['client/js/**/*.js'])
            .pipe(flatten())
            .pipe(gulp.dest('public/'));
        console.log("js files updates");
    });
    gulp.task('html', function() {
        gulp.src(['client/html/**/*.html',
                'client/img/**/*.{jpg,gif,png}'
            ])
            .pipe(flatten())
            .pipe(gulp.dest('public/'));
        console.log("Files updates");
    });
    gulp.task('img', function() {
        gulp.src(['client/img/**/*.{jpg,gif,png}'])
            .pipe(flatten())
            .pipe(gulp.dest('public/'));
        console.log("img files updates");
    });

    gulp.task('css', function() {
        gulp.src(['client/bower_components/**/*.{css,map}',
                '!client/bower_components/jquery/src/**/*.{css,js}',
                '!client/bower_components/bootstrap/{grunt,js}/*.{css,js}',
                '!client/bower_components/angular-chartist.js/{example,spec}/**/*.{css,js}',
                '!client/bower_components/bootstrap-switch/{src,dist/**/bootstrap2}/**/*.{css,js}',
                '!client/bower_components/**/{grunt,gruntfile,Gruntfile,npm,karma.conf,gulpfile}.{css,js}',
                '!client/bower_components/**/*.min.{css,js}'])
            .pipe(flatten())
            .pipe(gulp.dest('public/css/'));

        gulp.src(["client/bower_components/chartist/dist/chartist.min.css"])
            .pipe(rename("chartist.css"))
            .pipe(gulp.dest("public/css/"));

        gulp.src(['client/css/**/*.css'])
            .pipe(flatten())
            .pipe(gulp.dest('public/css/'));
        console.log("css files updates");
    });

    gulp.task('default', ['fast-build'], function() {
        gulp.watch('client/js/**/*.js', ['js']);
        gulp.watch('client/img/**/*.{jpg,gif,png}', ['img']);
        gulp.watch('client/html/**/*.html', ['html']);
        gulp.watch('client/css/**/*.css', ['css']);
    });

    gulp.task('release-build', function () {
        var assets = useref.assets();

        return gulp.src('public/index.html')
            .pipe(assets)
            .pipe(gulpif('*.js', uglify()))
            .pipe(gulpif('*.css', minifyCss()))
            .pipe(assets.restore())
            .pipe(useref())
            .pipe(gulp.dest('public'));
    });
};