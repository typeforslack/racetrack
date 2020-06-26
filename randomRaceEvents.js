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
    var setUser = false;
    redis.scanner.scan("random-race-room*", (err, keys) => {
      userDetails = {
        name: username,
        socketId: socket.id,
      };

      if (keys.length != 0) {
        for (let i = 0; i < keys.length; i++) {
          redis.get(keys[i]).then(function (roomdata) {
            roomdata = JSON.parse(roomdata);

            if (roomdata.usercount < 4 && !roomdata.isStarted) {
              setUser = true;
              roomdata.usercount += 1;
              roomdata.users.push(userDetails);
              redis.set(keys[i], JSON.stringify(roomdata)).then((reply) => {
                if (reply) {
                  redis.expire(keys[i], expiryInSeconds);
                }
              });

              // ADDING USER TO A EXISTING ROOM
              console.log("ADDED TO A EXISTING ROOM", setUser);
              socket.join(keys[i]);
              return;
            } else if (i == keys.length - 1 && !setUser) {
              // IF ALL THE EXISTING ROOMS ARE FULL THEN CREATING A NEW ROOM AND ADDING THE USER TO THAT ROOM
              console.log("NEW ROOM CREATED");
              room = redis.createRoomForRandomRace(userDetails);

              // ADDING THE ROOM TO THE QUEUE, AFTER 10 SECONDS A PARAGRAPH IS EMITTED THE USERS IN THE ROOM

              paraToBeEmittedInRooms.add(
                { room: room },
                { delay: 10000, removeOnComplete: true }
              );
              socket.join(room);
            }
            return;
          });
        }
        return;
      }
      // CREATING INITIAL ROOM

      room = redis.createRoomForRandomRace(userDetails);

      // ADDING THE ROOM TO THE QUEUE, AFTER 10 SECONDS A PARAGRAPH IS EMITTED THE USERS IN THE ROOM
      console.log("CREATED A NEW ROOM");
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
