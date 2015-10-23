#!/bin/bash
node_modules/bower/bin/bower install
npm install
node_modules/gulp/bin/gulp.js fast-build
node_modules/gulp/bin/gulp.js release-build
rm -rf public/css/
rm public/*.js*
rm public/*.map
