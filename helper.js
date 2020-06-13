const crypto = require("crypto");

exports.generateNewHash = function generateNewHash(previousHash = undefined) {
  let hash = crypto.randomBytes(20).toString("hex");
  if (hash == previousHash) {
    generateNewHash(hash);
  } else {
    return hash;
  }
};
