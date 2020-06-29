const ioClient = require("socket.io-client");
const { io, server } = require("../utils");
const socketEvents = require("../socketEvent");

let socket;
let responseSocket = null;

beforeAll((done) => {
  io;
  server.listen(4000, () => {
    console.log("Running!");
  });
  done();
});

afterAll((done) => {
  io.close();
  done();
});

beforeEach((done) => {
  socket = ioClient.connect(`http://localhost:4000`, {
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

  it("createorjoinroom -> case #1, When room doesn't exists", (done) => {
    socket.emit("create/join", { username: "userOne", room: "zeta" });
    socketEvents.createorjoinroom(responseSocket);

    socket.on("USER_JOINED", (msg) => {
      expect(msg).toBe("Room doesn't exists");
      done();
    });
  });
});
