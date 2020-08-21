const ioClient = require("socket.io-client");
const mockRedis = require("redis-mock");
const http = require("http");
const axios = require("axios");

const sockets = require("../sockets");

jest.mock("axios");

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
  redis.flushall();
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
        io.sockets.adapter.sids[responseSocket.id]["room-zeta"]
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
        io.sockets.adapter.sids[responseSocket.id]["room-eplison"]
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
      })
    );
    socket.emit("create/join", { username: "userOne", room: "zeta" });

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

    await wait(500);

    socket.emit("create/join", { username: "userOne", room: "alpha" });
    socket.on("ALREADY_JOINED", (msg) => {
      expect(msg).toBe("You have already joined the room!");
      done();
    });
  });
});

describe("Test for startRace socket event, Expected to emit  para to the users in the room", () => {
  it('case #1 -> Emitting "START_RACE" event from the client during race between friends', async (done) => {
    const room = { timestamp: Math.floor(Date.now() / 1000), users: [] };
    const body = { id: 1, para: "Awesome !", taken_from: "Green" };

    clientSocket2 = ioClient.connect(`http://localhost:3000`, {
      "reconnection delay": 0,
      "reopen delay": 0,
      "force new connection": true,
      transports: ["websocket"],
    });

    redis.set("room-beta", JSON.stringify(room));

    axios.get.mockResolvedValue({
      status: 200,
      data: body,
    });

    socket.emit("create/join", { username: "AnotherUser", room: "beta" });

    await wait(100);

    clientSocket2.emit("create/join", {
      username: "AnotherUserTwo",
      room: "beta",
    });

    await wait(100);

    socket.emit("START_RACE", { room: "beta" });
    clientSocket2.on("PARA", (msg) => {
      expect(msg).toBe("Awesome !");
    });
    socket.on("PARA", (msg) => {
      expect(msg).toBe("Awesome !");
    });

    await wait(10);

    redis.get("room-beta", (err, response) => {
      response = JSON.parse(response);
      expect(response.isStarted).toBeTruthy();
      expect(response.users.length).toBe(2);
    });
    redis.get("AnotherUser-paras", (err, response) => {
      expect(JSON.parse(response)).toStrictEqual([1]);
    });
    redis.get("AnotherUserTwo-paras", (err, response) => {
      expect(JSON.parse(response)).toStrictEqual([1]);
      done();
    });
  });
});

describe("Test for joining random race", () => {
  it("Expect user to join a random room and emit a para to the room", async (done) => {
    const body = { id: 1, para: "Awesome !", taken_from: "Green" };

    clientSocket2 = ioClient.connect(`http://localhost:3000`, {
      "reconnection delay": 0,
      "reopen delay": 0,
      "force new connection": true,
      transports: ["websocket"],
    });

    axios.get.mockResolvedValue({
      status: 200,
      data: body,
    });

    socket.emit("JOIN_RANDOM_RACE", { username: "randomRaceUserOne" });

    await wait(100);

    clientSocket2.emit("JOIN_RANDOM_RACE", { username: "randomRaceUserTwo" });

    clientSocket2.on("PARA", (msg) => {
      expect(msg).toBe("Awesome !");
    });

    socket.on("PARA", (msg) => {
      expect(msg).toBe("Awesome !");
    });

    await wait(10000);

    redis.get("randomRaceUserOne-paras", (err, response) => {
      expect(JSON.parse(response)).toStrictEqual([1]);
    });
    redis.get("randomRaceUserTwo-paras", (err, response) => {
      expect(JSON.parse(response)).toStrictEqual([1]);
      done();
    });
  }, 15000);
});
