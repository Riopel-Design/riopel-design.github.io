// game.js — Escape the Maze: fog of war, ghost enemies, power-ups, scoring
// ═══════════════════════════════════════════════════════════════

const gameEl = document.getElementById('game');
const hudLevel = document.getElementById('hud-level');
const hudMoves = document.getElementById('hud-moves');
const hudKey = document.getElementById('hud-key');
const hudTime = document.getElementById('hud-time');
const hudScore = document.getElementById('hud-score');
const levelFlash = document.getElementById('level-flash');
const levelText = document.getElementById('level-text');

let level = 0;
let playerPos = { x: 0, y: 0 };
let hasKey = false;
let powered = false;
let powerTimer = null;
let moves = 0;
let score = 0;
let ghostsEaten = 0;
let startTime = Date.now();
let timerInterval = null;
let enemies = [];
let enemyInterval = null;
let visited = new Set();
let gameOver = false;
let moveBuffer = null;
let lastMoveTime = 0;

// ─── Level configs ───
const LEVEL_CONFIG = [
  { w: 13, h: 13, vis: 4, enemies: 0, powerups: 0, label: 'Level 1' },
  { w: 13, h: 13, vis: 3, enemies: 2, powerups: 1, label: 'Level 2' },
  { w: 15, h: 15, vis: 3, enemies: 3, powerups: 1, label: 'Level 3' },
  { w: 15, h: 15, vis: 3, enemies: 4, powerups: 2, label: 'Level 4' },
  { w: 17, h: 17, vis: 2, enemies: 5, powerups: 2, label: 'Level 5' },
  { w: 17, h: 17, vis: 2, enemies: 6, powerups: 2, label: 'Final Level' },
];

let currentMap = [];

// ═══════ MAZE GENERATION ═══════
function generateMaze(width, height) {
  const maze = Array.from({ length: height }, () => Array(width).fill('W'));

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function carve(x, y) {
    maze[y][x] = ' ';
    const dirs = shuffle([[0,-2],[0,2],[-2,0],[2,0]]);
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (ny >= 1 && ny < height-1 && nx >= 1 && nx < width-1 && maze[ny][nx] === 'W') {
        maze[y + dy/2][x + dx/2] = ' ';
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);
  maze[1][1] = 'P';

  // BFS distances
  const dist = Array.from({ length: height }, () => Array(width).fill(Infinity));
  const queue = [[1, 1, 0]];
  dist[1][1] = 0;
  let farthest = [1, 1, 0];
  const empties = [];

  while (queue.length) {
    const [x, y, d] = queue.shift();
    if (d > farthest[2]) farthest = [x, y, d];
    if (maze[y][x] === ' ' || maze[y][x] === 'P') empties.push({ x, y, d });
    for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nx = x+dx, ny = y+dy;
      if (ny >= 0 && ny < height && nx >= 0 && nx < width && maze[ny][nx] !== 'W' && d+1 < dist[ny][nx]) {
        dist[ny][nx] = d + 1;
        queue.push([nx, ny, d+1]);
      }
    }
  }

  // Chest at farthest point
  maze[farthest[1]][farthest[0]] = 'C';

  empties.sort((a, b) => a.d - b.d);
  const maxD = farthest[2];
  let placedKey = false, placedDoor = false;

  for (const cell of empties) {
    if (!placedKey && cell.d > maxD * 0.25 && cell.d < maxD * 0.45 && maze[cell.y][cell.x] === ' ') {
      maze[cell.y][cell.x] = 'K';
      placedKey = true;
    }
    if (!placedDoor && cell.d > maxD * 0.55 && cell.d < maxD * 0.75 && maze[cell.y][cell.x] === ' ') {
      maze[cell.y][cell.x] = 'D';
      placedDoor = true;
    }
    if (placedKey && placedDoor) break;
  }

  return maze;
}

