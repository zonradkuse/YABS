var gulp        = require('gulp'),
    jshint      = require('gulp-jshint'),
    jscs        = require('gulp-jscs');

module.exports = function () {
    gulp.task('jscs-app', ['jscs-models'], function(){
        gulp.src(['app/**/*.js'])
            .pipe(jscs({
                configPath: '.jscsrc',
                fix: true
            }))
            .pipe(gulp.dest('app'));
    });

    gulp.task('jscs-models', function(){
        gulp.src(['models/**/*.js'])
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
};