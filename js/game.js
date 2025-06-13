// game.js

const gameEl = document.getElementById("game");
const modal = document.getElementById("contact-modal");

const LEVELS = [
  // Level 1 — beatable, verified, with loops and misleads
  [
    "WWWWWWWWWWWWWWWW",
    "WP     W      WW",
    "W WWWW WWWWWW WW",
    "W W        WW  W",
    "W WWWWWW W WWWWW",
    "W     W  W    WW",
    "WWWWW WWWWWWW WW",
    "W     W        W",
    "W WWWW WWWWWWWWW",
    "W     W        W",
    "WWWWW WWWWWWW WW",
    "W   W W     W  W",
    "W W W W WWWWW WW",
    "W W     W      W",
    "W WWWWWWW WWWW W",
    "WWWWWWWWWWWWW WC"
  ],

  // Level 2 — trickier, longer, and still solvable
  [
    "WWWWWWWWWWWWWWWW",
    "WP W        W  W",
    "W WWWWWWWW WWW W",
    "W     W     W  W",
    "WWW W WWWWWWWW W",
    "W   W       W  W",
    "W WWWWWWWW WWWWW",
    "W W     W      W",
    "W W WWWWWWWWWW W",
    "W W W        W W",
    "W W W WWWWW WW W",
    "W W W W    W W W",
    "W W WWWWW WW W W",
    "W W       WW   W",
    "W WWWWWWWWWWWWCW",
    "WWWWWWWWWWWWWWWW"
  ]
];

const TILE_CLASSES = {
  W: "cell cell-wall",
  " ": "cell cell-path",
  P: "cell cell-player",
  C: "cell cell-chest"
};

let level = 0;
let playerPos = { x: 0, y: 0 };

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
      if (cell === "P") {
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
  if (!tile || tile === "W") return;

  if (tile === "C") {
    if (level === 0) {
      level = 1;
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
