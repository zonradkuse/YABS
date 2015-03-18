module.exports = function(wsControl){
    wsControl.on("room:getQuestion", function(wss, ws, session, params, interfaceEntry, refId, sId){
        //params.roomId
    });

    wsControl.on("room:getAnswers", function(wss, ws, session, params, interfaceEntry, refId, sId){
        //params.roomId
        //params.questionId
    });
};