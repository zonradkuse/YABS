(function(){
    var WebSocket = require("ws");
    var Benchmark = function(number){
        var ws = new WebSocket("ws://lanzarote.informatik.rwth-aachen.de:8080");
        var start;
        ws.on("message", function(event){
            event = JSON.parse(event);
            if(event.data.message !== "welcome") {
                console.log(number + " " + (Date.now() - start));
                ws.close();
            }
        });
        
        ws.on("open", function(){
            var json = { uri : "system:benchmark", parameters : {}, refId: "bug2p"};
            start = Date.now();
            ws.send(JSON.stringify(json));
        });

        ws.on("error", function(err){
            console.log("CONNECTION DUMP");
        });
    }

    var j = 1;
    while(j > 0){
        setTimeout(function(){
            for (var i = 1000; i >= 0; i--) {
                new Benchmark(i);
            };
        }, j);
        j--;
    }
    


})();