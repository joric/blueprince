// Blue Prince Mora Jai Box solver
// Originally from https://www.reddit.com/r/BluePrince/comments/1kefpbv/i_made_a_puzzle_box_solver/
// Ported to JS by Joric, 2025 https://github.com/joric/blueprince

// The following colors are supported :
// g : grey
// e : green
// o : orange
// b : black
// r : red
// w : white
// p : purple
// y : yellow
// i : pink
// u : blue

const crossAroundIndexes = [
  [1, 3], [0, 2, 4], [1, 5],
  [0, 4, 6], [1, 3, 5, 7], [2, 4, 8],
  [3, 7], [6, 4, 8], [5, 7]
];

const allAroundIndexes = [
  [1, 4, 3], [2, 5, 4, 3, 0], [5, 4, 1],
  [0, 1, 4, 7, 6], [0, 1, 2, 5, 8, 7, 6, 3], [8, 7, 4, 1, 2],
  [3, 4, 7], [6, 3, 4, 5, 8], [7, 4, 5]
];

const rowsIndexes = [
  [0, 1, 2], [0, 1, 2], [0, 1, 2],
  [3, 4, 5], [3, 4, 5], [3, 4, 5],
  [6, 7, 8], [6, 7, 8], [6, 7, 8]
];

class SolutionNode {
  constructor(parent, board, move) {
    this.parent = parent;
    this.board = board;
    this.move = move;
  }
}

function swap(board, i, j) {
  [board[i], board[j]] = [board[j], board[i]];
}

function rotate(board, indices) {
  const last = board[indices[indices.length - 1]];
  for (let i = indices.length - 1; i > 0; i--) {
    board[indices[i]] = board[indices[i - 1]];
  }
  board[indices[0]] = last;
}

function invertColors(board, idx, c1, c2) {
  if (board[idx] === c1) board[idx] = c2;
  else if (board[idx] === c2) board[idx] = c1;
}

const colorFunctions = {
  g: () => {},
  e: (b, i) => swap(b, i, 8 - i),
  o: (b, i) => {
    const counts = {};
    for (const j of crossAroundIndexes[i]) {
      counts[b[j]] = (counts[b[j]] || 0) + 1;
    }
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0 && entries.filter(e => e[1] === entries[0][1]).length === 1) {
      b[i] = entries[0][0];
    }
  },
  b: (b, i) => rotate(b, rowsIndexes[i]),
  r: (b) => {
    for (let i = 0; i < 9; i++) {
      if (b[i] === "b") b[i] = "r";
      else if (b[i] === "w") b[i] = "b";
    }
  },
  w: (b, i) => {
    const original = b[i];
    for (const j of crossAroundIndexes[i]) {
      invertColors(b, j, original, "g");
    }
    invertColors(b, i, original, "g");
  },
  p: (b, i) => { if (i < 6) swap(b, i, i + 3); },
  y: (b, i) => { if (i > 2) swap(b, i, i - 3); },
  i: (b, i) => rotate(b, allAroundIndexes[i]),
  u: (b, i) => {
    if (b[4] !== "u") colorFunctions[b[4]](b, i);
  }
};

function isStillPossible(board, expected) {
  return !(expected.includes("u") && !board.includes("u"));
}

function isSolution(board, expected) {
  return board[0] === expected[0] &&
         board[2] === expected[1] &&
         board[6] === expected[2] &&
         board[8] === expected[3];
}

function clickBoard(board, idx) {
  colorFunctions[board[idx]](board, idx);
}

function copyBoard(board) {
  return [...board];
}

function treeSolve(board, expected) {
  const root = new SolutionNode(null, copyBoard(board), null);
  const seen = new Set();
  seen.add(board.join(""));
  const levels = [[root]];

  for (let depth = 0; depth < 30; depth++) {
    const currentLevel = levels[depth];
    const nextLevel = [];
    //console.log(`move ${depth}, ${currentLevel.length} possibilities`);
    for (const node of currentLevel) {
      for (let i = 0; i < 9; i++) {
        const newBoard = copyBoard(node.board);
        clickBoard(newBoard, i);
        const hash = newBoard.join("");
        if (isStillPossible(newBoard, expected) && !seen.has(hash)) {
          seen.add(hash);
          const child = new SolutionNode(node, newBoard, i);
          if (isSolution(newBoard, expected)) return child;
          nextLevel.push(child);
        }
      }
    }
    levels.push(nextLevel);
  }

  return null;
}

function getSolution(node) {
  const moves = [];
  while (node) {
    moves.unshift(node);
    node = node.parent;
  }
  solution = [];
  for (const move of moves) {
    if (move.move !== null) {
      solution.push(move.move+1);
    }
  }
  return solution;
}

if (typeof require !== 'undefined' && require.main === module) {
  // Board configuration
  const start = ["b", "b", "b",
                "g", "b", "g",
                "y", "g", "y"];

  const expected = ["b", "b",
                    "b", "b"];

  const result = treeSolve(start, expected);
  if (result) {
    console.log("solution found", getSolution(result));
  } else {
    console.log("no solution found");
  }
}
