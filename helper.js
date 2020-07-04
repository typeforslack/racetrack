const uuid = require("uuid");
const axios = require("axios");
const constants = require("./constants");

const getTypingPara = function (parasTyped, usernames) {
  return new Promise((res, rej) => {
    axios
      .get(constants.TFSBackendURL, {
        params: { data: JSON.stringify(parasTyped) },
      })
      .then((response) => {
        const jsonBody = response.data;
        res({ jsonBody, usernames });
      })
      .catch((err) => rej(err));
  });
};

module.exports = {
  getTypingPara,
  uuid,
};
