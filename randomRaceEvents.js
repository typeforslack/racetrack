const redis = require("./redisHelper");
const { expiryInSeconds } = require("./constants");
const Queue = require("bull");

const paraToBeEmittedInRooms = new Queue("roomsQueue", {
  redis: {
    host: "127.0.0.1",
    port: 6379,
  },
});

exports.joinrandomrace = (socket) => {
  // Get a room that is been created in the last 5 seconds and having capacity of less than 4 users

  /*
     {
        random-race-room-1oneuno:{usercount:4,timestamp:13389734,users=[{name:"user1",socketId:"jdhfla359472kdsjhfkew5"}]}
        random-race-room-2twodous:{bot:0,usercount:4,timestamp:13389734,users=[{name:"user1",socketId:"jdhfla359472kdsjhfkew5"}]}
     }
  */

  socket.on("JOIN_RANDOM_RACE", ({ username }) => {
    redis.scanner.scan("random-race-room*", (err, keys) => {
      userDetails = {
        name: username,
        socketId: socket.id,
      };

      if (keys.length != 0) {
        raceRoom = redis.getRaceRoom(keys);
        raceRoom.then((room) => {
          if (room.length > 0) {
            redis.get(room[0]).then((roomdata) => {
              roomdata = JSON.parse(roomdata);
              roomdata.usercount += 1;
              roomdata.users.push(userDetails);
              redis.set(room[0], JSON.stringify(roomdata)).then((reply) => {
                if (reply) {
                  redis.expire(room[0], expiryInSeconds);
                }
              });
            });
            socket.join(room[0]);
            return;
          }
          console.log("NEW ROOM CREATED");
          room = redis.createRoomForRandomRace(userDetails);

          // ADDING THE ROOM TO THE QUEUE, AFTER 10 SECONDS A PARAGRAPH IS EMITTED THE USERS IN THE ROOM

          paraToBeEmittedInRooms.add(
            { room: room },
            { delay: 10000, removeOnComplete: true }
          );
          socket.join(room);
        });
        return;
      }

      // CREATING INITIAL ROOM

      room = redis.createRoomForRandomRace(userDetails);

      // ADDING THE ROOM TO THE QUEUE, AFTER 10 SECONDS A PARAGRAPH IS EMITTED THE USERS IN THE ROOM
      console.log("CREATED A INTIAL ROOM");
      paraToBeEmittedInRooms.add(
        { room: room },
        { delay: 10000, removeOnComplete: true }
      );

      socket.join(room);
    });
  });
};

// QUEUE TO TRIGGER SOCKET EVENT TO EMIT PARAGRAPH TO THE USERS IN THE JOINED ROOM

paraToBeEmittedInRooms.process((job, done) => {
  redis.sendPara(job.data.room).catch((err) => {
    console.log(err);
  });
  done();
});
