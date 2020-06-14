const express = require("express");
const redis = require("redis");
const { promisify } = require("util");
const helper = require("./helper.js");

const app = express();

const server = require("http").createServer(app);
const io = require("socket.io")(server);

const PORT = 4000;
const expiryInSeconds = 3600;
const raceStartingTime = 10;

let redisClient = redis.createClient(6379, "127.0.0.1");
const aget = promisify(redisClient.get).bind(redisClient);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client.html");
});

app.get("/index", (req, res) => {
  res.send("Testing");
});

app.get("/generateraceAPI", (req, res) => {
  let hash = helper.generateNewHash();
  redisClient.get(hash, (err, room) => {
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
          'room1':8ms,[{'user1:'name'},{'user2':'name'}],
          'room2':{'user3':'name','user4':'name'},
        } 
    */
    userExistsAlready = io.sockets.adapter.sids[socket.id][room];
    if (userExistsAlready) {
      io.to(socket.id).emit(
        "ALREADY_JOINED",
        "You have already joined the room!"
      );
    } else {
      return aget(room)
        .then((res) => {
          if (res != null) {
            res = JSON.parse(res);
            time = Math.floor(Date.now() / 1000);
            diff = time - res[0];
            if (diff < raceStartingTime) {
              userDetails = {};
              userDetails.name = username;
              userDetails.socketId = socket.id;
              res.push(userDetails);
              redisClient.set(room, JSON.stringify(res), "EX", expiryInSeconds);
              return;
            } else {
              io.to(socket.id).emit("RACE_STARTED", "Race has already started");
              return false;
            }
          } else {
            time = Math.floor(Date.now() / 1000);
            userDetails = {};
            userDetails.name = username;
            userDetails.socketId = socket.id;
            redisClient.set(
              room,
              JSON.stringify([time, userDetails]),
              "EX",
              expiryInSeconds
            );
            return;
          }
        })
        .then((userAddedInRedis = true) => {
          if (userAddedInRedis == true) {
            socket.join(room);

            // io.of("/")
            //   .in(room)
            //   .clients((err, client) => {
            //     console.log(client);
            //   });

            redisClient.get(room, (err, res) => {
              res = JSON.parse(res);
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
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
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
