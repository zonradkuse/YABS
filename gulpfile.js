var gulp = require('gulp'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    minifyCss = require('gulp-minify-css'),
    flatten = require('gulp-flatten'),
    del = require('del');
    jsdoc = require('gulp-jsdoc');
    rename = require('gulp-rename')

gulp.task('build', function() {
    del.sync('public/*');

    gulp.src(["client/bower_components/chartist/dist/chartist.min.css"])
    .pipe(rename("chartist.css"))
    .pipe(gulp.dest("public/"));

    gulp.src(['client/bower_components/**/*.{css,js,map}',
        '!client/bower_components/jquery/src/**/*.{css,js}',
        '!client/bower_components/bootstrap/{grunt,js}/*.{css,js}',
        '!client/bower_components/angular-chartist.js/{example,spec}/**/*.{css,js}',
        '!client/bower_components/bootstrap-switch/{src,dist/**/bootstrap2}/**/*.{css,js}',
        '!client/bower_components/**/{grunt,gruntfile,Gruntfile,npm,karma.conf,gulpfile}.{css,js}',
        '!client/bower_components/**/*.min.{css,js}'])
        .pipe(flatten())
        .pipe(gulp.dest('public/'));
    
    gulp.src(['client/bower_components/bootstrap/fonts/*.*'])
        .pipe(flatten())
        .pipe(gulp.dest('public/fonts/'));
        
    gulp.src(['client/html/**/*.html'])
        .pipe(flatten())
        .pipe(gulp.dest('public/'));

    gulp.src(['client/js/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
        
    gulp.src(['client/js/**/*.js'])    
        .pipe(flatten())
        .pipe(gulp.dest('public/'));

    gulp.src(['client/css/**/*.css'])
        .pipe(flatten())
        .pipe(gulp.dest('public/'));
    
    gulp.src(['client/img/**/*.{jpg,gif}'])
        .pipe(flatten())
        .pipe(gulp.dest('public/'));           
});

gulp.task('release-build', function () {
    var assets = useref.assets();
    return gulp.src('client/*.html')
        .pipe(assets)
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('public'));
});

gulp.task('doc', function() {
    del.sync('doc/*');
    gulp.src(['app/**/*.js', 'models/**/*.js'])
        .pipe(jsdoc('doc/server'));
    gulp.src(['client/**/*.js', '!client/bower_components/**/*.js'])
        .pipe(jsdoc('doc/client'));
});