// game.js — Maze Generator Based Version (16x16)

const gameEl = document.getElementById("game");
const modal = document.getElementById("contact-modal");

const SIZE = 16;
let maze = [];
let playerPos = { x: 1, y: 1 };
let chestPos = { x: SIZE - 2, y: SIZE - 2 };

const TILE_CLASSES = {
  W: "cell cell-wall",
  P: "cell cell-player",
  C: "cell cell-chest",
  " ": "cell cell-path",
};

function generateMaze(size) {
  const grid = Array.from({ length: size }, () => Array(size).fill("W"));
  let farthest = { x: 1, y: 1, dist: 0 };

  function carve(x, y, dist = 0) {
    grid[y][x] = " ";
    if (dist > farthest.dist) {
      farthest = { x, y, dist };
    }

    const dirs = [
      [0, -2], [2, 0], [0, 2], [-2, 0]
    ].sort(() => Math.random() - 0.5);

    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && grid[ny][nx] === "W") {
        grid[y + dy / 2][x + dx / 2] = " ";
        carve(nx, ny, dist + 1);
      }
    }
  }

  carve(playerPos.x, playerPos.y);
  chestPos = { x: farthest.x, y: farthest.y };
  grid[chestPos.y][chestPos.x] = "C";
  return grid;
}

function renderMaze() {
  gameEl.innerHTML = "";
  gameEl.style.gridTemplateColumns = `repeat(${SIZE}, 2.5rem)`;

  maze.forEach((row, y) => {
    row.forEach((cell, x) => {
      const div = document.createElement("div");
      const value = (x === playerPos.x && y === playerPos.y) ? "P" : cell;
      div.className = TILE_CLASSES[value];
      gameEl.appendChild(div);
    });
  });
}

function movePlayer(dx, dy) {
  const nx = playerPos.x + dx;
  const ny = playerPos.y + dy;

  if (maze[ny]?.[nx] !== "W") {
    playerPos = { x: nx, y: ny };

    if (nx === chestPos.x && ny === chestPos.y) {
      modal.classList.remove("hidden");
    }

    renderMaze();
  }
}

function initMazeGame() {
  maze = generateMaze(SIZE);
  renderMaze();
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp": movePlayer(0, -1); break;
    case "ArrowDown": movePlayer(0, 1); break;
    case "ArrowLeft": movePlayer(-1, 0); break;
    case "ArrowRight": movePlayer(1, 0); break;
  }
});

initMazeGame();