// ═══════ POWER-UPS ═══════
function placePowerups(maze, count) {
  const empties = [];
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[0].length; x++) {
      if (maze[y][x] === ' ') {
        const dx = Math.abs(x - 1); // distance from start
        const dy = Math.abs(y - 1);
        if (dx + dy > 4) empties.push({ x, y });
      }
    }
  }
  for (let i = 0; i < Math.min(count, empties.length); i++) {
    const idx = Math.floor(Math.random() * empties.length);
    const pos = empties.splice(idx, 1)[0];
    maze[pos.y][pos.x] = 'Z'; // Z = power-up (⚡)
  }
}

function activatePower() {
  powered = true;
  ghostsEaten = 0;
  clearTimeout(powerTimer);
  // Power lasts 25 moves worth of enemy ticks (~8 seconds)
  powerTimer = setTimeout(() => {
    powered = false;
    renderLevel();
  }, 8000);
  renderLevel();
}

// ═══════ ENEMY LOGIC ═══════
function spawnEnemies(maze, count) {
  enemies = [];
  const empties = [];
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[0].length; x++) {
      if (maze[y][x] === ' ') {
        const dx = Math.abs(x - playerPos.x);
        const dy = Math.abs(y - playerPos.y);
        if (dx + dy > 6) empties.push({ x, y });
      }
    }
  }

  for (let i = 0; i < Math.min(count, empties.length); i++) {
    const idx = Math.floor(Math.random() * empties.length);
    const pos = empties.splice(idx, 1)[0];
    enemies.push({ x: pos.x, y: pos.y, dir: Math.floor(Math.random() * 4), dead: false, respawnIn: 0 });
  }
}

function moveEnemies() {
  if (gameOver) return;
  const dirs = [[0,-1],[0,1],[-1,0],[1,0]];

  enemies.forEach(e => {
    // Dead ghost respawning
    if (e.dead) {
      e.respawnIn--;
      if (e.respawnIn <= 0) {
        e.dead = false;
        // Find a random empty spot far from player
        const empties = [];
        for (let y = 0; y < currentMap.length; y++) {
          for (let x = 0; x < currentMap[0].length; x++) {
            if (currentMap[y][x] === ' ' && Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y) > 6) {
              empties.push({ x, y });
            }
          }
        }
        if (empties.length) {
          const pos = empties[Math.floor(Math.random() * empties.length)];
          e.x = pos.x;
          e.y = pos.y;
          currentMap[e.y][e.x] = 'E';
        }
      }
      return;
    }

    // Smart AI: 40% chance to chase player, 60% random wander
    let chasing = Math.random() < 0.4 && !powered;
    if (chasing) {
      // Move toward player
      const pdx = playerPos.x - e.x;
      const pdy = playerPos.y - e.y;
      let bestDir = e.dir;
      let bestDist = Infinity;
      for (let d = 0; d < 4; d++) {
        const [ddx, ddy] = dirs[d];
        const nx = e.x + ddx, ny = e.y + ddy;
        const tile = currentMap[ny]?.[nx];
        if (tile && tile !== 'W' && tile !== 'D' && tile !== 'K' && tile !== 'C' && tile !== 'Z') {
          const dist = Math.abs(playerPos.x - nx) + Math.abs(playerPos.y - ny);
          if (dist < bestDist) { bestDist = dist; bestDir = d; }
        }
      }
      // If powered, run AWAY instead
      if (powered) {
        let worstDist = 0;
        for (let d = 0; d < 4; d++) {
          const [ddx, ddy] = dirs[d];
          const nx = e.x + ddx, ny = e.y + ddy;
          const tile = currentMap[ny]?.[nx];
          if (tile && tile !== 'W' && tile !== 'D' && tile !== 'K' && tile !== 'C' && tile !== 'Z') {
            const dist = Math.abs(playerPos.x - nx) + Math.abs(playerPos.y - ny);
            if (dist > worstDist) { worstDist = dist; bestDir = d; }
          }
        }
      }
      e.dir = bestDir;
    }

    let attempts = 0;
    while (attempts < 8) {
      const [dx, dy] = dirs[e.dir];
      const nx = e.x + dx, ny = e.y + dy;
      const tile = currentMap[ny]?.[nx];
      if (tile && tile !== 'W' && tile !== 'D' && tile !== 'K' && tile !== 'C' && tile !== 'Z') {
        if (currentMap[e.y][e.x] === 'E') currentMap[e.y][e.x] = ' ';
        e.x = nx;
        e.y = ny;

        // Collision
        if (e.x === playerPos.x && e.y === playerPos.y) {
          if (powered) {
            onGhostEaten(e);
          } else {
            onCaught();
          }
          return;
        }

        currentMap[e.y][e.x] = 'E';
        if (!chasing && Math.random() > 0.65) e.dir = Math.floor(Math.random() * 4);
        break;
      } else {
        e.dir = Math.floor(Math.random() * 4);
        attempts++;
      }
    }
  });

  renderLevel();
}

