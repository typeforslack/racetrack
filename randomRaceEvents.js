const { io } = require("./utils.js");
const redis = require("./redisHelper");
const helper = require("./helper");
const { expiryInSeconds } = require("./constants");

exports.joinrandomrace = (socket) => {
  // Get a room that is been created in the last 10 seconds

  /*
     {
        random-race-room-1oneuno:{usercount:4,timestamp:13389734,users=[{name:"user1",socketId:"jdhfla359472kdsjhfkew5"}]}
     }
  */

  socket.on("JOIN_RANDOM_RACE", ({ username }) => {
    redis.keys("random-race-room-*").then((keys) => {
      if (keys == null) {
        room = "random-race-room-" + helper.v1();
        timestamp = Math.floor(Date.now() / 1000);
        usercount = 0;
        dataStoredInTheRoom = {
          usercount,
          timestamp,
          users: [],
        };
        redis.set(
          room,
          JSON.stringify(dataStoredInTheRoom),
          "EX",
          expiryInSeconds
        );
      } else {
        for (let i = 1; i <= keys.length; i++) {
          redis.get(keys[i]).then((roomdata) => {
            time = Math.floor(Date.now() / 1000);
            roomdata = JSON.parse(roomdata);
            userDetails = {
              name: username,
              socketId: socket.id,
            };
            diffInTheTimeBtwJoiningUserAndCreatingRoom =
              time - roomdata.timestamp;
            if (
              roomdata.usercount < 4 &&
              diffInTheTimeBtwJoiningUserAndCreatingRoom < 10
            ) {
              roomdata.usercount += 1;
              roomdata.users.push(userDetails);
              redis.set(room, JSON.stringify(userDetails));
              socket.join(roomdata[i]);
              return;
            } else if (i == keys.length) {
              room = "random-race-room-" + helper.v1();
              timestamp = Math.floor(Date.now() / 1000);
              usercount = 1;
              dataStoredInTheRoom = {
                usercount,
                timestamp,
                users: [userDetails],
              };
              redis.set(
                room,
                JSON.stringify(dataStoredInTheRoom),
                "EX",
                expiryInSeconds
              );
              socket.join(room[i]);
            }
          });
        }
      }
    });
  });
};
