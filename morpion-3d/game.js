const LINES = [];

const DIRS = [];
for (let dx = -1; dx <= 1; dx++)
  for (let dy = -1; dy <= 1; dy++)
    for (let dz = -1; dz <= 1; dz++) {
      if (!dx && !dy && !dz) continue;
      if (dx > 0 || (dx === 0 && dy > 0) || (dx === 0 && dy === 0 && dz > 0))
        DIRS.push([dx, dy, dz]);
    }

for (let z = 0; z < 3; z++)
  for (let y = 0; y < 3; y++)
    for (let x = 0; x < 3; x++)
      for (const [dx, dy, dz] of DIRS) {
        const ex = x + 2 * dx, ey = y + 2 * dy, ez = z + 2 * dz;
        if (ex < 0 || ex > 2 || ey < 0 || ey > 2 || ez < 0 || ez > 2) continue;
        LINES.push([z * 9 + y * 3 + x, (z + dz) * 9 + (y + dy) * 3 + (x + dx), ez * 9 + ey * 3 + ex]);
      }

const MOVE_ORDER = Array.from({ length: 27 }, (_, i) => {
  const x = i % 3, y = Math.floor(i / 3) % 3, z = Math.floor(i / 9);
  return { index: i, dist: Math.abs(x - 1) + Math.abs(y - 1) + Math.abs(z - 1) };
})
  .sort((a, b) => a.dist - b.dist)
  .map(o => o.index);

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const scoreXEl = document.getElementById("score-x");
const scoreOEl = document.getElementById("score-o");
const scoreDrawEl = document.getElementById("score-draw");
const aiOptionsEl = document.getElementById("ai-options");
const resetBtn = document.getElementById("reset");
const viewToggleBtn = document.getElementById("view-toggle");

let board, current, playing, mode, level, scores, aiThinking;
let flatView = false;
let lastMoveIndex = null;

const MARK_SVGS = {
  X: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round"><line x1="24" y1="24" x2="76" y2="76"/><line x1="76" y1="24" x2="24" y2="76"/></svg>',
  O: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="13"><circle cx="50" cy="50" r="27"/></svg>',
};

let rx = 55, rz = 45;
let zoom = 1;
let currentCube = null;

function applyCamera() {
  if (!currentCube) return;
  currentCube.style.setProperty("--rx", rx + "deg");
  currentCube.style.setProperty("--rz", rz + "deg");
  currentCube.style.setProperty("--zoom", zoom);
}

function init() {
  board = Array(27).fill(null);
  current = "X";
  playing = true;
  aiThinking = false;
  lastMoveIndex = null;
  render();
  updateStatus();
}

function initScores() {
  scores = { X: 0, O: 0, draw: 0 };
  updateScores();
}

function updateScores() {
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
  scoreDrawEl.textContent = scores.draw;
}

function render() {
  boardEl.innerHTML = "";

  const scene = document.createElement("div");
  scene.className = "scene";

  const cube = document.createElement("div");
  cube.className = "cube" + (flatView ? " flat" : "");

  for (let z = 0; z < 3; z++) {
    const face = document.createElement("div");
    face.className = "face";
    face.style.setProperty("--z", z);

    const grid = document.createElement("div");
    grid.className = "face-grid";

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        grid.appendChild(buildCell(z * 9 + y * 3 + x));
      }
    }

    face.appendChild(grid);
    cube.appendChild(face);
  }

  scene.appendChild(cube);
  boardEl.appendChild(scene);

  currentCube = cube;
  applyCamera();
}

function buildCell(i) {
  const value = board[i];
  const box = document.createElement("div");
  box.className = "cellbox" + (value ? ` taken ${value.toLowerCase()}` : "") + (i === lastMoveIndex ? " last" : "");
  box.dataset.index = i;

  const cubeEl = document.createElement("div");
  cubeEl.className = "cellcube";

  for (const f of ["top", "north", "south", "west", "east"]) {
    const side = document.createElement("div");
    side.className = `cf ${f}`;
    cubeEl.appendChild(side);
  }

  const mark = document.createElement("span");
  mark.className = "mark";
  if (value) mark.innerHTML = MARK_SVGS[value];
  cubeEl.appendChild(mark);

  box.appendChild(cubeEl);
  box.addEventListener("click", () => playCell(i));
  return box;
}

