const uuid = require("uuid");
const request = require("request");
const constants = require("./constants");

const getTypingPara = function (parasTyped) {
  return new Promise((res, rej) => {
    request.get(
      {
        url: constants.TFSBackendURL,
        qs: { data: JSON.stringify(parasTyped) },
      },
      (err, response) => {
        if (err) {
          rej(err);
          return;
        }

        res(JSON.parse(response.body));
      }
    );
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
