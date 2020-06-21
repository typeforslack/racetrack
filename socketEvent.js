const { io } = require("./utils.js");
const redis = require("./redisHelper");
const { getTypingPara } = require("./helper");

exports.disconnect = function (socket) {
  socket.on("disconnect", () => {
    redis.keys("room-*").then((err, rooms) => {
      for (let i = 0; i < rooms.length; i++) {
        redis.get(rooms[i]).then((err, userintheroom) => {
          console.log(rooms);
          json_data = JSON.parse(userintheroom);
          for (let j = 0; j < json_data.users.length; j++) {
            if (socket.id == json_data.users[j].socketId) {
              io.to(rooms[i]).emit(
                "DISCONNECTED",
                `${json_data.users[j].name} has left the race`,
              );
              json_data.users.splice(j, 1);
              redis.set(rooms[i], JSON.stringify(json_data));
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
        "You have already joined the room!",
      );
    } else {
      return redis
        .getRoom(room)
        .then((res) => {
          if (res === null) {
            io.to(socket.id).emit("USER_JOINED", "Room doesn't exists");
            return false;
          }

          res = JSON.parse(res);

          if (res.isStarted === true) {
            io.to(socket.id).emit("RACE_STARTED", "Race has already started");
            return false;
          }

          userDetails = {};
          userDetails.name = username;
          userDetails.socketId = socket.id;
          res.users.push(userDetails);
          redis.set(room, JSON.stringify(res));

          socket.join(room);

          usernames = createdRoom.users.map((user) => user.name);
          let serverData = {
            room: room,
            userInTheRoom: usernames,
          };

          io.in(room).emit("USER_JOINED", serverData);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });
};

exports.startrace = function (socket) {
  socket.on("START_RACE", ({ room }) => {
    let usernames = [];

    return redis
      .getRoom(room)
      .then((res) => {
        redisRoom = JSON.parse(res);
        redisRoom.isStarted !== true ? (redisRoom.isStarted = true) : null;
        raceRooms.set(room, JSON.stringify(redisRoom));

        usernames = redisRoom.users.map((user) => user.name);
        return redis.getParasTypedByTheseUsers(usernames);
      })
      .then((parasTyped) => getTypingPara(parasTyped))
      .then((newPara) => {
        redis.setParaTypedByTheseUsers(usernames, newPara.id);
        io.in(room).emit("PARA", res.body);
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
