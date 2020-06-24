const uuid = require("uuid");
const axios = require("axios");
const constants = require("./constants");

const getTypingPara = function (parasTyped) {
  return new Promise((res, rej) => {
    axios
      .get(constants.TFSBackendURL, {
        params: { data: JSON.stringify(parasTyped) },
      })
      .then((response) => {
        const jsonBody = JSON.parse(response.body);
        res(jsonBody);
      })
      .catch((err) => rej(err));
  });
};

module.exports = {
  getTypingPara,
  uuid,
};
