var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var PanicEventSchema = mongoose.Schema({
    user: { type: ObjectId, ref: 'User' },
    room: { type: ObjectId, ref: 'Room' },
    time: { type: Date, default: Date.now }
});

var PanicGraphSchema = mongoose.Schema({
    startTime: { type: Date },
    endTime: { type: Date },
    room: { type: ObjectId, ref: 'Room' },
    data: [{ time: { type: Date, default: Date.now }, 
            panics: { type: Number } }]
});

PanicEventSchema.plugin(deepPopulate);
PanicGraphSchema.plugin(deepPopulate);
var PanicEvent = mongoose.model('PanicEvent', PanicEventSchema);
var PanicGraph = mongoose.model('PanicGraph', PanicGraphSchema);
module.exports.PanicEvent = PanicEvent;
module.exports.PanicGraph = PanicGraph;

/*
* @param room the room object of the target graph
* @param options used for deepPopulation
* @param callback params: error, graph object
*/
module.exports.getGraph = function(room, options, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    PanicGraph.findOne({room: room._id}).deepPopulate(options.population).exec(function(err,graph){
        if(err)
            return callback(err, null);
        return callback(null,graph);
    });
}

/*
* @param room the room object of the target graph
* @param options used for deepPopulation
* @param callback params: error, panic event objects
*/
var getLiveEvents = function(room, options, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    PanicEvent.find({room: room._id}).deepPopulate(options.population).exec(function(err,events){
        if(err)
            return callback(err,null);
        return callback(null,events);
    });
}

/*
* @param room the room object of the target graph
* @param options used for interval [begin, end]
* @param callback params: error
*/
var clusterEvents = function(room, options, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    var search = {room: room._id};
    if(options.begin !== undefined && options.end !== undefined)
        search.time = {$gte: options.begin, $lte: options.end};
    else if(options.begin !== undefined)
        search.time = {$gte: options.begin};
    else if(options.end !== undefined)
        search.time = {$lte: options.end};
    PanicEvent.find(search).exec(function(err, panicEvents){
        if(err)
            return callback(err);
        var data = {time: (options.end !== undefined) ? options.end : new Date(),
            panics: panicEvents.length};
        PanicGraph.update({room: room._id},{$push:{'data': data}},
            {upsert:true},function(err, graph){
                if(err)
                    return callback(err)
            return callback(null);
        });        
    });
}

/*
* @param room the room object of the live events
* @param callback params: error
*/
var removeLiveEvents = function(room, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    PanicEvent.find({room: room._id}).remove(function(err){
        if(err)
            return callback(err);
        return callback(null);
    });
}

/*
* @param user the user object which should be checked
* @param callback params: error, panic event object
*/
module.exports.hasUserPanic = function(user, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    PanicEvent.findOne({user: user._id}).exec(function(err, panicEvent){
        if(err)
            return callback(err, false);
        return callback(null, panicEvent);
    });
}

/*
* @param user the user object which has panic
* @param room the room object of the panic event
* @param callback params: error
*/
module.exports.panic = function(user, room, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    if(workerMap[room._id] === undefined)
        return callback(new Error("Room not registered"));
    module.exports.hasUserPanic(user, function(err, panicEvent){
        if(err)
            return callback(err);
        if(panicEvent)
            return callback(new Error("User has already panic"));
        var p = new PanicEvent({room: room._id, user: user._id});
        p.save(function(err, panicEvent){
            if(err)
                return callback(err);
            return callback(null);
        });
    });
}

/*
* @param user the user object which has no panic anymore
* @param room the room object of the panic event
* @param callback params: error
*/
module.exports.unpanic = function(user, room, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    if(workerMap[room._id] === undefined)
        return callback(new Error("Room not registered"));
    PanicEvent.find({room:room._id, user:user._id}).remove(function(err){
        if(err)
            return callback(err);
        return callback(null);
    });
}

var workerMap = [];

/*
* @param roomID the ID of the target room object
* @param wss the websocket object to communicate
* @param intervals object within intervals for live update and graph clustering
*/
var RoomWorker = function(roomID, ws, intervals) {
    if(intervals.live === undefined)
        intervals.live = 3*1000;
    if(intervals.graph === undefined)
        intervals.graph = 60*1000;

    var self = this;

    this.graphDaemonTime = new Date();

    this.liveDaemon = setInterval(function(){
        getLiveEvents({_id:roomID},{population:''},function(err, events){
            if(err)
                throw err;
            var data = { panics: events.length };
            //TODO send data with ws
            console.log(JSON.stringify(data,null,0));
        });
    }, intervals.live);


    this.graphDaemon = setInterval(function(){
        var endTime = new Date(self.graphDaemonTime.getTime()+intervals.graph);
        clusterEvents({_id:roomID},{population:'', end:endTime},function(err){
            if(err)
                throw err;
            self.graphDaemonTime = endTime;
        });
    }, intervals.graph);
};

RoomWorker.prototype.stop = function(){
    clearInterval(this.liveDaemon);
    clearInterval(this.graphDaemon);
}

/*
* @param room the room object to be registered
* @param ws the websocket object to communicate
* @param intervals object within intervals for live update and graph clustering
* @param callback params: error
*/
module.exports.register = function(room, ws, intervals, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    workerMap[room._id] = new RoomWorker(room._id, ws, intervals);
    return callback(null);
}

/*
* @param room the room object to be unregistered
* @param callback params: error
*/
module.exports.unregister = function(room, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    if(workerMap[room._id] === undefined)
        return callback(new Error("Room not registered"));
    workerMap[room._id].stop();
    delete workerMap[room._id];
    removeLiveEvents(room,function(err){
        if(err)
            return callback(err);
        return callback(null);
    });
}
