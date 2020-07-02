const http = require("http");
const express = require("express");
const routes = require("./routes");
const sockets = require("./sockets");

const app = express();
const server = http.createServer(app);

routes.init(app);
sockets.init(server);

server.listen(PORT, () => {
  console.log(`Server is Running on port ${PORT}!`);
});
