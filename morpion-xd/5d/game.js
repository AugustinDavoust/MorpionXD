const CELLS = 243;

const DIRS = [];
for (let dx = -1; dx <= 1; dx++)
  for (let dy = -1; dy <= 1; dy++)
    for (let dz = -1; dz <= 1; dz++)
      for (let dw = -1; dw <= 1; dw++)
        for (let dv = -1; dv <= 1; dv++) {
          if (!dx && !dy && !dz && !dw && !dv) continue;
          const firstNonZero = dx !== 0 ? dx : dy !== 0 ? dy : dz !== 0 ? dz : dw !== 0 ? dw : dv;
          if (firstNonZero < 0) continue;
          DIRS.push([dx, dy, dz, dw, dv]);
        }

const LINES = [];
const coordOf = i => [i % 3, Math.floor(i / 3) % 3, Math.floor(i / 9) % 3, Math.floor(i / 27) % 3, Math.floor(i / 81)];
const indexOf = (x, y, z, w, v) => v * 81 + w * 27 + z * 9 + y * 3 + x;

for (let i = 0; i < CELLS; i++) {
  const [x, y, z, w, v] = coordOf(i);
  for (const [dx, dy, dz, dw, dv] of DIRS) {
    const ex = x + 2 * dx, ey = y + 2 * dy, ez = z + 2 * dz, ew = w + 2 * dw, ev = v + 2 * dv;
    if (ex < 0 || ex > 2 || ey < 0 || ey > 2 || ez < 0 || ez > 2 || ew < 0 || ew > 2 || ev < 0 || ev > 2) continue;
    LINES.push([i, indexOf(x + dx, y + dy, z + dz, w + dw, v + dv), indexOf(ex, ey, ez, ew, ev)]);
  }
}

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const scoreXEl = document.getElementById("score-x");
const scoreOEl = document.getElementById("score-o");
const scoreDrawEl = document.getElementById("score-draw");
const resetBtn = document.getElementById("reset");

const MARK_SVGS = {
  X: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round"><line x1="24" y1="24" x2="76" y2="76"/><line x1="76" y1="24" x2="24" y2="76"/></svg>',
  O: '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="13"><circle cx="50" cy="50" r="27"/></svg>',
};

let board, current, playing, scores, lastMove;
let viewMode = "flat";
let winLine = null;
let rx = 55, rz = 45;
let zoom = 1;

function applyCamera() {
  boardEl.style.setProperty("--zoom", zoom);
  const extra = Math.max(0, zoom - 1) * boardEl.offsetHeight / 2;
  boardEl.style.setProperty("--mt", extra + "px");
  boardEl.style.setProperty("--mb", extra + "px");
  document.querySelectorAll("#board .cube").forEach(c => {
    c.style.setProperty("--rx", rx + "deg");
    c.style.setProperty("--rz", rz + "deg");
  });
}

function init() {
  board = Array(CELLS).fill(null);
  current = "X";
  playing = true;
  lastMove = null;
  winLine = null;
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
  boardEl.classList.toggle("triple", viewMode === "3d");
  boardEl.classList.toggle("tesseract", viewMode === "4d");
  if (viewMode === "flat") renderFlat();
  else if (viewMode === "3d") renderTriple();
  else renderTesseract();
  applyCamera();
}

function buildFlatCell(i) {
  const value = board[i];
  const cell = document.createElement("div");
  cell.className = "cell" + (value ? ` taken ${value.toLowerCase()}` : "") + (i === lastMove ? " last" : "") + (winLine && winLine.includes(i) ? " win" : "");
  cell.dataset.index = i;
  cell.textContent = value === "X" ? "✕" : value === "O" ? "◯" : "";
  cell.addEventListener("click", () => playCell(i));
  return cell;
}

