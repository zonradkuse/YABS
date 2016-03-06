module.exports = function (wsFrame) {
    wsFrame.on("user:createRoom", function (req, res) {
        res.setError("Not Implemented").send();
    });

    wsFrame.on("user:joinRoom", function (req, res) {
        res.setError("Not Implemented").send();
    });
};