function onGhostEaten(enemy) {
  enemy.dead = true;
  enemy.respawnIn = 15; // Respawn after 15 enemy ticks
  ghostsEaten++;

  // Combo scoring: 100, 200, 400, 800...
  const points = 100 * Math.pow(2, ghostsEaten - 1);
  score += points;
  hudScore.textContent = score;

  if (currentMap[enemy.y][enemy.x] === 'E') currentMap[enemy.y][enemy.x] = ' ';

  showScorePop(points, true);
  showToast(`👻 Ghost eaten! +${points}`, '#3b82f6');
}

function onCaught() {
  gameOver = true;
  clearInterval(enemyInterval);
  screenShake();
  showToast('👻 Caught! Restarting level...', '#dc2626');

  // Lose some score
  score = Math.max(0, score - 50);
  hudScore.textContent = score;

  setTimeout(() => {
    gameOver = false;
    startLevel(level);
  }, 1500);
}

// ═══════ SCREEN SHAKE ═══════
function screenShake() {
  gameEl.classList.add('shake');
  setTimeout(() => gameEl.classList.remove('shake'), 300);
}

// ═══════ SCORE POPUP ═══════
function showScorePop(points, isGhost) {
  const el = document.createElement('div');
  el.className = 'score-pop' + (isGhost ? ' ghost-kill' : '');
  el.textContent = `+${points}`;
  el.style.left = '50%';
  el.style.top = '40%';
  el.style.transform = 'translateX(-50%)';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// ═══════ RENDERING ═══════
function renderLevel() {
  gameEl.innerHTML = '';
  const rows = currentMap.length;
  const cols = currentMap[0].length;
  const config = LEVEL_CONFIG[level];
  const vis = config.vis;

  // Compact: cap at 50vh so void teaser is visible
  const maxTileVh = 50 / rows;
  const maxTileVw = 85 / cols;
  const tileSize = Math.min(maxTileVh, maxTileVw);

  gameEl.style.gridTemplateColumns = `repeat(${cols}, ${tileSize}vh)`;
  gameEl.style.gridAutoRows = `${tileSize}vh`;
  gameEl.style.display = 'grid';
  gameEl.style.gap = '1px';
  gameEl.style.background = '#0a0c12';

  currentMap.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      const div = document.createElement('div');
      const dx = Math.abs(x - playerPos.x);
      const dy = Math.abs(y - playerPos.y);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > vis + 1) {
        div.className = 'cell cell-fog';
      } else if (dist > vis) {
        div.className = getCellClass(cell, x, y) + ' cell-dim';
      } else {
        div.className = getCellClass(cell, x, y);
      }

      gameEl.appendChild(div);
    });
  });
}

function getCellClass(cell, x, y) {
  const key = `${x},${y}`;
  switch (cell) {
    case 'W': return 'cell cell-wall';
    case 'P': return 'cell cell-player' + (powered ? ' powered' : '');
    case 'K': return 'cell cell-key';
    case 'D': return hasKey ? 'cell cell-door unlocked' : 'cell cell-door';
    case 'C': return 'cell cell-chest';
    case 'E': return 'cell cell-enemy' + (powered ? ' scared' : '');
    case 'Z': return 'cell cell-powerup';
    default:
      return visited.has(key) ? 'cell cell-visited' : 'cell cell-path';
  }
}

