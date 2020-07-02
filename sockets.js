const socketio = require("socket.io");
const socketEvent = require("./socketEvent");
const randomRaceEvent = require("./randomRaceEvents");

module.exports = {
  init: function (server) {
    const io = socketio(server);

    io.on("connection", (socket) => {
      console.log("A user is connected", socket.id);

      socketEvent.disconnect(io, socket);

      socketEvent.createorjoinroom(io, socket);

      socketEvent.startrace(io, socket);

      socketEvent.typing(io, socket);

      socketEvent.stoptyping(io, socket);

      //   randomRaceEvent.joinrandomrace(io, socket);
    });

    return io;
  },
};
