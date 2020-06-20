const {
  request,
  io,
  raceRooms,
  syncraceget,
  paraTypedByUser,
} = require("./utils.js");

const { TFSBackendURL } = require("./constants.js");

exports.disconnect = function (socket) {
  socket.on("disconnect", () => {
    raceRooms.keys("*", (err, rooms) => {
      console.log(rooms);
      for (let i = 0; i < rooms.length; i++) {
        raceRooms.get(rooms[i], (err, userintheroom) => {
          json_data = JSON.parse(userintheroom);
          console.log(json_data);
          for (let j = 0; j < json_data.users.length; j++) {
            if (socket.id == json_data.users[j].socketId) {
              io.to(rooms[i]).emit(
                "DISCONNECTED",
                `${json_data.users[j].name} has left the race`
              );
              json_data.users.splice(j, 1);
              raceRooms.set(rooms[i], JSON.stringify(json_data));
              console.log(json_data);
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
              'room1':{isStarted:true,timestamp:123345,users:[{name:'user3',socketId='78sdg3g3k'},{name:'user4',socketId='sgjk245hl2'}]}
              'room2':{timestamp:376874,users:[{name:'user1',socketId='78sdg3g3k'},{name:'user2',socketId='sgjk245hl2'}]}
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
              res.users.push(userDetails);
              raceRooms.set(room, JSON.stringify(res));
              return res;
            } else {
              io.to(socket.id).emit("RACE_STARTED", "Race has already started");
              return false;
            }
          } else {
            io.to(socket.id).emit("USER_JOINED", "Room doesn't exists");
            return false;
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

            // Getting the Updated value of the users in the room

            raceRooms.get(room, (err, res) => {
              res = JSON.parse(res);
              usernames = res.users
                .map((userData) => {
                  if (userData.name != undefined) {
                    return userData.name;
                  }
                })
                .filter((data) => data != null);

              let serverData = {
                room: room,
                userInTheRoom: usernames,
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
    userInTheRoom = [];
    let paraTypedByTheUserInTheRoom = [];
    let uniqueParaTypedByTheUserInTheRoom = [];

    return syncraceget(room)
      .then((res) => {
        jsonData = JSON.parse(res);
        jsonData.isStarted != true ? (jsonData.isStarted = true) : null;
        raceRooms.set(room, JSON.stringify(jsonData));
        for (userDetails of jsonData.users) {
          if (userDetails.name != undefined) {
            userInTheRoom.push(userDetails.name);
            paraTypedByUser.get(userDetails.name, (err, res) => {
              if (res == null) {
                paraTypedByUser.set(userDetails.name, "[]");
              } else {
                res = JSON.parse(res);
                paraTypedByTheUserInTheRoom.push(...res);
                removedDuplicateValues = new Set(paraTypedByTheUserInTheRoom);
                uniqueParaTypedByTheUserInTheRoom = [...removedDuplicateValues];
              }
            });
          }
        }
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
              for (user of userInTheRoom) {
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
