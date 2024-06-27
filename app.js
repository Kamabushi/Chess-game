const express = require("express");
const http = require("http");
const socket = require("socket.io");
const { Chess } = require("chess.js");
const app = express();
const server = http.createServer(app);
const path = require("path");

const io = socket(server);
const chess = new Chess();
let players = {};
let curPlayer = "w";
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.render("index", { title: "Lets Play Chess" });
});
io.on("connection", (unique) => {
  console.log("Connected");
  if (!players.white) {
    players.white = unique.id;
    unique.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = unique.id;
    unique.emit("playerRole", "b");
  } else {
    unique.emit("Spectator");
  }
  unique.on("disconnect", () => {
    if (unique.id === players.white) {
      delete players.white;
    } else if (unique.id === players.black) {
      delete players.black;
    }
  });
  unique.on("move", function (move) {
    try {
      if (
        (chess.turn() === "w" && unique.id !== players.white) ||
        (chess.turn() === "b" && unique.id !== players.black)
      ) {
        return;
      }
      const res = chess.move(move); //validated the move. If wrong move then will send an error
      if (res) {
        curPlayer = chess.turn();
        io.emit("move", move); //this will send move to everyone
        io.emit("boardState", chess.fen()); //send the updated state of the board
      } else {
        console.log("OOPS thats a wrong move", move);
        unique.emit("invalid", move);
      }
    } catch (err) {
      console.log(err);
      unique.emit("OOPS thats a wrong move", move);
    }
  });
});
server.listen(3000, () => {
  console.log("Listnening on 3000");
});
