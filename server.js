const express = require("express");
const crypto = require("crypto");
const { promisify } = require("util");

const app = express();

const server = require("http").createServer(app);
const io = require("socket.io")(server);
const redis = require("redis");
const PORT = 4000;

let redisClient = redis.createClient(6379, "127.0.0.1");
const aget = promisify(redisClient.get).bind(redisClient);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client.html");
});

app.get("/index", (req, res) => {
  res.send("Testing");
});

app.get("/generateraceAPI", (req, res) => {
  let hash = crypto.randomBytes(20).toString("hex");
  redisClient.get(hash, (err, room) => {
    if (room == null) {
      data = {
        hash: crypto.randomBytes(20).toString("hex"),
      };
      res.json(data);
    }
  });
});

io.on("connection", (socket) => {
  console.log("A user is connected");
  socket.on("disconnect", () => {
    redisClient.keys("*", (err, rooms) => {
      for (let i = 0; i < rooms.length; i++) {
        redisClient.get(rooms[i], (err, userintheroom) => {
          json_data = JSON.parse(userintheroom);
          for (let j = 0; j < json_data.length; j++) {
            if (socket.id == json_data[j].socketId) {
              io.to(rooms[i]).emit(
                "disconnected",
                `${json_data[j].name} has left the race`
              );
              json_data.splice(j, 1);
              redisClient.set(rooms[i], JSON.stringify(json_data));
            }
          }
        });
      }
    });

    console.log("Disconnected");
  });

  socket.on("create/join", async ({ room, username }) => {
    /*  
        {
          'room1':{'user1:'name','user2':'name'},
          'room2':{'user3':'name','user4':'name'},
        } 
    */

    socket.join(room);
    return aget(room)
      .then((res) => {
        if (res != null) {
          console.log("1st");
          res = JSON.parse(res);
          userDetails = {};
          userDetails.name = username;
          userDetails.socketId = socket.id;
          res.push(userDetails);
          redisClient.set(room, JSON.stringify(res));
          return;
        } else {
          newRoom = {};
          userDetails = {};
          userDetails.name = username;
          userDetails.socketId = socket.id;
          redisClient.set(room, JSON.stringify([userDetails]));

          return;
        }
      })
      .then((_) => {
        console.log("Triggered");
        redisClient.get(room, (err, res) => {
          res = JSON.parse(res);
          console.log(res);
          usernames = res.map((userData) => {
            return userData.name;
          });

          let serverData = {
            room: room,
            userInTheRoom: [usernames],
          };
          console.log("Joined");

          io.to(room).emit("userjoined", serverData);
        });
      });
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
