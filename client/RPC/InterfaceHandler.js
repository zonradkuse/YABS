var Interface = {
    "data": [{
        "uri": "getQuestions",
        "parameters": {
            "threadId": ""
        },
        "func": ""
    }, {
        "uri": "getAnswers",
        "parameters": {
            "questionId": ""
        },
        "func": ""
    }, {
        "uri": "getLogs",
        "parameters": {
            "category": ""
        },
        "func": ""
    }, {
        "uri": "vote",
        "parameters": {
            "question": "true",
            "Id": ""
        },
        "func": "",
        "broadcast": true
    }, {
        "uri": "getRooms",
        "parameters": {
            "userId": "",
            "sessionCookie": ""
        },
        "func": ""
    }]
} //will be extended.

/*!
 * attaches funct to uri function and calls callback with error if needed.
 */

function attachFunction(uri, funct, callback) {
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
}

function getInterface(callback) {
    (Interface !== undefined) ? callback(null, Interface): callback(new Error('Interface is undefined'));
}

function setInterface(json, callback) {
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
}

/*!
 * Calls the functions attached to the invoke uri with the params object. params is json formatted!
 * callback is also passed to this function for your own handling. if an error occurs, the first parameter will be set.
 */

function call(invoke, params, callback, userid) {
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
                    data[i].func(params, callback, userid);
                return;
            }
        }
        callback(new Error('URI not found'));
    }
}

function ParamsOfURI(uri, callback) {
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

}