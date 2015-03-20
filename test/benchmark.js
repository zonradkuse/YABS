(function(){
    var WebSocket = require("ws");
    var Benchmark = function(number){
        var ws = new WebSocket("ws://localhost:8080");
        var start;
        ws.on("message", function(event){
            event = JSON.parse(event);
            if(event.data.message !== "welcome") {
                console.log("[REQUEST " + number + "] " + (Date.now() - start) + "ms");
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

    var j = 100;
    while(j > 0){
        setTimeout(function(){
            for (var i = 10; i >= 0; i--) {
                new Benchmark(i);
            };
        }, j + 500);
        j--;
    }
    


})();