const {
  request,
  io,
  raceRooms,
  syncraceget,
  paraTypedByUser,
  expiryInSeconds,
  TFSBackendURL,
} = require("./utils.js");

console.log("EVENTS");

exports.disconnect = function (socket) {
  socket.on("disconnect", () => {
    raceRooms.keys("*", (err, rooms) => {
      for (let i = 0; i < rooms.length; i++) {
        raceRooms.get(rooms[i], (err, userintheroom) => {
          json_data = JSON.parse(userintheroom);
          for (let j = 0; j < json_data.length; j++) {
            if (socket.id == json_data[j].socketId) {
              io.to(rooms[i]).emit(
                "disconnected",
                `${json_data[j].name} has left the race`
              );
              json_data.splice(j, 1);
              raceRooms.set(rooms[i], JSON.stringify(json_data));
            }
          }
        });
      }
    });

    console.log("Disconnected");
  });
};

exports.createorjoinroom = function (socket) {
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
      return syncraceget(room)
        .then((res) => {
          if (res != null) {
            res = JSON.parse(res);
            if (res[0] != true) {
              userDetails = {};
              userDetails.name = username;
              userDetails.socketId = socket.id;
              res.push(userDetails);
              raceRooms.set(room, JSON.stringify(res));
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
            raceRooms.set(
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

            raceRooms.get(room, (err, res) => {
              res = JSON.parse(res);
              usernames = res
                .map((userData) => {
                  if (userData.name != undefined) {
                    return userData.name;
                  }
                })
                .filter((data) => data != null);

              let serverData = {
                room: room,
                userInTheRoom: [usernames],
              };
              console.log("Joined");

              io.in(room).emit("USER_JOINED", serverData);
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });
};

exports.startrace = function (socket) {
  socket.on("START_RACE", ({ room }) => {
    startRace = true;
    let paraTypedByTheUserInTheRoom = [];

    return syncraceget(room)
      .then((res) => {
        return new Promise((resolve) => {
          jsonData = JSON.parse(res);
          console.log(jsonData[0]);
          jsonData[0] != true ? jsonData.unshift(true) : null;
          raceRooms.set(room, JSON.stringify(jsonData));
          for (userDetails of jsonData) {
            if (userDetails.name != undefined) {
              paraTypedByUser.get(userDetails.name, (err, res) => {
                if (res == null) {
                  paraTypedByUser.set(
                    userDetails.name,
                    JSON.stringify([1, 2, 3])
                  );
                  resolve();
                } else {
                  res = JSON.parse(res);
                  paraTypedByTheUserInTheRoom.push(...res);
                  resolve();
                }
              });
            }
          }
        });
      })
      .then((_) => {
        request.get(
          {
            url: TFSBackendURL,
            qs: { data: JSON.stringify(paraTypedByTheUserInTheRoom) },
          },
          (err, res, body) => {
            if (err) {
              console.log(err);
            } else {
              console.log(res.body);
              io.in(room).emit("USER_JOINED", res.body);
            }
          }
        );
      });
  });
};

exports.typing = function (socket) {
  socket.on("Typing", ({ room, message }) => {
    console.log(message);
    socket.to(room).emit("Typing", message);
  });
};

exports.stoptyping = function (socket) {
  socket.on("donetyping", ({ username }) => {
    socket.to(room).emit("donetyping", "username has finished typing");
  });
};
