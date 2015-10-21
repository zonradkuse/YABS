/**
 * Takes care of displaying error messages
 *
 * @module Services/rpc
 * @requires errorService
 */

client.service("rpc", ["errorService", function(errorService){
    var callbackTable = {};
	var wsUrl = (window.location.protocol == "http:" ? "ws" : "wss") + "://" + appUrl + "/yabs/ws";
	var ws = new WebSocket(wsUrl);
    var sendQueue = [];
    var reconnecting = false;
    var doReset = false;
    var queueTimer = false;
    var reconnectIteration = 0;
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
        } else {
            sendQueue.push(data);
            if (!queueTimer) {
                queueTimer = true;
                setTimeout(sendOutQueue, 100);
            }
        }
        
    };
    
    var reconnect = function(isForced) {
        // generate some kind of random time in seconds
        if (!reconnecting || isForced) {
            reconnecting = true; // indicate that there is an existing reconnect timer.
            var time = (2^reconnectIteration + Math.floor(Math.random() * reconnectIteration*5)) * 1000;
            reconnectIteration += 1;
            var timer = setTimeout(function(){ // start the timer
                reconnecting = false; // time is up, indicate that a new reconnect is coming.
                reconnect();
            }, time);
            ws = new WebSocket(wsUrl); // create new Websocket
            ws.onmessage = receiveMessage; // attach receive Logic
            setTimeout(function(){ //just in case that readyState is still 0
                if(ws.readyState === 1 || ws.readyState === 0) { //connecting or connected
                    clearTimeout(timer); // kill timer in case that reconnect has been successful
                    reconnectIteration = 0;
                    $('.reconnect').text("Verbunden!");
                    doReset = true;
                    reconnecting = false;
                } else {
                    try {
                        ws.close();
                    } catch (e) {
                        // no need to to anything. just supress possible error.
                    }
                    $('.reconnect').text("Neu verbinden in " + time/1000 + "s...");
                }
            }, 600); 
        } else {
            reconnecting = false;
            reconnectIteration = 0;
        }
    };

    /* Check if a Websocket reconnect is needed */
    setInterval(function(){
        if (ws.readyState >= 2 && !reconnecting) {
            reconnect(); // kick off reconnection
            $('.reconnect').show();
        } else if (!reconnecting && doReset) {
            $('.reconnect').hide();
            $('.reconnect').text("Neu verbinden...");
            sendOutQueue();
            doReset = false;
        }
    }, 2000);

	this.call = function(method, params, callback) {
		var id = Math.floor(Math.random() * 10000000);
		send(JSON.stringify({
			uri : method,
			parameters: params,
			refId: id
		}));
		callbackTable[id] = callback;
	};


	ws.onmessage = receiveMessage;
	
	function receiveMessage(event) {
        var data = JSON.parse(event.data);
        if ("error" in data && data.error !== null) {
            errorService.drawError("WS Error received: " + data.error, true);
            console.log("WS Error received: " + data.error);
        }
		if ("data" in data) {
			// Response
			if (callbackTable[data.refId] !== undefined) {
				callbackTable[data.refId](data.data);
			}
		}
		else {
			// Broadcast
			self.handleBroadcast(data.uri, data.parameters);
		}
	}

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
                roomId: "",
                question: {}
            },
            "func": ""
        },{
            "uri": "room:livePanic",
            "parameters": {
                panics: 0
            },
            "func": ""
        },{
            "uri": "room:panicStatus",
            "parameters": {
                isEnabled: false
            },
            "func": ""
        },{
            "uri": "answer:add",
            "parameters": {
                roomId: "",
                questionId: "",
                answer: {}
            },
            "func": ""
        },{
            "uri": "poll:do",
            "parameters": {
                roomId: "",
                arsObj: ""
            },
            "func": ""
        },{
            "uri": "poll:statistic",
            "parameters": {
                roomId: "",
                statistics: ""
            },
            "func": ""
        },{
            "uri": "quiz:do",
            "parameters": {
                roomId: "",
                quiz: ""
            },
            "func": ""
        },{
            "uri": "room:userCount",
            "parameters": {
                roomId: "",
                count: 0
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
        if (typeof funct != "function") {
            throw new Error("function is not a function");
        }
        if (Interface.data === undefined || Interface.data === null) {
            callback(new Error("Interface Data unset or undefined."));
        } else {
            var data = Interface.data;
            for (var i = data.length - 1; i >= 0; i--) {
                if (data[i].uri === uri) {
                    //run the assoc function with params and provided callback
                    data[i].func = funct;
                    return;
                }
            }
            callback(new Error("URI not found"));
        }
    };

    /**
     * Calls the functions attached to the invoke uri with the params object.
     * callback is also passed to this function for your own handling. if an error occurs, the first parameter will be set.
     **/
    this.handleBroadcast = function(invoke, params) {
        if (Interface.data === undefined || Interface.data === null) {
            callback(new Error("Interface Data unset or undefined."));
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
                    callback(new Error("URI not found"));
                } else {
                    throw err;
                }
            });
            
        }
    };

    this.ParamsOfURI = function(uri, callback) {
        //get params for uri
        if (Interface.data === undefined || Interface.data === null) {
            callback(new Error("Interface data not set or undefined."));
        } else if (typeof callback != "function") {
            throw new Error("callback is not a function");
        } else {
            var data = Interface.data;
            for (var i = data.length - 1; i >= 0; i--) {
                if (data[i].uri === uri) {
                    callback(null, data[i].parameters);
                    return;
                }
            }
            callback(new Error("URI not found"));
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
                    if(!(key in params)) {
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