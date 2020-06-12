const express = require("express");
const app = express();
const crypto = require("crypto");
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const PORT = 4000;

rooms = {};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client.html");
});

app.get("/index", (req, res) => {
  res.send("Testing");
});

app.get("/generateraceAPI", (req, res) => {
  data = {
    hash: crypto.randomBytes(20).toString("hex"),
  };
  res.json(data);
});

io.on("connection", (socket) => {
  console.log("A user is connected");
  socket.on("disconnect", () => {
    for (data in rooms) {
      for (let i = 0; i < rooms[data].length; i++) {
        if (socket.id == rooms[data][i].socketId) {
          rooms[data].splice(i, 1);
        }
      }
    }
    console.log("Disconnected");
  });

  socket.on("create/join", ({ room, username }) => {
    socket.join(room);

    if (room in rooms) {
      userDetails = {};
      userDetails.name = username;
      userDetails.socketId = socket.id;
      rooms[room].push(userDetails);
    } else {
      newRoom = {};
      userDetails = {};
      userDetails.name = username;
      userDetails.socketId = socket.id;
      rooms[room] = [userDetails];
    }

    usernames = rooms[room].map((userData) => {
      return userData.name;
    });

    let serverData = {
      room: room,
      userInTheRoom: [usernames],
    };
    console.log("Joined");

    io.to(room).emit("userjoined", serverData);
  });

  socket.on("Typing", ({ room, message }) => {
    console.log(message);
    socket.to(room).emit("Typing", message);
  });

  socket.on("donetyping", ({ username }) => {
    socket.to(room).emit("donetyping", "username has finished typing");
  });
});

server.listen(PORT, () => {
  console.log(`Server is Running on port ${PORT}!`);
});
