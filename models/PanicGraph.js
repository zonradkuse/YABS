var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var PanicGraphSchema = mongoose.Schema({
    room: { type: ObjectId, ref: 'Room' },
    data: [{ time: { type: Date, default: Date.now }, 
            panics: { type: Number } }]
});

PanicGraphSchema.plugin(deepPopulate);
var PanicGraph = mongoose.model('PanicGraph', PanicGraphSchema);
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
};