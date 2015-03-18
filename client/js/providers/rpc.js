client.service('rpc', [function(){
    /*
     * Code related to sending requests
     */

    var callbackTable = {};
	var wsUrl = (window.location.protocol == 'http:' ? 'ws' : 'wss') + "://" + appUrl;
	var ws = new WebSocket(wsUrl);
    var sendQueue = [];
    var queueTimer = false;
    var self = this;

    var sendOutQueue = function() {
        queueTimer = false;
        if (ws.readyState === 1) {
            for (var i = 0; i < sendQueue.length; i++) {
                ws.send(sendQueue[i]);
            }
        } else {
            queueTimer = true;
            setTimeout(sendOutQueue, 100);
        }
    };

    var send = function(data) {
        if (ws.readyState === 1) {
            sendOutQueue();
            ws.send(data);
        }
        else {
            sendQueue.push(data);
            if (!queueTimer) {
                queueTimer = true;
                setTimeout(sendOutQueue, 100);
            }
        }
    };

	this.call = function(method, params, callback) {
		var id = Math.floor(Math.random() * 10000000);
		send(JSON.stringify({
			uri : method,
			parameters: params,
			refId: id
		}));
		callbackTable[id] = callback;
	};


	ws.onmessage = function(event) {
		var data = JSON.parse(event.data);
		if ('error' in data && data.error !== null)
			console.log("WS Error received: " + data.error);
		if ('data' in data) {
			// Response
			if (callbackTable[data.refId] !== undefined) {
				callbackTable[data.refId](data.data);
			}
		}
		else {
			// Broadcast
			self.handleBroadcast(data.uri, data.parameters);
		}
	};

	/*
	 * Code related to handling incoming broadcasts
	 */

    var Interface = {
        "data": [{
            "uri": "room:add",
            "parameters": {
                room: ""
            },
            "func": ""
        },{
            "uri": "question:add",
            "parameters": {
                roomId: '',
                question: {}               
            },
            "func": ""
        }{
            "uri": "answer:add",
            "parameters": {
                roomId: "",
                questionId: '',
                answer {}
            },
            "func": ""
        }]
    };


    /**
     * attaches funct to uri function and calls callback with error if needed.
     *
     * @param funct - gets parameters (params, callback, refId).
     *                  params: the params object as specified in interface
     *                  callback: a callback you can handle - should be used for err.
     *                  refId: reference that comes from the server.
     **/
    this.attachFunction = function(uri, funct) {
        if (typeof funct != 'function') {
            throw new Error('function is not a function');
        }
        if (Interface.data === undefined || Interface.data === null) {
            callback(new Error('Interface Data unset or undefined.'));
        } else {
            var data = Interface.data;
            for (var i = data.length - 1; i >= 0; i--) {
                if (data[i].uri === uri) {
                    //run the assoc function with params and provided callback
                    data[i].func = funct;
                    return;
                }
            }
            callback(new Error('URI not found'));
        }
    };

    /**
     * Calls the functions attached to the invoke uri with the params object.
     * callback is also passed to this function for your own handling. if an error occurs, the first parameter will be set.
     **/
    this.handleBroadcast = function(invoke, params) {
        if (Interface.data === undefined || Interface.data === null) {
            callback(new Error('Interface Data unset or undefined.'));
        } else {
            var data = Interface.data;
            this.checkParameters(invoke, params, function(err, res){
                if (res) {
                    for (var i = data.length - 1; i >= 0; i--) {
                        if (data[i].uri === invoke) {
                            //run the assoc function with params and provided callback
                            if (params !== undefined && params !== null)
                                data[i].func(params);
                            return;
                        }
                    }
                    callback(new Error('URI not found'));
                } else {
                    throw err;
                }
            });
            
        }
    };

    this.ParamsOfURI = function(uri, callback) {
        //get params for uri
        if (Interface.data === undefined || Interface.data === null) {
            callback(new Error('Interface data not set or undefined.'));
        } else if (typeof callback != 'function') {
            throw new Error('callback is not a function');
        } else {
            var data = Interface.data;
            for (var i = data.length - 1; i >= 0; i--) {
                if (data[i].uri === uri) {
                    callback(null, data[i].parameters);
                    return;
                }
            }
            callback(new Error('URI not found'));
        }
    };

    /**
     * checks parameter keys.
     * next gets (err, boolean)
     **/
    this.checkParameters = function(uri, params, next){
        this.ParamsOfURI(uri, function(err, _params){
            if(err) {
                next(err, false);
                return;
            }
            if(_params){
                var c = 0;
                for (var key in _params) {
                    if(key !== Object.getOwnPropertyNames(params)[c]) {
                        next(new Error("parameter objects not matching (tested key names)"), false);
                        return;
                    }
                    c += 1;
                }
            }
            next(null, true);
        });
    };

}]);