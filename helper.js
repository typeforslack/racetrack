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

module.exports = {
  getTypingPara,
  uuid,
};
