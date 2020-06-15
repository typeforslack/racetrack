const { helper, io, PORT, raceRooms, app, server } = require("./utils.js");

const socketEvent = require("./socketEvent.js");

console.log("SERVER");
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client.html");
});

app.get("/index", (req, res) => {
  res.send("Testing");
});

app.get("/generateraceAPI", (req, res) => {
  let hash = helper.generateNewHash();
  raceRooms.get(hash, (err, room) => {
    if (room == null) {
      data = {
        hash: hash,
      };
      res.json(data);
    } else {
      generateNewHash(previoushash);
    }
  });
});

io.on("connection", (socket) => {
  console.log("A user is connected");

  socketEvent.disconnect(socket);

  socketEvent.createorjoinroom(socket);

  socketEvent.startrace(socket);

  socketEvent.typing(socket);

  socketEvent.stoptyping(socket);
});

server.listen(PORT, () => {
  console.log(`Server is Running on port ${PORT}!`);
});
