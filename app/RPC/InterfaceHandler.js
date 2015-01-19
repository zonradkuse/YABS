var Interface = require('./Interface.json');

function attachFunction(uri, funct, callback){
    if(typeof funct != 'function'){
        throw new Error('function is not a function');
        return;
    }
    if(typeof callback != 'function'){
        throw new Error('callback is not a function.')
    }else if(Interface.data === undefined || Interface.data === null){
        callback(new Error('Interface Data unset or undefined.'));
    }else{
        var data = Interface.data;
        for (var i = data.length - 1; i >= 0; i--) {
            if (data[i].uri === uri){
                //run the assoc function with params and provided callback
                data[i].func = funct
                return;
            }
        }
        callback(new Error('URI not found'),null);
    }
}

function getInterface(callback){
    (Interface != undefined) ? callback(null, Interface) : callback(new Error('Interface is undefined')) 
}

function setInterface(json, callback){
    if(json != null && json != undefined){
        Interface = json;
        if(typeof callback === 'function'){
            callback(null);
        }
    } else {
        if(typeof callback === 'function'){
            callback(new Error('Passed Interface is null or undefined'));
        }
    }
}

function call(invoke, params, callback){
    if(typeof callback != 'function'){
        throw new Error('callback is not a function');
        return;
    }
    if(Interface.data === undefined || Interface.data === null){
        callback(new Error('Interface Data unset or undefined.'));
    }else{
        var data = Interface.data;
        for (var i = data.length - 1; i >= 0; i--) {
            if (data[i].uri === invoke){
                //run the assoc function with params and provided callback
                if(params != undefined && params != null)
                    data[i].func(params, callback);
                return;
            }
        }
        callback(new Error('URI not found'),null);
    }
}

function ParamsOfURI(uri, callback){
    //get params for uri
    if(Interface.data == undefined || Interface.data == null){
        callback(new Error('Interface data not set or undefined.'));
    }else if (typeof callback != 'function'){
        throw new Error('callback is not a function');
    }else{
        var data = Interface.data;
        for (var i = data.length - 1; i >= 0; i--) {
            if (data[i].uri === uri){
                callback(null, data[i].parameters)
                return;
            }
        }
        callback(new Error('URI not found'));
    }
    
}

module.exports.call = call;
module.exports.setInterface = setInterface;
module.exports.getInterface = getInterface
module.exports.params = ParamsOfURI;
module.exports.attachFunction = attachFunction;