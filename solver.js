// ============================================================
// solver.js (cancellable + progress-capable BFS)
// ============================================================

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

function swap(board, i, j) { [board[i], board[j]] = [board[j], board[i]]; }

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
  'grey': () => {},
  'green': (b, i) => swap(b, i, 8 - i),
  'orange': (b, i) => {
    const counts = {};
    for (const j of crossAroundIndexes[i]) {
      counts[b[j]] = (counts[b[j]] || 0) + 1;
    }
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0 && entries.filter(e => e[1] === entries[0][1]).length === 1) {
      b[i] = entries[0][0];
    }
  },
  'black': (b, i) => rotate(b, rowsIndexes[i]),
  'red': (b, i, c='red') => {
    for (let k = 0; k < 9; k++) {
      if (b[k] === 'black') b[k] = c;
      else if (b[k] === 'white') b[k] = 'black';
    }
  },
  'white': (b, i) => {
    const original = b[i];
    for (const j of crossAroundIndexes[i]) {
      invertColors(b, j, original, 'grey');
    }
    invertColors(b, i, original, 'grey');
  },
  'violet': (b, i) => { if (i < 6) swap(b, i, i + 3); },
  'yellow': (b, i) => { if (i > 2) swap(b, i, i - 3); },
  'pink': (b, i) => rotate(b, allAroundIndexes[i]),
  'blue': (b, i) => {
    if (b[4] !== 'blue') colorFunctions[b[4]](b, i, 'blue');
  }
};

function isStillPossible(board, expected) {
  return !(expected.includes('blue') && !board.includes('blue'));
}

function isSolution(board, expected) {
  return board[0] === expected[0] &&
         board[2] === expected[1] &&
         board[6] === expected[2] &&
         board[8] === expected[3];
}

function clickBoard(board, idx) {
  try {
    colorFunctions[board[idx]](board, idx);
  } catch (error) {
    console.log('possibly wrong color at index', error);
    console.log('board:', board);
    console.log('idx:', idx);
  }
}

function copyBoard(board) { return [...board]; }

function remapSolverIndex(j) {
  // Placeholder for any index remapping logic (numpad etc.)
  return j;
}

// ---------- CANCELLABLE + PROGRESS BFS ----------
function treeSolve(board, expected, opts = {}) {
  const {
    maxMoves = 100,
    onProgress = () => {},
    shouldCancel = () => false,
    progressInterval = 5000  // call onProgress every N expansions
  } = opts;

  const root = new SolutionNode(null, copyBoard(board), null);
  const seen = new Set();
  seen.add(board.join(''));
  const levels = [[root]];

  let explored = 0;

  for (let depth = 0; depth < maxMoves; depth++) {
    if (shouldCancel()) return null;

    const currentLevel = levels[depth];
    if (!currentLevel || currentLevel.length === 0) break;

    const nextLevel = [];

    for (const node of currentLevel) {
      if (shouldCancel()) return null;

      // (Optional) progress by depth boundary
      // (We also do expansion-based progress below.)
      for (let j = 0; j < 9; j++) {
        if (shouldCancel()) return null;

        let i = remapSolverIndex(j);
        const newBoard = copyBoard(node.board);
        clickBoard(newBoard, i);

        const hash = newBoard.join('');
        if (isStillPossible(newBoard, expected) && !seen.has(hash)) {
          seen.add(hash);
          const child = new SolutionNode(node, newBoard, i);
          explored++;
          if (explored % progressInterval === 0) {
            onProgress({ explored, depth, queueSize: nextLevel.length });
          }
          if (isSolution(newBoard, expected)) {
            onProgress({ explored, depth: depth + 1, queueSize: nextLevel.length, found: true });
            return child;
          }
          nextLevel.push(child);
        }
      }
    }
    levels.push(nextLevel);
    onProgress({ explored, depth: depth + 1, queueSize: nextLevel.length });
  }

  return null;
}

function getMoves(node) {
  const moves = [];
  while (node) {
    if (node.move !== null) moves.unshift(node.move);
    node = node.parent;
  }
  return moves;
}

// Public solve with optional progress + cancellation
function solve(start, expected, onProgress, shouldCancel) {
  const node = treeSolve(start, expected, {
    onProgress: onProgress || (() => {}),
    shouldCancel: shouldCancel || (() => false),
    progressInterval: 3000, // tweak for expansion frequency
    maxMoves: 100           // tweak as needed
  });
  return node ? getMoves(node) : null;
}

// ============================================================
// Worker Harness
// ============================================================
if (typeof self !== 'undefined' && typeof document === 'undefined') {
  const cancelled = new Set();

  self.onmessage = (e) => {
    const msg = e.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'cancel') {
      cancelled.add(msg.id);
      return;
    }

    if (msg.type === 'solve') {
      const { id, start, expected } = msg;
      cancelled.delete(id);
      const startTime = performance.now();

      const moves = solve(
        start,
        expected,
        // onProgress
        (p) => {
          if (cancelled.has(id)) return;
            self.postMessage({
              id,
              type: 'progress',
              ...p,
              elapsedMs: +(performance.now() - startTime).toFixed(1)
            });
        },
        // shouldCancel
        () => cancelled.has(id)
      );

      if (cancelled.has(id)) {
        self.postMessage({ id, type: 'result', status: 'cancelled' });
        cancelled.delete(id);
        return;
      }

      const elapsedMs = +(performance.now() - startTime).toFixed(1);
      if (moves) {
        self.postMessage({ id, type: 'result', status: 'ok', moves, elapsedMs });
      } else {
        self.postMessage({ id, type: 'result', status: 'fail', elapsedMs });
      }
    }
  };
}
