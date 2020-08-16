const uuid = require("uuid");
const axios = require("axios");
require("dotenv").config();

const getTypingPara = function (parasTyped, usernames) {
  return new Promise((res, rej) => {
    axios
      .get(process.env.KSBackendURL, {
        params: { data: JSON.stringify(parasTyped) },
      })
      .then((response) => {
        const jsonBody = response.data;
        res({ jsonBody, usernames });
      })
      .catch((err) => rej(err));
  });
};

const createUserDataObject = (userDetails) => {
  let room = "random-race-room-" + uuid.v1();
  let timestamp = Math.floor(Date.now() / 1000);
  let usercount = 1;
  let dataStoredInTheRoom = {
    usercount,
    timestamp,
    users: [userDetails],
  };
  return { room, dataStoredInTheRoom };
};

module.exports = {
  getTypingPara,
  uuid,
  createUserDataObject,
};
