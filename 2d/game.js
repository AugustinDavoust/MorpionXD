const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const scoreXEl = document.getElementById("score-x");
const scoreOEl = document.getElementById("score-o");
const scoreDrawEl = document.getElementById("score-draw");
const aiOptionsEl = document.getElementById("ai-options");
const resetBtn = document.getElementById("reset");

let board, current, playing, mode, level, scores, aiThinking;

function init() {
  board = Array(9).fill(null);
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
  board.forEach((value, i) => {
    const cell = document.createElement("div");
    cell.className = "cell" + (value ? ` taken ${value.toLowerCase()}` : "");
    cell.dataset.index = i;
    cell.textContent = value === "X" ? "✕" : value === "O" ? "◯" : "";
    cell.addEventListener("click", () => playCell(i));
    boardEl.appendChild(cell);
  });
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

function isFull(bd) {
  return bd.every(v => v !== null);
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
  if (isFull(board)) return endRound(null);

  current = current === "X" ? "O" : "X";
  updateStatus();
}

function endRound(result) {
  playing = false;
  if (result) {
    result.line.forEach(i => boardEl.children[i].classList.add("win"));
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
  }, 400);
}

function chooseAIMove() {
  const empty = board.map((v, i) => (v === null ? i : null)).filter(v => v !== null);
  if (empty.length === 0) return null;

  if (level === "easy") {
    if (Math.random() < 0.5) return empty[Math.floor(Math.random() * empty.length)];
  }

  if (level === "medium") {
    if (Math.random() < 0.35) return empty[Math.floor(Math.random() * empty.length)];
  }

  return bestMove(board, "O").index;
}

function bestMove(bd, player) {
  const result = winnerOf(bd);
  if (result) return { score: result.player === "O" ? 10 - bd.filter(Boolean).length : bd.filter(Boolean).length - 10 };
  if (isFull(bd)) return { score: 0 };

  let best = { index: null, score: player === "O" ? -Infinity : Infinity };

  for (let i = 0; i < 9; i++) {
    if (bd[i] !== null) continue;
    bd[i] = player;
    const { score } = bestMove(bd, player === "O" ? "X" : "O");
    bd[i] = null;

    if (player === "O" ? score > best.score : score < best.score) {
      best = { index: i, score };
    }
  }
  return best;
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
