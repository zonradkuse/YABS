/** @module Image-Model */

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
/**
 * @class
 * @classdesc This is a moongose schema for an image.
 * @property {ObjectId} owner - user refId
 * @property {Date} creationTime=Date.now - creation time
 * @property {Date} updateTime=Date.now - the time when the last change has been performed
 * @property {String} path - path to image on server
 * @property {String} type - image type (png,jpg,...)
 * @property {Object} resolution - resolution in pixels
 * @property {Number} resolution.width - width
 * @property {Number} resolution.height - height
 * @property {Number} size - size in bytes
 * @property {Boolean} visible=true - visibility
 * @example
 * new Image({owner: ObjectId{User}, path: "", type: "png", resolution: {width:100, height:100}, size: 4096});
 */
var Image = mongoose.model('Image', ImageSchema);
module.exports.Image = Image;
module.exports.ImageSchema = ImageSchema;

/** Get image object by ObjectId.
 * @param {ObjectId} imageID - ObjectId of image
 * @param {imageCallback} callback - callback function
 */
module.exports.get = function (imageID, callback) {
	if (callback === undefined) {
		throw new Error("callback not defined");
	}
	Image.findById(imageID, function (err, img) {
		if (err) {
			return callback(new Error("Image not found."), null);
		}
		callback(err, img);
	});
};

/**
 * @callback imageCallback
 * @param {Error} err - if an error occurs
 * @param {Image} image - updated image object
 */
