var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var ObjectId = mongoose.Schema.ObjectId;

var ImageSchema = mongoose.Schema({
    owner: {
        type: ObjectId,
        ref: 'User'
    },
    creationTime: {
        type: Date,
        default: Date.now
    },
    updateTime: {
        type: Date,
        default: Date.now
    },
    path: String,
    type: String,
    resolution: {
        width: Number, 
        height: Number
    },
    size: Number,
    visible: {
        type: Boolean,
        default: true
    }
});

ImageSchema.plugin(deepPopulate);
var Image = mongoose.model('Image', ImageSchema);
module.exports.Image = Image;
module.exports.ImageSchema = ImageSchema;

module.exports.get = function(imageID, callback){
    if(callback === undefined)
        throw new Error("callback not defined");
    Image.findById(imageID,function(err, img){
        if(err)
            return callback(new Error("Image not found."), null);
        callback(err, img);
    });
}