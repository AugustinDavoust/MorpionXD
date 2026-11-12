const SIZE = 4;
const WIN_VALUE = 2048;
const STORAGE_KEY = "2048-best";

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlayEl = document.getElementById("overlay");
const overlayTextEl = document.getElementById("overlay-text");
const overlayBtnEl = document.getElementById("overlay-btn");
const newGameBtn = document.getElementById("new-game");

let grid, score, best, won, gameOver;

best = Number(localStorage.getItem(STORAGE_KEY)) || 0;
bestEl.textContent = best;

function newGame() {
  grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  score = 0;
  won = false;
  gameOver = false;
  addRandomTile();
  addRandomTile();
  overlayEl.classList.add("hidden");
  overlayEl.classList.remove("win");
  updateScore();
  render();
}

function emptyCells() {
  const cells = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === 0) cells.push([r, c]);
  return cells;
}

function addRandomTile() {
  const cells = emptyCells();
  if (cells.length === 0) return;
  const [r, c] = cells[Math.floor(Math.random() * cells.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function updateScore() {
  scoreEl.textContent = score;
  if (score > best) {
    best = score;
    bestEl.textContent = best;
    localStorage.setItem(STORAGE_KEY, best);
  }
}

const TILE_COLORS = {
  2:    { bg: "#eee4da", fg: "#776e65" },
  4:    { bg: "#ede0c8", fg: "#776e65" },
  8:    { bg: "#f2b179", fg: "#f9f6f2" },
  16:   { bg: "#f59563", fg: "#f9f6f2" },
  32:   { bg: "#f67c5f", fg: "#f9f6f2" },
  64:   { bg: "#f65e3b", fg: "#f9f6f2" },
  128:  { bg: "#edcf72", fg: "#f9f6f2" },
  256:  { bg: "#edcc61", fg: "#f9f6f2" },
  512:  { bg: "#edc850", fg: "#f9f6f2" },
  1024: { bg: "#edc53f", fg: "#f9f6f2" },
  2048: { bg: "#edc22e", fg: "#f9f6f2" },
};

function tileStyle(value) {
  return TILE_COLORS[value] || { bg: "#3c3a32", fg: "#f9f6f2" };
}

function render(newTiles = [], mergedTiles = []) {
  boardEl.querySelectorAll(".tile").forEach(t => t.remove());
  buildBackgroundCells();

  const boardRect = boardEl.getBoundingClientRect();
  const pad = 12;
  const cellSize = (boardRect.width - pad * 2 - (SIZE - 1) * 12) / SIZE;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = grid[r][c];
      if (value === 0) continue;
      const tile = document.createElement("div");
      tile.className = "tile";
      const { bg, fg } = tileStyle(value);
      tile.style.background = bg;
      tile.style.color = fg;
      tile.style.width = tile.style.height = cellSize + "px";
      tile.style.top = pad + r * (cellSize + 12) + "px";
      tile.style.left = pad + c * (cellSize + 12) + "px";
      tile.style.fontSize = value >= 1024 ? "22px" : value >= 128 ? "28px" : "34px";
      tile.textContent = value;
      if (newTiles.some(([nr, nc]) => nr === r && nc === c)) tile.classList.add("new");
      if (mergedTiles.some(([mr, mc]) => mr === r && mc === c)) tile.classList.add("merged");
      boardEl.appendChild(tile);
    }
  }
}

function buildBackgroundCells() {
  if (boardEl.querySelector(".cell-bg")) return;
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement("div");
    cell.className = "cell-bg";
    boardEl.appendChild(cell);
  }
}

function slideRow(row) {
  const tiles = row.filter(v => v !== 0);
  const result = [];
  const merged = [];
  let gained = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === tiles[i + 1]) {
      const mergedValue = tiles[i] * 2;
      result.push(mergedValue);
      merged.push(result.length - 1);
      gained += mergedValue;
      i++;
    } else {
      result.push(tiles[i]);
    }
  }
  while (result.length < SIZE) result.push(0);
  return { result, merged, gained };
}

function move(direction) {
  if (gameOver) return;

  const before = JSON.stringify(grid);
  const mergedCells = [];

  for (let i = 0; i < SIZE; i++) {
    let line = [];
    for (let j = 0; j < SIZE; j++) {
      const [r, c] = getCoords(i, j, direction);
      line.push(grid[r][c]);
    }

    const { result, merged, gained } = slideRow(line);
    score += gained;

    for (let j = 0; j < SIZE; j++) {
      const [r, c] = getCoords(i, j, direction);
      grid[r][c] = result[j];
      if (merged.includes(j)) mergedCells.push([r, c]);
    }
  }

  if (JSON.stringify(grid) === before) return;

  addRandomTile();
  updateScore();
  render([], mergedCells);
  checkWin();
  checkGameOver();
}

function getCoords(i, j, direction) {
  switch (direction) {
    case "left":  return [i, j];
    case "right": return [i, SIZE - 1 - j];
    case "up":    return [j, i];
    case "down":  return [SIZE - 1 - j, i];
  }
}

function checkWin() {
  if (won) return;
  for (const row of grid)
    if (row.includes(WIN_VALUE)) {
      won = true;
      showOverlay("Bravo, tu as gagné ! 🎉", true);
    }
}

function checkGameOver() {
  if (emptyCells().length > 0) return;
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return;
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return;
    }
  gameOver = true;
  showOverlay("Partie terminée !", false);
}

function showOverlay(text, isWin) {
  overlayTextEl.textContent = text;
  overlayEl.classList.remove("hidden");
  overlayEl.classList.toggle("win", isWin);
}

const KEYS = {
  ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
  q: "left", d: "right", z: "up", s: "down",
  a: "left",
};

document.addEventListener("keydown", (e) => {
  const direction = KEYS[e.key.toLowerCase()] || KEYS[e.key];
  if (direction) {
    e.preventDefault();
    move(direction);
  }
});

let touchStart = null;

boardEl.addEventListener("touchstart", (e) => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });

boardEl.addEventListener("touchend", (e) => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
  else move(dy > 0 ? "down" : "up");
}, { passive: true });

newGameBtn.addEventListener("click", newGame);
overlayBtnEl.addEventListener("click", newGame);

window.addEventListener("resize", () => render());

newGame();
