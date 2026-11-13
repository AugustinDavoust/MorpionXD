const LINES = [];

for (let z = 0; z < 3; z++)
  for (let y = 0; y < 3; y++)
    LINES.push([z * 9 + y * 3, z * 9 + y * 3 + 1, z * 9 + y * 3 + 2]);

for (let z = 0; z < 3; z++)
  for (let x = 0; x < 3; x++)
    LINES.push([z * 9 + x, z * 9 + 3 + x, z * 9 + 6 + x]);

for (let y = 0; y < 3; y++)
  for (let x = 0; x < 3; x++)
    LINES.push([y * 3 + x, 9 + y * 3 + x, 18 + y * 3 + x]);

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

let board, current, playing, mode, level, scores, aiThinking;

function init() {
  board = Array(27).fill(null);
  current = "X";
  playing = true;
  aiThinking = false;
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
  const layerNames = ["Étage 1 · bas", "Étage 2 · milieu", "Étage 3 · haut"];

  for (let z = 0; z < 3; z++) {
    const layer = document.createElement("div");
    layer.className = "layer";

    const grid = document.createElement("div");
    grid.className = "layer-grid";

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const i = z * 9 + y * 3 + x;
        const value = board[i];
        const cell = document.createElement("div");
        cell.className = "cell" + (value ? ` taken ${value.toLowerCase()}` : "");
        cell.dataset.index = i;
        cell.textContent = value === "X" ? "✕" : value === "O" ? "◯" : "";
        cell.addEventListener("click", () => playCell(i));
        grid.appendChild(cell);
      }
    }

    const label = document.createElement("div");
    label.className = "layer-label";
    label.textContent = layerNames[z];

    layer.appendChild(grid);
    layer.appendChild(label);
    boardEl.appendChild(layer);
  }
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
    result.line.forEach(i => {
      const layerIdx = Math.floor(i / 9);
      boardEl.children[layerIdx].querySelector(`[data-index="${i}"]`).classList.add("win");
    });
    scores[result.player]++;
    updateStatus(`${result.player === "X" ? "✕" : "◯"} a gagné ! 🎉`);
  } else {
    scores.draw++;
    updateStatus("Match nul 🤝");
  }
  updateScores();
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

  const depth = level === "medium" ? 2 : searchDepth(empty.length);
  return search(board, "O", depth, -Infinity, Infinity).index;
}

function randomMove(empty) {
  return empty[Math.floor(Math.random() * empty.length)];
}

function searchDepth(empties) {
  if (empties > 22) return 4;
  if (empties > 14) return 6;
  return empties;
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

function search(bd, player, depth, alpha, beta) {
  const result = winnerOf(bd);
  if (result) {
    const winScore = 1000 + depth;
    return { index: null, score: result.player === "O" ? winScore : -winScore };
  }

  const empty = emptyCells(bd);
  if (empty.length === 0 || depth === 0) {
    return { index: null, score: player === "O" ? evaluate(bd) : -evaluate(bd) };
  }

  let bestIndex = empty[0];
  const maximizing = player === "O";

  for (const i of empty) {
    bd[i] = player;
    const { score } = search(bd, maximizing ? "X" : "O", depth - 1, alpha, beta);
    bd[i] = null;

    if (maximizing) {
      if (score > alpha) { alpha = score; bestIndex = i; }
    } else {
      if (score < beta) { beta = score; bestIndex = i; }
    }

    if (alpha >= beta) break;
  }

  return { index: bestIndex, score: maximizing ? alpha : beta };
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

mode = "pvp";
level = "easy";
initScores();
init();
