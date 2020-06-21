const crypto = require("crypto");
const request = require("request");
const constants = require("./constants");

exports.generateNewHash = function generateNewHash(previousHash) {
  let hash = crypto.randomBytes(20).toString("hex");
  if (hash == previousHash) {
    generateNewHash(hash);
  } else {
    return hash;
  }
};

exports.getTypingPara = function (parasTyped) {
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
      },
    );
  });
};
