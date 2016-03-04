function init (api) {
    // set all event handlers
    require('./WebsocketAPI/System.js')(api);
    require('./WebsocketAPI/Room.js')(api);
    require('./WebsocketAPI/User.js')(api);
    require('./WebsocketAPI/Question.js')(api);
    require('./WebsocketAPI/Mod.js')(api);
    require('./WebsocketAPI/Poll.js')(api);
    require('./WebsocketAPI/Quiz.js')(api);
}
module.exports = init;
