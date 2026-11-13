const CELLS = 81;

const DIRS = [];
for (let dx = -1; dx <= 1; dx++)
  for (let dy = -1; dy <= 1; dy++)
    for (let dz = -1; dz <= 1; dz++)
      for (let dw = -1; dw <= 1; dw++) {
        if (!dx && !dy && !dz && !dw) continue;
        const firstNonZero = dx !== 0 ? dx : dy !== 0 ? dy : dz !== 0 ? dz : dw;
        if (firstNonZero < 0) continue;
        DIRS.push([dx, dy, dz, dw]);
      }

const LINES = [];
const coordOf = i => [i % 3, Math.floor(i / 3) % 3, Math.floor(i / 9) % 3, Math.floor(i / 27)];
const indexOf = (x, y, z, w) => w * 27 + z * 9 + y * 3 + x;

for (let i = 0; i < CELLS; i++) {
  const [x, y, z, w] = coordOf(i);
  for (const [dx, dy, dz, dw] of DIRS) {
    const ex = x + 2 * dx, ey = y + 2 * dy, ez = z + 2 * dz, ew = w + 2 * dw;
    if (ex < 0 || ex > 2 || ey < 0 || ey > 2 || ez < 0 || ez > 2 || ew < 0 || ew > 2) continue;
    LINES.push([i, indexOf(x + dx, y + dy, z + dz, w + dw), indexOf(ex, ey, ez, ew)]);
  }
}

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const scoreXEl = document.getElementById("score-x");
const scoreOEl = document.getElementById("score-o");
const scoreDrawEl = document.getElementById("score-draw");
const resetBtn = document.getElementById("reset");

let board, current, playing, scores, lastMove;

function init() {
  board = Array(CELLS).fill(null);
  current = "X";
  playing = true;
  lastMove = null;
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
  const hyperNames = ["Hyperplan 1 · w=0", "Hyperplan 2 · w=1", "Hyperplan 3 · w=2"];
  const layerNames = ["Étage 3 · z=2", "Étage 2 · z=1", "Étage 1 · z=0"];

  for (let w = 0; w < 3; w++) {
    const hyper = document.createElement("div");
    hyper.className = "hyper";

    const hyperLabel = document.createElement("div");
    hyperLabel.className = "hyper-label";
    hyperLabel.textContent = hyperNames[w];
    hyper.appendChild(hyperLabel);

    for (let z = 2; z >= 0; z--) {
      const layer = document.createElement("div");
      layer.className = "layer";

      const grid = document.createElement("div");
      grid.className = "layer-grid";

      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const i = indexOf(x, y, z, w);
          const value = board[i];
          const cell = document.createElement("div");
          cell.className = "cell" + (value ? ` taken ${value.toLowerCase()}` : "") + (i === lastMove ? " last" : "");
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
      hyper.appendChild(layer);
    }

    boardEl.appendChild(hyper);
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

function playCell(i) {
  if (!playing || board[i]) return;

  board[i] = current;
  lastMove = i;
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

resetBtn.addEventListener("click", init);

initScores();
init();
