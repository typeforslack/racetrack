const ioClient = require("socket.io-client");
const { io, server } = require("../utils");
const socketEvents = require("../socketEvent");
const redis = require("../redisHelper");
const redisMock = require("redis-mock");

let socket;
let responseSocket = null;

const r = redisMock.createClient();

const wait = (ms) => {
  return new Promise((res) => setTimeout(res, ms));
};

beforeAll((done) => {
  io;
  server.listen(3000, () => {
    console.log("Running!");
  });
  done();
});

afterAll((done) => {
  io.close();
  server.close();
  done();
});

beforeEach((done) => {
  socket = ioClient.connect(`http://localhost:3000`, {
    "reconnection delay": 0,
    "reopen delay": 0,
    "force new connection": true,
    transports: ["websocket"],
  });
  socket.on("connect", () => {
    done();
  });
  io.on("connection", (mySocket) => {
    responseSocket = mySocket;
    expect(mySocket).toBeDefined();
    done();
  });
});

afterEach((done) => {
  if (socket.connected) {
    socket.disconnect();
  }
  r.flushall();
  done();
});

describe("Socket Test ! ", () => {
  it("Initial Connection -> Should connect a user to the socket", (done) => {
    io.emit("echo", "Connected");
    socket.on("echo", (message) => {
      expect(message).toBe("Connected");
      done();
    });
  });
});

describe("Test for various scenario for createorjoinroom socket event", () => {
  it("case #1 -> When room doesn't exists", async (done) => {
    socket.emit("create/join", { username: "userOne", room: "zeta" });
    socketEvents.createorjoinroom(responseSocket);
    socket.on("USER_JOINED", (msg) => {
      expect(msg).toBe("Room doesn't exists");
      expect(
        io.sockets.adapter.sids[responseSocket.id]["room-zeta"]
      ).toBeFalsy();
      done();
    });
  });

  it("case #2 -> Adding a user to a room", (done) => {
    redis.set(
      "room-eplison",
      JSON.stringify({ timestamp: Math.floor(Date.now() / 1000), users: [] })
    );
    socket.emit("create/join", { username: "userOne", room: "eplison" });
    socketEvents.createorjoinroom(responseSocket);
    socket.on("USER_JOINED", (msg) => {
      expect(msg).toStrictEqual({
        room: "room-eplison",
        userInTheRoom: ["userOne"],
      });
      expect(
        io.sockets.adapter.sids[responseSocket.id]["room-eplison"]
      ).toBeTruthy();
      done();
    });
  });

  it("case #3 -> Not adding users when the race has started for a room", (done) => {
    redis.set(
      "room-zeta",
      JSON.stringify({
        isStarted: true,
        timestamp: Math.floor(Date.now() / 1000),
        users: [],
      })
    );
    socket.emit("create/join", { username: "userOne", room: "zeta" });
    socketEvents.createorjoinroom(responseSocket);
    socket.on("RACE_STARTED", (msg) => {
      expect(msg).toBe("Race has already started");
      expect(
        io.sockets.adapter.sids[responseSocket.id]["room-zeta"]
      ).toBeFalsy();
      done();
    });
  });
  it("case #4 -> Not adding a user, when the user is already added to the room", async (done) => {
    redis.set(
      "room-alpha",
      JSON.stringify({
        timestamp: Math.floor(Date.now() / 1000),
        users: [],
      })
    );
    socket.emit("create/join", { username: "userOne", room: "alpha" });
    socket.emit("create/join", { username: "userTwo", room: "alpha" });
    socketEvents.createorjoinroom(responseSocket);
    socket.on("ALREADY_JOINED", (msg) => {
      expect(msg).toBe("You have already joined the room!");
      done();
    });
  });
});