// ═══════ PLAYER MOVEMENT ═══════
function movePlayer(dx, dy) {
  if (gameOver) return;

  // Movement rate limiting for smooth feel
  const now = Date.now();
  if (now - lastMoveTime < 80) return;
  lastMoveTime = now;

  const nx = playerPos.x + dx;
  const ny = playerPos.y + dy;
  const tile = currentMap?.[ny]?.[nx];

  if (!tile || tile === 'W') return;
  if (tile === 'D' && !hasKey) {
    showToast('🔒 Find the key first!');
    screenShake();
    return;
  }

  // Key
  if (tile === 'K') {
    hasKey = true;
    hudKey.textContent = '🔑';
    hudKey.classList.add('has-key');
    score += 50;
    hudScore.textContent = score;
    showToast('🔑 Key found! +50');
    showScorePop(50, false);
  }

  // Door
  if (tile === 'D' && hasKey) {
    showToast('🚪 Door unlocked!');
    score += 25;
    hudScore.textContent = score;
  }

  // Power-up
  if (tile === 'Z') {
    showToast('⚡ POWER UP! Hunt the ghosts!', '#3b82f6');
    activatePower();
  }

  // Enemy collision
  if (tile === 'E') {
    if (powered) {
      // Find and eat this enemy
      const enemy = enemies.find(e => e.x === nx && e.y === ny && !e.dead);
      if (enemy) onGhostEaten(enemy);
    } else {
      onCaught();
      return;
    }
  }

  // Chest
  if (tile === 'C') {
    // Time bonus: under 30s = 500, under 60s = 250, else 100
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    let bonus = elapsed < 30 ? 500 : elapsed < 60 ? 250 : 100;
    // Move efficiency bonus
    bonus += Math.max(0, 200 - moves);
    score += bonus;
    hudScore.textContent = score;
    showScorePop(bonus, false);

    if (level < LEVEL_CONFIG.length - 1) {
      level++;
      showLevelTransition(LEVEL_CONFIG[level].label);
      setTimeout(() => startLevel(level), 1200);
    } else {
      showVictory();
    }
    return;
  }

  // Move
  currentMap[playerPos.y][playerPos.x] = ' ';
  visited.add(`${playerPos.x},${playerPos.y}`);
  currentMap[ny][nx] = 'P';
  playerPos = { x: nx, y: ny };
  moves++;
  hudMoves.textContent = moves;

  renderLevel();
}

// ═══════ KEY REPEAT HANDLING ═══════
let keysDown = {};
let moveInterval = null;

function startMoving(dx, dy) {
  movePlayer(dx, dy);
  clearInterval(moveInterval);
  moveInterval = setInterval(() => movePlayer(dx, dy), 110);
}

function stopMoving() {
  clearInterval(moveInterval);
  moveInterval = null;
}

// ═══════ LEVEL MANAGEMENT ═══════
function startLevel(idx) {
  const config = LEVEL_CONFIG[idx];
  const maze = generateMaze(config.w, config.h);
  currentMap = maze.map(row => [...row]);
  playerPos = { x: 1, y: 1 };
  hasKey = false;
  powered = false;
  clearTimeout(powerTimer);
  moves = 0;
  visited = new Set();
  gameOver = false;

  hudLevel.textContent = idx + 1;
  hudMoves.textContent = '0';
  hudKey.textContent = '✗';
  hudKey.classList.remove('has-key');
  hudScore.textContent = score;

  startTime = Date.now();
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);

  // Place power-ups
  placePowerups(currentMap, config.powerups);

  // Spawn enemies
  clearInterval(enemyInterval);
  spawnEnemies(currentMap, config.enemies);
  enemies.forEach(e => { if (!e.dead) currentMap[e.y][e.x] = 'E'; });

  if (config.enemies > 0) {
    const speed = Math.max(350, 600 - idx * 40);
    enemyInterval = setInterval(moveEnemies, speed);
  }

  renderLevel();
}

