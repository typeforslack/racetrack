const { io, raceRooms, app, server } = require("./utils.js");
const { expiryInSeconds, PORT } = require("./constants.js");

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
    if (room != null) {
      hash = helper.generateNewHash(hash);
    }
    data = {
      hash: hash,
    };
    dataStoredInTheRaceRoom = {
      timestamp: Math.floor(Date.now() / 1000),
      users: [],
    };
    /*
      {
        room1:{timestamp:4426425143,users:[]}
      }

    */
    raceRooms.set(
      hash,
      JSON.stringify(dataStoredInTheRaceRoom),
      "EX",
      expiryInSeconds
    );
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
