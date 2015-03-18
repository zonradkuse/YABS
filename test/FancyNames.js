var moniker = require('moniker');
var fancyNames = moniker.generator([moniker.adjective, moniker.noun],{glue:' '});

for(var i=0; i<10; i++)
	console.log(fancyNames.choose().replace(/\b(\w)/g, function(m){ return m.toUpperCase() }));