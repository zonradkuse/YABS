var Interface = require('./Interface.json');

function getInterface(){
    return Interface;
}
function setInterface(json, callback){
    for (var i = json.length - 1; i >= 0; i--) {
        if(json[i].uri != undefined && json[i].parameters != undefined && json[i].func != undefined){
            Interface = json;
        } 
    };
}

function call(invoke, params, callback){
    if(Interface.data === undefined || Interface.data === null){
        callback(new Error('Interface Data unset or undefined.'));
    }else{
        var set = false;
        var data = Interface.data;
        for (var i = data.length - 1; i >= 0; i--) {
            if (data[i].uri === invoke){
                //run the assoc function with params and provided callback
                console.log(data[i].uri);
                data[i].func(params, callback);
                break;
            }
        };
    }
}

function ParamsOfURI(uri, params, callback){
    //get params for uri
    if(Interface.data == undefined || Interface.data == null){
        callback(new Error('Interface Data unset or undefined.'));
    }else{
        var set = false;
        var data = Interface.data;
        for (var i = data.length - 1; i >= 0; i--) {
            if (data[i].uri === uri){
                callback(null, parameters);
                set = true;
                break;
            }
        };
        if(!set){
            callback(null,null);
        }
    }
}

module.exports.call = call;
module.exports.setInterface = setInterface;
module.exports.getInterface = getInterface
module.exports.params = ParamsOfURI;