require('./tasks/install.js')(function () {
    // make sure, dependencies have been installed
    require('./tasks/build.js')();
    require('./tasks/stylechecks.js')();
    require('./tasks/documentation.js')();
});
