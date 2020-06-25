const { io } = require("./utils.js");
const redis = require("./redisHelper");
const helper = require("./helper");
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
    let setUser = false;
    redis.keys("random-race-room*").then((keys) => {
      console.log(keys);
      userDetails = {
        name: username,
        socketId: socket.id,
      };

      if (keys.length == 0) {
        console.log("CREATING INITIAL ROOM");
        let { room, dataStoredInTheRoom } = helper.createUserDataObject(
          userDetails
        );

        redis.set(room, JSON.stringify(dataStoredInTheRoom)).then((reply) => {
          if (reply) {
            redis.expire(room, expiryInSeconds);
          }
        });

        paraToBeEmittedInRooms.add(
          { room: room },
          { delay: 10000, removeOnComplete: true }
        );

        socket.join(room);

        return;
      }

      for (let i = 0; i < keys.length; i++) {
        console.log(setUser);
        redis.get(keys[i]).then((roomdata) => {
          time = Math.floor(Date.now() / 1000);
          roomdata = JSON.parse(roomdata);
          diffInTheTimeBtwJoiningUserAndCreatingRoom =
            time - roomdata.timestamp;

          if (
            roomdata.usercount < 4 &&
            !roomdata.isStarted &&
            setUser != true &&
            diffInTheTimeBtwJoiningUserAndCreatingRoom <= 5
          ) {
            setUser = true;
            roomdata.usercount += 1;
            roomdata.users.push(userDetails);
            // console.log(roomdata);

            redis.set(keys[i], JSON.stringify(roomdata)).then((reply) => {
              if (reply) {
                redis.expire(keys[i], expiryInSeconds);
              }
            });

            socket.join(keys[i]);

            return;
          } else if (i + 1 == keys.length && setUser == false) {
            console.log("CREATING ROOM WHEN THE LOOP IS ENDING");
            let { room, dataStoredInTheRoom } = helper.createUserDataObject(
              userDetails
            );

            redis
              .set(room, JSON.stringify(dataStoredInTheRoom))
              .then((reply) => {
                if (reply) {
                  redis.expire(room, expiryInSeconds);
                }
              });

            paraToBeEmittedInRooms.add(
              { room: room },
              { delay: 10000, removeOnComplete: true }
            );
            socket.join(room);
          }
        });
      }
    });
  });
};

paraToBeEmittedInRooms.process((job, done) => {
  redis.sendPara(job.data.room).catch((err) => {
    console.log(err);
  });
  done();
});