function updateStatus(text) {
  if (text) {
    statusEl.textContent = text;
    return;
  }
  statusEl.textContent = `Au tour de ${current === "X" ? "✕" : "◯"}`;
}

function winnerOf(bd) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (bd[a] && bd[a] === bd[b] && bd[a] === bd[c]) {
      return { player: bd[a], line };
    }
  }
  return null;
}

function emptyCells(bd) {
  const cells = [];
  for (const i of MOVE_ORDER) if (bd[i] === null) cells.push(i);
  return cells;
}

function playCell(i) {
  if (!playing || board[i] || aiThinking) return;
  if (mode === "ai" && current === "O") return;

  applyMove(i);
  if (!playing) return;

  if (mode === "ai" && current === "O") triggerAI();
}

function applyMove(i) {
  board[i] = current;
  lastMoveIndex = i;
  render();

  const result = winnerOf(board);
  if (result) return endRound(result);
  if (board.every(v => v !== null)) return endRound(null);

  current = current === "X" ? "O" : "X";
  updateStatus();
}

function endRound(result) {
  playing = false;
  if (result) {
    result.line.forEach(i => boardEl.querySelector(`[data-index="${i}"]`).classList.add("win"));
    scores[result.player]++;
    updateStatus(`${result.player === "X" ? "✕" : "◯"} a gagné ! 🎉`);
  } else {
    scores.draw++;
    updateStatus("Match nul 🤝");
  }
  updateScores();
}

const SEARCH_ABORT = Symbol("abort");
let searchDeadline = Infinity;
let searchNodes = 0;

function search(bd, player, depth, alpha, beta) {
  if ((++searchNodes & 1023) === 0 && Date.now() > searchDeadline) throw SEARCH_ABORT;

  const result = winnerOf(bd);
  if (result) {
    const winScore = 1000 + depth;
    return { index: null, score: result.player === "O" ? winScore : -winScore };
  }

  if (depth === 0) {
    return { index: null, score: player === "O" ? evaluate(bd) : -evaluate(bd) };
  }

  let bestIndex = null;
  const maximizing = player === "O";

  for (const i of MOVE_ORDER) {
    if (bd[i] !== null) continue;
    bd[i] = player;
    const { score } = search(bd, maximizing ? "X" : "O", depth - 1, alpha, beta);
    bd[i] = null;

    if (bestIndex === null) bestIndex = i;

    if (maximizing) {
      if (score > alpha) { alpha = score; bestIndex = i; }
    } else {
      if (score < beta) { beta = score; bestIndex = i; }
    }

    if (alpha >= beta) break;
  }

  if (bestIndex === null) return { index: null, score: 0 };

  return { index: bestIndex, score: maximizing ? alpha : beta };
}

function evaluate(bd) {
  let score = 0;
  for (const [a, b, c] of LINES) {
    const va = bd[a], vb = bd[b], vc = bd[c];
    const x = (va === "X") + (vb === "X") + (vc === "X");
    const o = (va === "O") + (vb === "O") + (vc === "O");
    if (x && o) continue;
    if (o === 2) score += 6;
    else if (o === 1) score += 1;
    else if (x === 2) score -= 6;
    else if (x === 1) score -= 1;
  }
  return score;
}

function triggerAI() {
  aiThinking = true;
  updateStatus("L'IA réfléchit...");
  setTimeout(() => {
    const move = chooseAIMove();
    aiThinking = false;
    if (move !== null && playing) applyMove(move);
  }, 300);
}

