const express = require("express");
const redis = require("redis");
const request = require("request");
const { promisify } = require("util");

const app = express();

const server = require("http").createServer(app);
const io = require("socket.io")(server);

let raceRooms = redis.createClient(6379, "127.0.0.1");
let paraTypedByUser = redis.createClient(7000, "127.0.0.1");
const syncraceget = promisify(raceRooms.get).bind(raceRooms);

module.exports = {
  request,
  io,
  raceRooms,
  syncraceget,
  paraTypedByUser,
  app,
  server,
};
