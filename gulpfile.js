/// <reference path="typings/node/node.d.ts"/>
var gulp = require('gulp'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    minifyCss = require('gulp-minify-css'),
    flatten = require('gulp-flatten'),
    del = require('del'),
    jsdoc = require('gulp-jsdoc'),
    rename = require('gulp-rename'),
    exec = require('child_process').exec,
    jscs = require('gulp-jscs'),
    shell = require('gulp-shell');

//build the client and only the client
gulp.task('clean', function (cb) {
    del.sync('public/*');
    cb(null);
});
gulp.task('fast-build', ['clean', 'js', 'css', 'img', 'html'], function() {

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
        
    gulp.src(['client/bower_components/font-awesome/fonts/*.*'])
        .pipe(flatten())
        .pipe(gulp.dest('public/fonts/'));
});

gulp.task('js', function() {
    gulp.src(['client/js/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));

    gulp.src(['client/js/**/*.js'])
        .pipe(flatten())
        .pipe(gulp.dest('public/'));
    console.log("js files updates");
});
gulp.task('html', function() {
    gulp.src(['client/html/**/*.html'])
        .pipe(flatten())
        .pipe(gulp.dest('public/'));
    console.log("html files updates");
});
gulp.task('img', function() {
    gulp.src(['client/img/**/*.{jpg,gif,png}'])
        .pipe(flatten())
        .pipe(gulp.dest('public/'));
    console.log("img files updates");
});

gulp.task('css', function() {
    gulp.src(['client/img/**/*.css'])
        .pipe(flatten())
        .pipe(gulp.dest('public/'));
    console.log("css files updates");
});

gulp.task('default', ['fast-build'], function() {
    gulp.watch('client/js/**/*.js', ['js']);
    gulp.watch('client/img/**/*.{jpg,gif,png}', ['img']);
    gulp.watch('client/html/**/*.html', ['html']);
    gulp.watch('client/css/**/*.css', ['css']);
});

gulp.task('build', ['install', 'fast-build']);

gulp.task('jscs-app', ['jscs-models'], function(){
    gulp.src(['app/**/*.js',])
        .pipe(jscs({
            configPath: '.jscsrc',
            fix: true
        }))
        .pipe(gulp.dest('app'));
});

gulp.task('jscs-models', function(){
    gulp.src(['models/**/*.js',])
        .pipe(jscs({
            configPath: '.jscsrc',
            fix: false
        }))
        .pipe(gulp.dest('models'));
});

gulp.task('check', ['jscs-app'], function() {
    return gulp.src(['app/**/*.{js, json}',
              'models/**/*.{js,json}',
              'config/**/*.{json, js}',
              '*.{json, js}'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'), { 
            verbose: true,
            strict: true
        })
        .pipe(jshint.reporter('fail'));    
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

gulp.task('install', ['check'], function(cb){
    // npm install
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
});

gulp.task('full', ['check', 'install' ,'build', 'jscs-app']);

gulp.task('docOld', function() {
    del.sync('docOld/*');
    gulp.src(['app/**/*.js', 'models/**/*.js'])
        .pipe(jsdoc('docOld/server'));
    gulp.src(['client/**/*.js', '!client/bower_components/**/*.js'])
        .pipe(jsdoc('docOld/client'));
});

gulp.task('doc', shell.task(
    ['./node_modules/.bin/jsdoc models/* app/* -r -c .jsdoc -d doc/server',
    './node_modules/.bin/jsdoc client/js/* -r -c .jsdoc -d doc/client']
));
