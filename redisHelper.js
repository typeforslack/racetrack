const client = require("redis");
const mockClient = require("redis-mock");
const { expiryInSeconds } = require("./constants");
const { promisify } = require("util");
const { getTypingPara, createUserDataObject } = require("./helper");

function getClient(env) {
  if (env === "TEST") {
    return mockClient.createClient();
  }
  return client.createClient(6379, "127.0.0.1");
}

const redis = getClient(process.env.ENV);
const get = promisify(redis.get).bind(redis);
const set = promisify(redis.set).bind(redis);
const keys = promisify(redis.keys).bind(redis);
const expire = promisify(redis.expire).bind(redis);

const getRoom = (hash) => get("room-" + hash);
const getParasTyped = (username) => get(username + "-paras");
const setParasTyped = (username, value) => set(username + "-paras", value);

/**
 * Returns array of paragraph IDs typed by all the usernames given
 * @param {*} usernames
 */
const getParasTypedByTheseUsers = (usernames) => {
  const paraTypedByTheUserInTheRoom = [];
  const promises = [];
  usernames.forEach((username) => {
    promises.push(
      getParasTyped(username).then((res) => {
        if (res != null) {
          res = JSON.parse(res);
          paraTypedByTheUserInTheRoom.push(...res);
        }
      })
    );
  });
  return Promise.all(promises).then(() => {
    removedDuplicateValues = new Set(paraTypedByTheUserInTheRoom);
    uniqueParaTypedByTheUserInTheRoom = [...removedDuplicateValues];
    return uniqueParaTypedByTheUserInTheRoom;
  });
};

const setParaTypedByTheseUsers = (usernames, paraFetchedId) => {
  const promises = [];
  usernames.forEach((user) => {
    promises.push(
      getParasTyped(user).then((res) => {
        jsonRes = res != null ? JSON.parse(res) : [];
        jsonRes.includes(paraFetchedId) ? null : jsonRes.push(paraFetchedId);
        setParasTyped(user, JSON.stringify(jsonRes));
      })
    );
  });

  return Promise.all(promises);
};

const sendPara = (room) => {
  let usernames = [];
  return get(room)
    .then((res) => {
      redisRoom = JSON.parse(res);
      if (redisRoom.isStarted == true) {
        throw new Error("Race has started !");
      }
      redisRoom.isStarted = true;
      set(room, JSON.stringify(redisRoom)).then((reply) => {
        if (reply) {
          expire(room, expiryInSeconds);
        }
      });

      usernames = redisRoom.users.map((user) => user.name);
      return getParasTypedByTheseUsers(usernames);
    })
    .then((parasTyped) => {
      return getTypingPara(parasTyped, usernames);
    });
};

const getRaceRoom = (keys) => {
  let promises = [];
  let rooms = [];
  keys.forEach((room) => {
    promises.push(
      get(room).then((roomdata) => {
        roomdata = JSON.parse(roomdata);
        if (roomdata.usercount < 4 && !roomdata.isStarted) {
          rooms.push(room);
        }
      })
    );
  });
  return Promise.all(promises).then((_) => {
    return rooms;
  });
};

const createRoomForRandomRace = (userDetails) => {
  let { room, dataStoredInTheRoom } = createUserDataObject(userDetails);

  set(room, JSON.stringify(dataStoredInTheRoom)).then((reply) => {
    if (reply) {
      expire(room, expiryInSeconds);
    }
  });
  return room;
};

module.exports = {
  get,
  set,
  keys,
  expire,
  getRoom,
  getParasTypedByTheseUsers,
  setParaTypedByTheseUsers,
  createRoomForRandomRace,
  sendPara,
  getParasTyped,
  getRaceRoom,
};
