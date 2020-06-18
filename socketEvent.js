const {
  request,
  io,
  raceRooms,
  syncraceget,
  paraTypedByUser,
} = require("./utils.js");

const { expiryInSeconds, TFSBackendURL } = require("./constants.js");

exports.disconnect = function (socket) {
  socket.on("disconnect", () => {
    raceRooms.keys("*", (err, rooms) => {
      for (let i = 0; i < rooms.length; i++) {
        raceRooms.get(rooms[i], (err, userintheroom) => {
          json_data = JSON.parse(userintheroom);
          for (let j = 0; j < json_data.length; j++) {
            if (socket.id == json_data[j].socketId) {
              io.to(rooms[i]).emit(
                "DISCONNECTED",
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
              'room1':{isStarted:true,timestamp:123345,users:[{'user1':'name'},{'user2':'name'}]}
              'room2':[315153,{'user3':'name'},{'user4':'name'}],
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
              return res;
            } else {
              io.to(socket.id).emit("RACE_STARTED", "Race has already started");
              return false;
            }
          } else {
            // Trigger ROOM_NOT_FOUND
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
            return [userDetails];
          }
        })
        .then((createdRoom) => {
          if (createdRoom) {
            socket.join(room);

            // To get the clients of the room stored in the socket
            // io.of("/")
            //   .in(room)
            //   .clients((err, client) => {
            //     console.log(client);
            //   });
            usernames = createdRoom
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
    userintheroom = [];
    let paraTypedByTheUserInTheRoom = [];
    let uniqueParaTypedByTheUserInTheRoom = [];

    return syncraceget(room)
      .then((res) => {
        return new Promise((resolve) => {
          jsonData = JSON.parse(res);
          jsonData[0] != true ? jsonData.unshift(true) : null;
          raceRooms.set(room, JSON.stringify(jsonData));
          for (userDetails of jsonData) {
            if (userDetails.name != undefined) {
              userintheroom.push(userDetails.name);
              paraTypedByUser.get(userDetails.name, (err, res) => {
                if (res == null) {
                  paraTypedByUser.set(userDetails.name, "[]");
                  resolve();
                } else {
                  res = JSON.parse(res);
                  paraTypedByTheUserInTheRoom.push(...res);
                  removedDuplicateValues = new Set(paraTypedByTheUserInTheRoom);
                  uniqueParaTypedByTheUserInTheRoom = [
                    ...removedDuplicateValues,
                  ];
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
            qs: { data: JSON.stringify(uniqueParaTypedByTheUserInTheRoom) },
          },
          (err, res, body) => {
            if (err) {
              console.log(err);
            } else {
              paraFetchedId = JSON.parse(res.body).id;
              for (user of userintheroom) {
                paraTypedByUser.get(user, (err, res) => {
                  jsonRes = JSON.parse(res);
                  jsonRes.includes(paraFetchedId)
                    ? null
                    : jsonRes.push(paraFetchedId);
                  paraTypedByUser.set(user, JSON.stringify(jsonRes));
                });
              }
              io.in(room).emit("PARA", res.body);
            }
          }
        );
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

exports.typing = function (socket) {
  socket.on("TYPING", ({ room, message }) => {
    console.log(message);
    socket.to(room).emit("TYPING", message);
  });
};

exports.stoptyping = function (socket) {
  socket.on("donetyping", ({ username }) => {
    socket.to(room).emit("donetyping", "username has finished typing");
  });
};
