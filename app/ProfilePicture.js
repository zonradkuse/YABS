var config = require('../config.json');
var logger = require('./Logger.js');
var imageDAO = require('../models/Image.js');
var fs = require('fs');
var path = require('path').join(__dirname, '/../public/avatar/');

//requires imagemagick (simple apt-get install)
var gen = require('avatar-generator')({});

module.exports.generate = function(user, gender, size, callback){
	
	fs.mkdir(path, function(err){
		//TODO generate image name with user._id
		var stream = fs.createWriteStream(path+user._id+'.png');
		gen(user._id|(new Date()).valueOf().toString(),gender,size).stream().pipe(stream);
		callback();
	});

};

module.exports.generate({_id:89239126927912199},'male',250,function(){});