function renderFlat() {
  const vNames = ["Couche 1 · v=0", "Couche 2 · v=1", "Couche 3 · v=2"];
  const hyperNames = ["w=0", "w=1", "w=2"];

  for (let v = 0; v < 3; v++) {
    const vgroup = document.createElement("div");
    vgroup.className = "vgroup";

    const vLabel = document.createElement("div");
    vLabel.className = "v-label";
    vLabel.textContent = vNames[v];
    vgroup.appendChild(vLabel);

    const row = document.createElement("div");
    row.className = "v-row";

    for (let w = 0; w < 3; w++) {
      const hyper = document.createElement("div");
      hyper.className = "hyper";

      const hyperLabel = document.createElement("div");
      hyperLabel.className = "hyper-label";
      hyperLabel.textContent = hyperNames[w];
      hyper.appendChild(hyperLabel);

      for (let z = 2; z >= 0; z--) {
        const grid = document.createElement("div");
        grid.className = "layer-grid";

        for (let y = 0; y < 3; y++) {
          for (let x = 0; x < 3; x++) {
            grid.appendChild(buildFlatCell(indexOf(x, y, z, w, v)));
          }
        }

        hyper.appendChild(grid);
      }

      row.appendChild(hyper);
    }

    vgroup.appendChild(row);
    boardEl.appendChild(vgroup);
  }
}

function buildCubeContent(container, w, v) {
  for (let z = 0; z < 3; z++) {
    const face = document.createElement("div");
    face.className = "face" + (z === 0 ? " bottom" : "");
    face.style.setProperty("--z", z);

    const grid = document.createElement("div");
    grid.className = "face-grid";

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        grid.appendChild(buildCell3D(indexOf(x, y, z, w, v)));
      }
    }

    face.appendChild(grid);
    container.appendChild(face);
  }

  for (const p of ["p1", "p2", "p3", "p4"]) {
    const vline = document.createElement("div");
    vline.className = `vline ${p}`;
    vline.innerHTML = '<i class="a"></i><i class="b"></i>';
    container.appendChild(vline);
  }
}

function buildCell3D(i) {
  const value = board[i];
  const box = document.createElement("div");
  box.className = "cellbox" + (value ? ` taken ${value.toLowerCase()}` : "") + (i === lastMove ? " last" : "") + (winLine && winLine.includes(i) ? " win" : "");
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

function renderTriple() {
  for (let v = 0; v < 3; v++) {
    const row = document.createElement("div");
    row.className = "cube-row";

    for (let w = 0; w < 3; w++) {
      const scene = document.createElement("div");
      scene.className = "scene";
      const cube = document.createElement("div");
      cube.className = "cube";
      buildCubeContent(cube, w, v);
      scene.appendChild(cube);
      row.appendChild(scene);
    }

    boardEl.appendChild(row);
  }
}

function renderTesseract() {
  const scales = [1, 0.62, 0.42];

  for (let v = 0; v < 3; v++) {
    const scene = document.createElement("div");
    scene.className = "scene";
    const cube = document.createElement("div");
    cube.className = "cube";

    for (let w = 0; w < 3; w++) {
      const sub = document.createElement("div");
      sub.className = "sub";
      sub.style.setProperty("--s", scales[w]);
      buildCubeContent(sub, w, v);
      cube.appendChild(sub);
    }

    scene.appendChild(cube);
    boardEl.appendChild(scene);
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
  winLine = result ? result.line : null;
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

function setView(v) {
  viewMode = v;
  document.querySelectorAll(".view").forEach(b => b.classList.toggle("active", b.id === "view-" + v));
  zoom = 1;
  render();
}

document.getElementById("view-flat").addEventListener("click", () => setView("flat"));
document.getElementById("view-3d").addEventListener("click", () => setView("3d"));
document.getElementById("view-4d").addEventListener("click", () => setView("4d"));

resetBtn.addEventListener("click", init);

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
  if (viewMode === "flat") return;
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
  if (viewMode === "flat") return;
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
  if (viewMode === "flat") return;
  e.preventDefault();
  zoom = Math.min(2.2, Math.max(0.5, zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
  applyCamera();
}, { passive: false });

initScores();
init();
