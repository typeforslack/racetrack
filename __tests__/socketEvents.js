const ioClient = require("socket.io-client");
const mockRedis = require("redis-mock");
const http = require("http");

const socketEvents = require("../socketEvent");
const sockets = require("../sockets");

const redis = mockRedis.createClient();
let socket, server, io;
let responseSocket = null;

const wait = (ms) => {
  return new Promise((res) => setTimeout(res, ms));
};

beforeAll((done) => {
  server = http.createServer();
  io = sockets.init(server);
  server.listen(3000, () => {
    console.log("Running!");
    done();
  });
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

  io.on("connection", (mySocket) => {
    responseSocket = mySocket;
    expect(mySocket).toBeDefined();
    socket.on("connect", () => {
      done();
    });
  });
});

afterEach((done) => {
  if (socket.connected) {
    socket.disconnect();
  }
  redis.flushall();
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

    socket.on("USER_JOINED", (msg) => {
      expect(msg).toBe("Room doesn't exists");
      expect(
        io.sockets.adapter.sids[responseSocket.id]["room-zeta"],
      ).toBeFalsy();
      done();
    });
  });

  it("case #2 -> Adding a user to a room", (done) => {
    const room = { timestamp: Math.floor(Date.now() / 1000), users: [] };
    redis.set("room-eplison", JSON.stringify(room));
    socket.emit("create/join", { username: "userOne", room: "eplison" });

    socket.on("USER_JOINED", (msg) => {
      expect(msg).toStrictEqual({
        room: "room-eplison",
        userInTheRoom: ["userOne"],
      });

      expect(
        io.sockets.adapter.sids[responseSocket.id]["room-eplison"],
      ).toBeTruthy();

      redis.get("room-eplison", (err, res) => {
        room.users.push({
          name: "userOne",
          socketId: responseSocket.id,
        });
        expect(res).toBe(JSON.stringify(room));
        done();
      });
    });
  });

  it("case #3 -> Not adding users when the race has started for a room", (done) => {
    redis.set(
      "room-zeta",
      JSON.stringify({
        isStarted: true,
        timestamp: Math.floor(Date.now() / 1000),
        users: [],
      }),
    );
    socket.emit("create/join", { username: "userOne", room: "zeta" });

    socket.on("RACE_STARTED", (msg) => {
      expect(msg).toBe("Race has already started");
      expect(
        io.sockets.adapter.sids[responseSocket.id]["room-zeta"],
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
      }),
    );

    socket.emit("create/join", { username: "userOne", room: "alpha" });
    await wait(500);
    socket.emit("create/join", { username: "userTwo", room: "alpha" });
    socket.on("ALREADY_JOINED", (msg) => {
      expect(msg).toBe("You have already joined the room!");
      done();
    });
  });
});
