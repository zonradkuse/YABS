/** @module WSAPI/Moderator */

var roomConfiguration = require('./Mod/RoomConfiguration.js');
var answers = require('./Mod/Answers.js');
var questions = require('./Mod/Questions.js');


module.exports = function (wsControl) {
	roomConfiguration(wsControl);
	answers(wsControl);
	questions(wsControl);

};
