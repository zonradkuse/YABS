var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var PanicEventSchema = mongoose.Schema({
    user: { type: ObjectId, ref: 'User' },
    room: { type: ObjectId, ref: 'Room' },
    time: { type: Date, default: Date.now }
});

PanicEventSchema.plugin(deepPopulate);
var PanicEvent = mongoose.model('PanicEvent', PanicEventSchema);
module.exports.PanicEvent = PanicEvent;


/*
* @param room the room object of the target graph
* @param options used for deepPopulation
* @param callback params: error, panic event objects
*/
module.exports.getAll = function(room, options, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    PanicEvent.find({room: room._id}).deepPopulate(options.population).exec(function(err,events){
        if(err)
            return callback(err,null);
        return callback(null,events);
    });
}

/*
* @param room the room object of the live events
* @param callback params: error
*/
module.exports.remove = function(room, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    PanicEvent.find({room: room._id}).remove(function(err){
        if(err)
            return callback(err);
        return callback(null);
    });
}


