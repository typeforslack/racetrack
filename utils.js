const express = require("express");
const redis = require("redis");
const request = require("request");
const { promisify } = require("util");
const helper = require("./helper.js");

const app = express();

const server = require("http").createServer(app);
const io = require("socket.io")(server);

const PORT = 4000;
const expiryInSeconds = 3600;
const TFSBackendURL = "http://127.0.0.1:8000/paraForRaceTrack";

let raceRooms = redis.createClient(6379, "127.0.0.1");
let paraTypedByUser = redis.createClient();
const syncraceget = promisify(raceRooms.get).bind(raceRooms);

module.exports = {
  request,
  helper,
  io,
  PORT,
  raceRooms,
  syncraceget,
  paraTypedByUser,
  app,
  server,
  expiryInSeconds,
  TFSBackendURL,
};
