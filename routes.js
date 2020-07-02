const { expiryInSeconds, PORT } = require("./constants.js");
const redis = require("./redisHelper.js");

const helper = require("./helper.js");

function init(app) {
  app.get("/", (req, res) => {
    res.sendFile(__dirname + "/client.html");
  });

  app.get("/index", (req, res) => {
    res.send("Testing");
  });

  app.get("/createRaceRoom", (req, res) => {
    let hash = helper.uuid.v1();
    data = {
      hash: hash,
    };
    dataStoredInTheRaceRoom = {
      timestamp: Math.floor(Date.now() / 1000),
      users: [],
    };
    /*
            {
              room1:{timestamp:4426425143,users:[]}
            }
      
          */
    redis.set(
      `room-${hash}`,
      JSON.stringify(dataStoredInTheRaceRoom),
      "EX",
      expiryInSeconds,
    );
    res.json(data);
  });
}

module.exports = {
  init,
};
