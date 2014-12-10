/* Model of Room */
var Thread = require("./Thread.js");

function Room(id, name){
	this.id = id;
	this.name = name;
	this.thread = new Thread();
}

module.exports = Room;