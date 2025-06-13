// game.js — styled & functional

const gameEl = document.getElementById("game");
const modal = document.getElementById("contact-modal");

const TILE_CLASSES = {
  W: "cell cell-wall",
  ' ': "cell cell-path",
  P: "cell cell-player hamburger",
  C: "cell cell-chest",
  K: "cell cell-key",
  D: "cell cell-door"
};

let level = 0;
let playerPos = { x: 0, y: 0 };
let hasKey = false;

// --- Maze Generation ---
function generateMaze(width, height) {
  const maze = Array.from({ length: height }, () => Array(width).fill("W"));
  const visited = Array.from({ length: height }, () => Array(width).fill(false));

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function carve(x, y) {
    visited[y][x] = true;
    maze[y][x] = " ";
    const directions = shuffle([
      [0, -2], [0, 2], [-2, 0], [2, 0]
    ]);
    for (const [dx, dy] of directions) {
      const nx = x + dx, ny = y + dy;
      if (ny >= 1 && ny < height - 1 && nx >= 1 && nx < width - 1 && !visited[ny][nx]) {
        maze[y + dy / 2][x + dx / 2] = " ";
        carve(nx, ny);
      }
    }
  }

  const startX = 1, startY = 1;
  carve(startX, startY);
  maze[startY][startX] = "P";

  const distanceMap = Array.from({ length: height }, () => Array(width).fill(Infinity));
  const queue = [[startX, startY, 0]];
  let farthest = [startX, startY];

  while (queue.length) {
    const [x, y, d] = queue.shift();
    if (d > distanceMap[y][x]) continue;
    distanceMap[y][x] = d;
    if (d > distanceMap[farthest[1]][farthest[0]]) {
      farthest = [x, y];
    }
    for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nx = x+dx, ny = y+dy;
      if (maze?.[ny]?.[nx] === " " && d+1 < distanceMap[ny][nx]) {
        queue.push([nx, ny, d+1]);
      }
    }
  }

  maze[farthest[1]][farthest[0]] = "C"; // chest

  // Insert key + door somewhere mid-path
  let placedKey = false, placedDoor = false;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const d = distanceMap[y][x];
      if (!placedKey && d > 4 && d < 8) {
        maze[y][x] = "K";
        placedKey = true;
      }
      if (!placedDoor && d > 8 && d < distanceMap[farthest[1]][farthest[0]] - 4) {
        maze[y][x] = "D";
        placedDoor = true;
      }
    }
  }

  return maze.map(row => row.join(""));
}

const LEVELS = [
  generateMaze(17, 17),
  generateMaze(19, 19)
];

function renderLevel() {
  gameEl.innerHTML = "";
  const map = LEVELS[level];

  const cols = map[0].length;
  gameEl.style.gridTemplateColumns = `repeat(${cols}, 2.5rem)`;

  map.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      const div = document.createElement("div");
      div.className = TILE_CLASSES[cell] || TILE_CLASSES[" "];
      div.dataset.x = x;
      div.dataset.y = y;
      gameEl.appendChild(div);

      if (cell === "P") playerPos = { x, y };
    });
  });
}

function movePlayer(dx, dy) {
  const map = LEVELS[level];
  const newX = playerPos.x + dx;
  const newY = playerPos.y + dy;
  const tile = map?.[newY]?.[newX];
  if (!tile || tile === "W") return;

  if (tile === "D" && !hasKey) return;
  if (tile === "K") hasKey = true;

  if (tile === "C") {
    if (level === 0) {
      level = 1;
      hasKey = false;
      renderLevel();
      return;
    } else {
      modal.classList.remove("hidden");
      return;
    }
  }

  LEVELS[level][playerPos.y] = replaceChar(map[playerPos.y], playerPos.x, " ");
  LEVELS[level][newY] = replaceChar(map[newY], newX, "P");

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
