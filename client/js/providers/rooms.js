client.service('rooms', ['rpc', function(rpc){
	var rooms = [];

	this.toArray = function() {
		return rooms;
	};

	this.upsertRoom = function(room) {
		for(var i = 0; i < rooms.length; i++) {
			if (rooms[i]._id === room._id) {
				rooms[i] = room;
				return;
			}
		}	
		rooms.push(room);
	};

	this.getById = function(id) {
		for(var i = 0; i < rooms.length; i++) {
			if (rooms[i]._id === id) {
				return rooms[i];
			}
		}
	};

}]);