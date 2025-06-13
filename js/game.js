// game.js

const gameEl = document.getElementById("game");
const modal = document.getElementById("contact-modal");

const LEVELS = [
    // Level 1
    [
        "WWWWWWWWWW",
        "WP  W    W",
        "W W W WW W",
        "W W   W  W",
        "W WWWWW WW",
        "W     W  W",
        "WWW W W WW",
        "W   W    W",
        "W WWWW   C",
        "WWWWWWWWWW",
    ],
    // Level 2
    [
        "WWWWWWWWWW",
        "W     W  W",
        "W WWWWW WW",
        "W   W    W",
        "WW W WWWWW",
        "WCW W    W",
        "W W WWW WW",
        "W   W    W",
        "W WWWWW WP",
        "WWWWWWWWWW",
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

// Generate the board from a level array
function renderLevel() {
    gameEl.innerHTML = ""; // Clear board
    const map = LEVELS[level];

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

// Move the player on key press
function movePlayer(dx, dy) {
    const map = LEVELS[level];
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    const row = map?.[newY];
    if (!row) return;

    const tile = row[newX];
    if (!tile || tile === "W") return; // wall

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

    // Update map
    LEVELS[level][playerPos.y] = replaceChar(map[playerPos.y], playerPos.x, " ");
    LEVELS[level][newY] = replaceChar(map[newY], newX, "P");

    playerPos = { x: newX, y: newY };
    renderLevel();
}

// Replace a character in a string (utility)
function replaceChar(str, index, replacement) {
    return str.substring(0, index) + replacement + str.substring(index + 1);
}

// Arrow key controls
document.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowUp": return movePlayer(0, -1);
        case "ArrowDown": return movePlayer(0, 1);
        case "ArrowLeft": return movePlayer(-1, 0);
        case "ArrowRight": return movePlayer(1, 0);
    }
});

// Init game
renderLevel();
