const client = require("redis");
const { promisify } = require("util");

const redis = client.createClient(6379, "127.0.0.1");
const get = promisify(redis.get).bind(redis);
const set = promisify(redis.set).bind(redis);
const keys = promisify(redis.keys).bind(redis);

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

  for (username of usernames) {
    promises.push(
      getParasTyped(username).then((err, res) => {
        if (res != null) {
          res = JSON.parse(res);
          paraTypedByTheUserInTheRoom.push(...res);
        }
      }),
    );
  }

  Promise.all(promises).then(() => {
    removedDuplicateValues = new Set(paraTypedByTheUserInTheRoom);
    uniqueParaTypedByTheUserInTheRoom = [...removedDuplicateValues];
  });
};

const setParaTypedByTheseUsers = (usernames, paraFetchedId) => {
  const promises = [];

  for (user of usernames) {
    promises.push(
      getParasTyped(user).then((err, res) => {
        jsonRes = res != null ? JSON.parse(res) : [];
        jsonRes.includes(paraFetchedId) ? null : jsonRes.push(paraFetchedId);

        setParasTyped(user, JSON.stringify(jsonRes));
      }),
    );
  }

  return Promise.all(promises);
};

module.exports = {
  get,
  set,
  keys,
  getRoom,
  getParasTypedByTheseUsers,
};
