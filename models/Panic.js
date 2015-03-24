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
            throw err;
        return callback(err,graph);
    });
}

/*
* @param room the room object of the target graph
* @param options used for deepPopulation
* @param callback params: error, panic event objects
*/
module.exports.getLiveEvents = function(room, options, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    var search = {room: room._id};
    PanicEvent.find(search).deepPopulate(options.population).exec(function(err,events){
        if(err)
            return callback(err,null);
        return callback(null,events);
    });
}

/*
* @param room the room object of the target graph
* @param options used for interval [begin, end]
* @param callback params: error, graph object
*/
module.exports.clusterEvents = function(room, options, callback){
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

//TODO check user permission
module.exports.panic = function(user, room, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    var p = new PanicEvent({room: room._id, user: user._id});
    p.save(function(err, panicEvent){
        if(err)
            throw err;
        return callback(null);
    });
}

//TODO check user permission
module.exports.unpanic = function(user, room, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    PanicEvent.find({room:room._id, user:user._id}).remove(function(err){
        if(err)
            throw err;
        return callback(null);
    });
}

var workerMap = [];

// @param intervals 
var RoomWorker = function(roomID, wss, intervals) {
    if(intervals.live === undefined)
        intervals.live = 3*1000;
    if(intervals.graph === undefined)
        intervals.graph = 60*1000;

    var self = this;

    this.graphDaemonTime = new Date();

    this.liveDaemon = setInterval(function(){
        module.exports.getLiveEvents({_id:roomID},{population:''},function(err, events){
            if(err)
                throw err;
            var data = { panics: events.length };
            //TODO send data with ws
            console.log(JSON.stringify(data,null,0));
        });
    }, intervals.live);


    this.graphDaemon = setInterval(function(){
        var endTime = new Date(self.graphDaemonTime.getTime()+intervals.graph);
        module.exports.clusterEvents({_id:roomID},{population:'', begin:self.graphDaemonTime, end:endTime},function(err){
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

module.exports.register = function(room, wss, intervals){
    workerMap[room._id] = new RoomWorker(room._id, wss, intervals);
}

module.exports.unregister = function(room){
    workerMap[room._id].stop();
    delete workerMap[room._id];
    //TODO clear live database of room
}
