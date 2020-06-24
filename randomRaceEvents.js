const redis = require("./redisHelper");
const helper = require("./helper");
const { expiryInSeconds } = require("./constants");
let paraToBeEmittedInRoom = [];

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
      userDetails = {
        name: username,
        socketId: socket.id,
      };

      if (keys.length == 0) {
        console.log("CREATING INITIAL ROOM");
        let { room, dataStoredInTheRoom } = helper.createUserDataObject(
          userDetails
        );

        redis.set(
          room,
          JSON.stringify(dataStoredInTheRoom),
          "EX",
          expiryInSeconds
        );

        paraToBeEmittedInRoom.push(room);

        socket.join(room);
        setTimeout(function () {
          room = paraToBeEmittedInRoom.shift();
          redis.sendPara(room).catch((err) => {
            console.log(err);
          });
        }, 10000);
        return;
      }

      for (let i = 0; i < keys.length; i++) {
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
            console.log(roomdata);
            redis.set(keys[i], JSON.stringify(roomdata), "EX", expiryInSeconds);
            socket.join(keys[i]);
            return;
          } else if (i + 1 == keys.length && setUser == false) {
            console.log("CREATING ROOM WHEN THE LOOP IS ENDING");
            let { room, dataStoredInTheRoom } = helper.createUserDataObject(
              userDetails
            );

            redis.set(
              room,
              JSON.stringify(dataStoredInTheRoom),
              "EX",
              expiryInSeconds
            );

            paraToBeEmittedInRoom.push(room);

            socket.join(room);
            setTimeout(function () {
              room = paraToBeEmittedInRoom.shift();
              redis.sendPara(room).catch((err) => {
                console.log(err);
              });
            }, 10000);
          }
        });
      }
    });
  });
};