function chooseAIMove() {
  const empty = emptyCells(board);
  if (empty.length === 0) return null;

  if (level === "easy" && Math.random() < 0.6) return randomMove(empty);
  if (level === "medium" && Math.random() < 0.3) return randomMove(empty);

  const win = immediateWin(board, "O");
  if (win !== null) return win;
  const block = immediateWin(board, "X");
  if (block !== null) return block;

  if (level === "medium") return search(board, "O", 2, -Infinity, Infinity).index;

  let best = search(board, "O", 2, -Infinity, Infinity).index;
  const snapshot = board.slice();
  for (let depth = 3; depth <= empty.length; depth++) {
    searchDeadline = Date.now() + 600;
    searchNodes = 0;
    try {
      const result = search(board, "O", depth, -Infinity, Infinity);
      best = result.index;
      if (Math.abs(result.score) >= 1000) break;
    } catch (e) {
      if (e !== SEARCH_ABORT) throw e;
      board.splice(0, board.length, ...snapshot);
      break;
    }
  }
  searchDeadline = Infinity;
  return best;
}

function randomMove(empty) {
  return empty[Math.floor(Math.random() * empty.length)];
}

function immediateWin(bd, player) {
  for (const i of MOVE_ORDER) {
    if (bd[i] !== null) continue;
    bd[i] = player;
    const won = winnerOf(bd);
    bd[i] = null;
    if (won) return i;
  }
  return null;
}

function setMode(newMode) {
  mode = newMode;
  document.getElementById("mode-pvp").classList.toggle("active", mode === "pvp");
  document.getElementById("mode-ai").classList.toggle("active", mode === "ai");
  aiOptionsEl.classList.toggle("hidden", mode !== "ai");
  initScores();
  init();
}

document.getElementById("mode-pvp").addEventListener("click", () => setMode("pvp"));
document.getElementById("mode-ai").addEventListener("click", () => setMode("ai"));

document.querySelectorAll(".level").forEach(btn => {
  btn.addEventListener("click", () => {
    level = btn.dataset.level;
    document.querySelectorAll(".level").forEach(b => b.classList.toggle("active", b === btn));
    initScores();
    init();
  });
});

resetBtn.addEventListener("click", init);

viewToggleBtn.addEventListener("click", () => {
  flatView = !flatView;
  viewToggleBtn.textContent = flatView ? "Vue 3D" : "Vue à plat";
  render();
  if (!flatView && currentCube) {
    currentCube.classList.add("smooth");
    setTimeout(() => currentCube && currentCube.classList.remove("smooth"), 500);
  }
});

let dragging = false;
let dragDist = 0;
let lastX = 0, lastY = 0;
let suppressClick = false;

function dragMove(x, y) {
  const dx = x - lastX, dy = y - lastY;
  dragDist += Math.abs(dx) + Math.abs(dy);
  lastX = x;
  lastY = y;
  rz -= dx * 0.4;
  rx = Math.min(85, Math.max(8, rx - dy * 0.4));
  applyCamera();
}

document.body.addEventListener("mousedown", (e) => {
  if (flatView) return;
  if (e.target.closest("button")) return;
  dragging = true;
  dragDist = 0;
  lastX = e.clientX;
  lastY = e.clientY;
  document.body.classList.add("dragging");
});

window.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  dragMove(e.clientX, e.clientY);
});

window.addEventListener("mouseup", () => {
  if (dragging && dragDist > 6) suppressClick = true;
  dragging = false;
  document.body.classList.remove("dragging");
});

document.addEventListener("click", (e) => {
  if (suppressClick) {
    e.stopPropagation();
    suppressClick = false;
  }
}, true);

document.body.addEventListener("touchstart", (e) => {
  if (flatView) return;
  if (e.target.closest("button")) return;
  const t = e.touches[0];
  dragging = true;
  dragDist = 0;
  lastX = t.clientX;
  lastY = t.clientY;
}, { passive: true });

document.body.addEventListener("touchmove", (e) => {
  if (!dragging) return;
  e.preventDefault();
  dragMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

document.body.addEventListener("touchend", () => {
  if (dragging && dragDist > 6) suppressClick = true;
  dragging = false;
}, { passive: true });

document.body.addEventListener("wheel", (e) => {
  if (flatView) return;
  e.preventDefault();
  zoom = Math.min(2.2, Math.max(0.5, zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
  applyCamera();
}, { passive: false });

mode = "pvp";
level = "easy";
initScores();
init();
