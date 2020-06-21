const express = require("express");

const app = express();

const server = require("http").createServer(app);
const io = require("socket.io")(server);

module.exports = {
  io,
  app,
  server,
};
