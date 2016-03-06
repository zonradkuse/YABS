function init (api) {
    // set all event handlers
    require('./../API/System.js')(api);
    require('./../API/Room.js')(api);
    require('./../API/User.js')(api);
    require('./../API/Question.js')(api);
    require('./../API/Mod.js')(api);
    require('./../API/Poll.js')(api);
    require('./../API/Quiz.js')(api);
}
module.exports = init;
