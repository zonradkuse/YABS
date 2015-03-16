var rpc =  new function() {
	var callbackTable = {};
	var wsUrl = (window.location.protocol == 'http:' ? 'ws' : 'wss') + "://" + appUrl;
	
	var ws = new WebSocket(wsUrl);

	this.call = function(method, params, callback) {
		var id = Math.floor(Math.random() * 10000000);
		ws.send({
			uri : method,
			params: params,
			refId: id
		});
		callbackTable[id] = callback;
	}

	ws.onmessage = function(event) {
		var data = JSON.parse(event.data);
		if ('error' in data && data.error != null)
			log("WS Error received: " + data.error);

		if ('data' in data) {
			// Response
			if (callbackTable[data.refId] != undefined) {
				callbackTable[data.refId](data.data);
			}
		}
		else {
			// Broadcast
			fromRemoteRPC.call(data.uri, data.parameters);
		}
	}
}