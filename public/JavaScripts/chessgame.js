const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
let movedPiece = null;
let playerRole = null;
let srcSquare = null;

const renderBoard = () => {
  const board = chess.board(); //this will create the chess board array.
  boardElement.innerHTML = "";
  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      const squareBoard = document.createElement("div");
      squareBoard.classList.add(
        "square",
        (rowIndex + colIndex) % 2 === 0 ? "light" : "dark"
      );
      squareBoard.dataset.row = rowIndex;
      squareBoard.dataset.col = colIndex;

      if (square) {
        // Display the pieces on the initial board
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerText = pieceUniCodes(square);
        pieceElement.draggable = playerRole === square.color;
        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            movedPiece = pieceElement;
            srcSquare = { row: rowIndex, col: colIndex }; // Position from where the move is happening
            e.dataTransfer.setData("text/plain", ""); // This is used so that dragging happens smoothly
          }
        });
        pieceElement.addEventListener("dragend", () => {
          movedPiece = null;
          srcSquare = null;
        });
        squareBoard.appendChild(pieceElement);
      }

      squareBoard.addEventListener("dragover", (e) => {
        e.preventDefault(); ///We are not allowed to drag a random square
      });

      squareBoard.addEventListener("drop", (e) => {
        e.preventDefault();
        if (movedPiece) {
          const targetSquare = {
            row: Number(squareBoard.dataset.row),
            col: Number(squareBoard.dataset.col),
          };
          handleMove(srcSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareBoard);
    });
  });

  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`, // Coordinates of the board
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q",
  };
  socket.emit("move", move);
};

const pieceUniCodes = (piece) => {
  const unicodePieces = {
    p: "♙",
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    P: "♙",
    R: "♖",
    N: "♘",
    B: "♗",
    Q: "♕",
    K: "♔",
  };
  return unicodePieces[piece.type] || ""; // If no piece found then return empty string
};

socket.on("playerRole", (role) => {
  playerRole = role;
  renderBoard();
});
socket.on("spectator", () => {
  playerRole = null;
  renderBoard();
});
socket.on("boardState", (FEN) => {
  chess.load(FEN); //This will load the new state of the board
  renderBoard();
});
socket.on("move", (move) => {
  chess.move(move); //This will load the new state of the board
  renderBoard();
});
