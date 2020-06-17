const { io, raceRooms, app, server } = require("./utils.js");
const { PORT } = require("./constants.js");

const socketEvent = require("./socketEvent.js");
const helper = require("./helper.js");

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client.html");
});

app.get("/index", (req, res) => {
  res.send("Testing");
});

app.get("/createRaceRoom", (req, res) => {
  let hash = helper.generateNewHash();
  raceRooms.get(hash, (err, room) => {
    if (room == null) {
      data = {
        hash: hash,
      };
    } else {
      newhash = helper.generateNewHash(hash);
      data = {
        hash: newhash,
      };
    }
    res.json(data);
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
