var fromRemoteRPC = {};

    fromRemoteRPC.Interface = {
        "data": [{
            "uri": "system:ping",
            "parameters": {},
            "func": ""
        },{
            "uri": "system:login",
            "parameters": {},
            "func": ""
        }]
    }; //will be extended.
    
    /**
     * attaches funct to uri function and calls callback with error if needed.
     *
     * @param funct - gets parameters (params, callback, refId).
     *                  params: the params object as specified in interface
     *                  callback: a callback you can handle - should be used for err.
     *                  refId: reference that comes from the server.
     **/
    
    fromRemoteRPC.attachFunction = function(uri, funct, callback) {
        if (typeof funct != 'function') {
            throw new Error('function is not a function');
        }
        if (typeof callback != 'function') {
            throw new Error('callback is not a function.');
        } else if (Interface.data === undefined || Interface.data === null) {
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
    
    fromRemoteRPC.getInterface = function(callback) {
        (Interface !== undefined) ? callback(null, Interface): callback(new Error('Interface is undefined'));
    };
    
    fromRemoteRPC.setInterface = function(json, callback) {
        if (json !== null && json !== undefined) {
            Interface = json;
            if (typeof callback === 'function') {
                callback(null);
            }
        } else {
            if (typeof callback === 'function') {
                callback(new Error('Passed Interface is null or undefined'));
            }
        }
    };
    
    /**
     * Calls the functions attached to the invoke uri with the params object. params is json formatted!
     * callback is also passed to this function for your own handling. if an error occurs, the first parameter will be set.
     **/
    
    fromRemoteRPC.call = function(invoke, params, callback, refId) {
        if (typeof callback !== 'function') {
            throw new Error('callback is not a function');
        }else if (Interface.data === undefined || Interface.data === null) {
            callback(new Error('Interface Data unset or undefined.'));
        } else {
            var data = Interface.data;
            for (var i = data.length - 1; i >= 0; i--) {
                if (data[i].uri === invoke) {
                    //run the assoc function with params and provided callback
                    if (params !== undefined && params !== null)
                        data[i].func(params, callback, refId);
                    return;
                }
            }
            callback(new Error('URI not found'));
        }
    };
    
    fromRemoteRPC.ParamsOfURI = function(uri, callback) {
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
    fromRemoteRPC.checkParameters = function(uri, params){
        fromRemoteRPC.ParamsOfURI(uri, function(err, _params){
            if(err) {
                throw err;
            }
            if(_params){
                var c = 0;
                for (var key in _params) {
                    if(key !== Object.getOwnPropertyNames(params)[c]) {
                        throw new Error("parameter objects not matching (tested");
                    }
                    c += 1;
                }
            }
        });
    };
};
