// game.js — now with procedural generation, keys, doors, traps, and fun character

const gameEl = document.getElementById("game");
const modal = document.getElementById("contact-modal");

const TILE = {
  WALL: "W",
  PATH: " ",
  PLAYER: "P",
  CHEST: "C",
  KEY: "K",
  DOOR: "D",
  TRAP: "T"
};

const TILE_CLASSES = {
  [TILE.WALL]: "cell cell-wall",
  [TILE.PATH]: "cell cell-path",
  [TILE.PLAYER]: "cell cell-player hamburger",
  [TILE.CHEST]: "cell cell-chest",
  [TILE.KEY]: "cell cell-key",
  [TILE.DOOR]: "cell cell-door",
  [TILE.TRAP]: "cell cell-trap"
};

let gridSize = 17;
let level = 0;
let playerPos = { x: 0, y: 0 };
let keysCollected = 0;

function generateMaze(width, height) {
  const maze = Array.from({ length: height }, () => Array(width).fill(TILE.WALL));

  function carve(x, y) {
    const dirs = [
      [2, 0], [-2, 0],
      [0, 2], [0, -2]
    ].sort(() => Math.random() - 0.5);

    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx > 0 && ny > 0 && nx < width - 1 && ny < height - 1 && maze[ny][nx] === TILE.WALL) {
        maze[ny][nx] = TILE.PATH;
        maze[y + dy / 2][x + dx / 2] = TILE.PATH;
        carve(nx, ny);
      }
    }
  }

  maze[1][1] = TILE.PATH;
  carve(1, 1);
  maze[1][1] = TILE.PLAYER;
  maze[height - 2][width - 2] = TILE.CHEST;

  // Place a key and a locked door
  maze[2][2] = TILE.KEY;
  maze[height - 3][Math.floor(width / 2)] = TILE.DOOR;

  // Add a trap
  maze[3][3] = TILE.TRAP;

  return maze.map(row => row.join(""));
}

let LEVELS = [
  generateMaze(gridSize, gridSize),
  generateMaze(gridSize + 2, gridSize + 2)
];

function renderLevel() {
  gameEl.innerHTML = "";
  const map = LEVELS[level];

  const cols = map[0].length;
  gameEl.style.gridTemplateColumns = `repeat(${cols}, 2.5rem)`;

  map.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      const div = document.createElement("div");
      div.className = TILE_CLASSES[cell] || TILE_CLASSES[TILE.PATH];
      div.dataset.x = x;
      div.dataset.y = y;
      gameEl.appendChild(div);

      if (cell === TILE.PLAYER) {
        playerPos = { x, y };
      }
    });
  });
}

function movePlayer(dx, dy) {
  const map = LEVELS[level];
  const newX = playerPos.x + dx;
  const newY = playerPos.y + dy;

  const row = map?.[newY];
  if (!row) return;

  const tile = row[newX];
  if (!tile || tile === TILE.WALL) return;

  if (tile === TILE.KEY) {
    keysCollected++;
  }

  if (tile === TILE.DOOR && keysCollected < 1) return;
  if (tile === TILE.TRAP) alert("Yikes! You hit a trap. Keep going!");

  if (tile === TILE.CHEST) {
    if (level < LEVELS.length - 1) {
      level++;
      keysCollected = 0;
      renderLevel();
      return;
    } else {
      modal.classList.remove("hidden");
      return;
    }
  }

  LEVELS[level][playerPos.y] = replaceChar(map[playerPos.y], playerPos.x, TILE.PATH);
  LEVELS[level][newY] = replaceChar(map[newY], newX, TILE.PLAYER);

  playerPos = { x: newX, y: newY };
  renderLevel();
}

function replaceChar(str, index, replacement) {
  return str.substring(0, index) + replacement + str.substring(index + 1);
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp": return movePlayer(0, -1);
    case "ArrowDown": return movePlayer(0, 1);
    case "ArrowLeft": return movePlayer(-1, 0);
    case "ArrowRight": return movePlayer(1, 0);
  }
});

renderLevel();