// ═══════ UI ═══════
function updateTimer() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = (elapsed % 60).toString().padStart(2, '0');
  hudTime.textContent = `${mins}:${secs}`;
}

function showToast(msg, bg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = 'toast';
  if (bg) el.style.background = bg;
  el.textContent = msg;
  document.body.appendChild(el);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('show'));
  });
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2000);
}

function showLevelTransition(label) {
  levelText.textContent = label;
  levelFlash.classList.add('active');
  setTimeout(() => levelFlash.classList.remove('active'), 1000);
}

function showVictory() {
  gameOver = true;
  clearInterval(enemyInterval);
  clearInterval(timerInterval);

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:300;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px)';

  overlay.innerHTML = `
    <div style="background:#141211;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:48px;text-align:center;max-width:420px;margin:20px">
      <div style="font-size:48px;margin-bottom:16px">🏆</div>
      <h2 style="font-family:'Syne',sans-serif;font-weight:800;font-size:28px;color:#fff;margin-bottom:8px">You escaped.</h2>
      <p style="color:rgba(255,255,255,0.5);font-size:14px;margin-bottom:6px">
        Score: <strong style="color:#facc15">${score}</strong>
      </p>
      <p style="color:rgba(255,255,255,0.35);font-size:12px;margin-bottom:24px">
        ${moves} moves · ${Math.floor(elapsed/60)}:${(elapsed%60).toString().padStart(2,'0')} · ${LEVEL_CONFIG.length} levels · ${ghostsEaten} ghosts eaten
      </p>
      <p style="color:rgba(255,255,255,0.6);font-size:14px;margin-bottom:8px">Now let's talk for real:</p>
      <a href="mailto:rriopel.design@gmail.com"
         style="display:inline-block;padding:12px 32px;background:#C2410C;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.03em;transition:background 0.2s"
         onmouseover="this.style.background='#a3360a'" onmouseout="this.style.background='#C2410C'">
        rriopel.design@gmail.com
      </a>
      <br/>
      <button onclick="document.getElementById('modal-overlay').remove();level=0;score=0;ghostsEaten=0;startLevel(0)"
        style="margin-top:16px;background:none;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.5);padding:8px 20px;border-radius:8px;cursor:pointer;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;transition:all 0.2s"
        onmouseover="this.style.borderColor='rgba(255,255,255,0.4)';this.style.color='#fff'" onmouseout="this.style.borderColor='rgba(255,255,255,0.15)';this.style.color='rgba(255,255,255,0.5)'">
        Play again
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
}

// ═══════ INPUT ═══════
const dirMap = {
  ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0],
  w: [0,-1], s: [0,1], a: [-1,0], d: [1,0]
};

document.addEventListener('keydown', (e) => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
  const dir = dirMap[e.key];
  if (!dir) return;

  if (!keysDown[e.key]) {
    keysDown[e.key] = true;
    startMoving(dir[0], dir[1]);
  }
});

document.addEventListener('keyup', (e) => {
  if (keysDown[e.key]) {
    delete keysDown[e.key];
    // If another key is still held, move in that direction
    const remaining = Object.keys(keysDown);
    if (remaining.length > 0) {
      const dir = dirMap[remaining[remaining.length - 1]];
      if (dir) startMoving(dir[0], dir[1]);
    } else {
      stopMoving();
    }
  }
});

// Touch controls
document.querySelectorAll('.touch-btn').forEach(btn => {
  const dirs = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
  const dir = dirs[btn.dataset.dir];
  if (dir) {
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); movePlayer(dir[0], dir[1]); });
    btn.addEventListener('click', () => movePlayer(dir[0], dir[1]));
  }
});

// Swipe support
let touchStartX = 0, touchStartY = 0;
document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });
document.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const threshold = 30;
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    movePlayer(dx > 0 ? 1 : -1, 0);
  } else {
    movePlayer(0, dy > 0 ? 1 : -1);
  }
}, { passive: true });

// ═══════ GO ═══════
showToast('Find the key → unlock the door → reach ✨');
startLevel(0);