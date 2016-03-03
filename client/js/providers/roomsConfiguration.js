/**
 * This services provides room configuration interface to server.
 *
 * @module Services/roomsConfiguration
 */
 
client.service("roomsConfiguration", ["rpc", function(rpc){

    this.toggleComponentDiscussion = function (room, status) {
        rpc.call("mod:setRoomConfigDiscussion", { roomId : room._id, status : status}, function(data){});
    };

    this.toggleComponentPanicbutton = function (room, status) {
        rpc.call("mod:setRoomConfigPanicbutton", { roomId : room._id, status : status}, function(data){});
    };

    this.toggleComponentQuiz = function (room, status) {
        rpc.call("mod:setRoomConfigQuiz", { roomId : room._id, status : status}, function(data){});
    };

    this.toggleUserMayAnswer = function (room, status) {
        rpc.call("mod:userMayAnswerToQuestion", { roomId : room._id, status : status}, function(data){});
    };

    this.toggleQuestionerMayMarkAnswer = function (room, status) {
        rpc.call("mod:questionerMayMarkAnswer", { roomId : room._id, status : status}, function(data){});
    };

    this.toggleMultiOptionPanic = function (room, status) {
        rpc.call("mod:multiOptionPanicButton", { roomId : room._id, status : status}, function(data){});
    };

    this.setPanicThreshold = function (room, value) {
        rpc.call("mod:thresholdForImportantQuestion", { roomId : room._id, val : value}, function(data){});
    };

    this.setExternalStudentsMayEnterRoom = function (room, status) {
        rpc.call("mod:externalStudentsMayEnterRoom", { roomId : room._id, status : status}, function(data){});
    };
}]);