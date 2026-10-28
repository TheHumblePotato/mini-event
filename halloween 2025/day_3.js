// Spooky Crossy Road - Fixed with Day 2 styling and features
(() => {
const PT_TZ = 'America/Los_Angeles';
const nowPT = () => new Date(new Date().toLocaleString('en-US', { timeZone: PT_TZ }));

// Blocked weekday ranges
const BLOCKED_RANGES = [[8*60 + 15, 11*60], [12*60 + 50, 15*60 + 20]];
function isWeekday(d){ const day = d.getDay(); return day >= 1 && day <= 5; }
function inBlockedWindow(ptDate){
  if(!isWeekday(ptDate)) return false;
  const mins = ptDate.getHours()*60 + ptDate.getMinutes();
  return BLOCKED_RANGES.some(([a,b]) => mins >= a && mins < b);
}

function showTimeLockOverlay(message){
  if(document.getElementById('time-lock-overlay')) return;
  const o = document.createElement('div');
  o.id = 'time-lock-overlay';
  Object.assign(o.style, {
    position: 'fixed', inset: '0', zIndex: 99999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.92)', color: '#ffdca8', textAlign: 'center',
    padding: '24px', fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif'
  });
  o.innerHTML = `<div style="max-width:820px">
    <h2 style="margin:0 0 8px">Game temporarily unavailable</h2>
    <p style="margin:0 0 12px">${message}</p>
    <div style="opacity:.85;font-size:.9rem">Blocked PT weekday hours: 08:15–11:00 and 12:50–15:20</div>
  </div>`;
  document.body.appendChild(o);
}

function hideTimeLockOverlay(){
  const el = document.getElementById('time-lock-overlay');
  if(el) el.remove();
}

const UNLOCK_ISO = '2025-10-29T00:00:00-07:00';
const unlockDate = new Date(UNLOCK_ISO);

const rn = nowPT();
if(rn < unlockDate){
  showTimeLockOverlay(`This game will unlock on ${unlockDate.toLocaleString('en-US', { timeZone: PT_TZ })} PT.`);
  return;
}

if(inBlockedWindow(rn)){
  showTimeLockOverlay('This game is temporarily blocked for scheduled hours. Please try again later.');
}

const __timeLockChecker = setInterval(() => {
  const n = nowPT();
  if(n < unlockDate){
    if(!document.getElementById('time-lock-overlay')){
      showTimeLockOverlay(`This game will unlock on ${unlockDate.toLocaleString('en-US', { timeZone: PT_TZ })} PT.`);
    }
    return;
  }
  if(!inBlockedWindow(n)){
    hideTimeLockOverlay();
    clearInterval(__timeLockChecker);
  } else {
    if(!document.getElementById('time-lock-overlay')){
      showTimeLockOverlay('This game is temporarily blocked for scheduled hours. Please try again later.');
    }
  }
}, 30_000);

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const playbound = document.getElementById('playbound');
  const scoreEl = document.getElementById('big-score');
  const playOverlay = document.getElementById('play-overlay');
  const playBtn = document.getElementById('play-btn');
  const gameOverModal = document.getElementById('game-over-modal');
  const gameOverContent = gameOverModal ? gameOverModal.querySelector('.modal-content') : null;
  const finalScoreEl = document.getElementById('final-score');
  const retryBtn = document.getElementById('retry-btn');
  const submitScoreBtn = document.getElementById('submit-score-btn');
  const submitNote = document.getElementById('submit-note');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const dayLeaderboardBtn = document.getElementById('day-leaderboard-btn');
  const dayLeaderboardModal = document.getElementById('day-leaderboard-modal');
  const dayLeaderboardBody = document.getElementById('day-leaderboard-body');
  const dayLeaderboardClose = document.getElementById('day-leaderboard-close');
  const gameTimerHeader = document.getElementById('game-timer');
  const backgroundRoot = document.getElementById('background');

  const now = new Date();
  const year = now.getFullYear();
  const GAME_END_TS = Date.parse(`${year}-10-30T00:00:00-07:00`);

  // Game constants - REBALANCED for higher scores
  const CANVAS_W = 480;
  const CANVAS_H = 720;
  const TILE_SIZE = 60;
  const PLAYER_SIZE = 40;
  const GRID_COLS = 8;
  const VISIBLE_ROWS = 16;
  const SAFE_START_ROWS = 3; // Reduced from 4
  const ROW_BUFFER = 8;

  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  // Game state
  let player = null;
  let rows = new Map();
  let score = 0;
  let highestRow = 0;
  let running = false;
  let gameLoop = null;
  let cameraY = 0;
  let nextRowId = 0;

  // Player object
  function createPlayer() {
    return {
      col: Math.floor(GRID_COLS / 2),
      row: 0, // Start at row 0
      x: 0,
      y: 0,
      size: PLAYER_SIZE,
      alive: true,
      ridingLog: null
    };
  }

  // Row types and generation - REBALANCED
  function createRow(rowNum) {
    const row = {
      id: rowNum,
      num: rowNum,
      type: 'grass',
      obstacles: []
    };

    // First row is always safe island
    if (rowNum === 0) {
      row.type = 'island';
      return row;
    }

    // Safe starting area - only grass/island
    if (rowNum < SAFE_START_ROWS) {
      row.type = Math.random() < 0.5 ? 'grass' : 'island';
      return row;
    }

    // Progressive difficulty
    const difficulty = Math.min(1, (rowNum - SAFE_START_ROWS) / 30);
    
    // Generate terrain with better distribution
    const rand = Math.random();
    
    if (rand < 0.15) {
      row.type = 'grass';
    } else if (rand < 0.30) {
      row.type = 'island';
    } else if (rand < 0.65) {
      row.type = 'road';
      generateRoadObstacles(row, rowNum, difficulty);
    } else {
      row.type = 'river';
      generateRiverObstacles(row, rowNum, difficulty);
    }

    return row;
  }

  function generateRoadObstacles(row, rowNum, difficulty) {
    const direction = Math.random() < 0.5 ? 1 : -1;
    const speedVariation = Math.random();
    let baseSpeed;
    
    // Speed tiers - slightly slower for more manageable gameplay
    if (speedVariation < 0.2) {
      baseSpeed = 0.7 + Math.random() * 0.3; // Fast
    } else if (speedVariation < 0.5) {
      baseSpeed = 0.4 + Math.random() * 0.3; // Medium
    } else {
      baseSpeed = 0.2 + Math.random() * 0.2; // Slow
    }
    
    const speed = (baseSpeed + difficulty * 0.5) * direction;
    const spacing = 170 + Math.random() * 90; // More spacing
    const count = Math.max(2, Math.ceil(CANVAS_W / spacing));

    for (let i = 0; i < count; i++) {
      const isGhost = Math.random() < (0.25 + difficulty * 0.35);
      row.obstacles.push({
        x: i * spacing + Math.random() * 60,
        speed: speed,
        width: isGhost ? 50 : 60,
        height: isGhost ? 50 : 45,
        type: isGhost ? 'ghost' : 'car'
      });
    }
  }

  function generateRiverObstacles(row, rowNum, difficulty) {
    const direction = Math.random() < 0.5 ? 1 : -1;
    const speedVariation = Math.random();
    let baseSpeed;
    
    if (speedVariation < 0.3) {
      baseSpeed = 0.4 + Math.random() * 0.3;
    } else if (speedVariation < 0.6) {
      baseSpeed = 0.25 + Math.random() * 0.15;
    } else {
      baseSpeed = 0.1 + Math.random() * 0.15;
    }
    
    const speed = (baseSpeed + difficulty * 0.3) * direction;
    const spacing = 160 + Math.random() * 70; // Better log spacing
    const count = Math.max(2, Math.ceil(CANVAS_W / spacing));

    for (let i = 0; i < count; i++) {
      row.obstacles.push({
        x: i * spacing + Math.random() * 30,
        speed: speed,
        width: 130 + Math.random() * 50, // Wider logs
        height: 30,
        type: 'log'
      });
    }
  }

  // Initialize game
  function initGame() {
    player = createPlayer();
    rows = new Map();
    score = 0;
    highestRow = 0;
    cameraY = 0;
    nextRowId = 0;
    
    // Create initial rows - FIX: Start from 0 instead of negative
    for (let i = 0; i < VISIBLE_ROWS + ROW_BUFFER; i++) {
      const row = createRow(i);
      rows.set(i, row);
      nextRowId = Math.max(nextRowId, i + 1);
    }
    
    updatePlayerPosition();
    updateScore();
  }

  function startGame() {
    initGame();
    running = true;
    player.alive = true;
    hideModal(playOverlay);
    hideGameOverContent();
    if (gameLoop) cancelAnimationFrame(gameLoop);
    gameLoop = requestAnimationFrame(update);
  }

  function endGame() {
    running = false;
    player.alive = false;
    finalScoreEl.textContent = score;
    if(submitNote) submitNote.textContent = (Date.now() <= GAME_END_TS) ? 'This score is within the event window and can be submitted to the main leaderboard.' : 'Event window ended — score will not be counted';
    
    if(gameOverContent && playbound){
      if(gameOverContent.parentElement !== playbound) playbound.appendChild(gameOverContent);
      gameOverContent.style.position = 'absolute';
      gameOverContent.style.left = '50%';
      gameOverContent.style.top = '48%';
      gameOverContent.style.transform = 'translate(-50%,-50%)';
      gameOverContent.classList.remove('hidden');
    } else if (gameOverModal){
      gameOverModal.classList.remove('hidden');
    }
  }

  function hideGameOverContent(){
    if(!gameOverContent) return;
    gameOverContent.classList.add('hidden');
    const wrapper = gameOverModal;
    if(wrapper && gameOverContent.parentElement !== wrapper) wrapper.appendChild(gameOverContent);
    gameOverContent.style.position = '';
    gameOverContent.style.left = '';
    gameOverContent.style.top = '';
    gameOverContent.style.transform = '';
  }

  function updateCamera() {
    if (!player) return;
    const targetY = player.row * TILE_SIZE - (CANVAS_H / 2 - TILE_SIZE);
    cameraY = targetY;
  }

  function updatePlayerPosition() {
    if (!player) return;
    player.x = player.col * TILE_SIZE + (TILE_SIZE - PLAYER_SIZE) / 2;
    player.y = getRowY(player.row) + (TILE_SIZE - PLAYER_SIZE) / 2;
  }

  // Movement with IMPROVED SCORING
  function movePlayer(dcol, drow) {
    if (!player || !player.alive) return;

    const newCol = Math.max(0, Math.min(GRID_COLS - 1, player.col + dcol));
    const newRow = Math.max(0, player.row + drow);

    player.col = newCol;
    player.row = newRow;
    player.ridingLog = null;

    updateCamera();
    updatePlayerPosition();

    // REBALANCED SCORING: Much higher to reach 10k+
    if (newRow > highestRow) {
      const rowsGained = newRow - highestRow;
      
      // Progressive scoring tiers
      let pointsPerRow = 15; // Base increased from 10
      if (newRow > 30) pointsPerRow = 25;
      if (newRow > 60) pointsPerRow = 35;
      if (newRow > 100) pointsPerRow = 50;
      if (newRow > 150) pointsPerRow = 70;
      if (newRow > 200) pointsPerRow = 100;
      
      // Combo bonus for consecutive progress
      const comboBonus = Math.floor(newRow / 5) * 8;
      
      score += rowsGained * pointsPerRow + comboBonus;
      highestRow = newRow;
      updateScore();
    }

    ensureRowsExist();
  }

  function updateRaftMovement(dt) {
    if (!player || !player.alive || !player.ridingLog) return;

    player.x += player.ridingLog.speed * dt * 0.1;
    player.col = Math.floor(player.x / TILE_SIZE);
    player.col = Math.max(0, Math.min(GRID_COLS - 1, player.col));
    updatePlayerPosition();
  }

  function ensureRowsExist() {
    if (!player) return;

    const minRow = Math.max(0, player.row - ROW_BUFFER);
    const maxRow = player.row + VISIBLE_ROWS + ROW_BUFFER;

    for (let rowNum = player.row; rowNum <= maxRow; rowNum++) {
      if (!rows.has(rowNum)) {
        const row = createRow(rowNum);
        rows.set(rowNum, row);
        nextRowId = Math.max(nextRowId, rowNum + 1);
      }
    }

    for (let rowNum = player.row - 1; rowNum >= minRow; rowNum--) {
      if (!rows.has(rowNum)) {
        const row = createRow(rowNum);
        rows.set(rowNum, row);
      }
    }

    const cleanupThreshold = 30;
    for (let [rowNum, row] of rows) {
      if (rowNum < player.row - cleanupThreshold || rowNum > player.row + cleanupThreshold) {
        rows.delete(rowNum);
      }
    }
  }

  function updateScore() {
    if (scoreEl) scoreEl.textContent = `Score: ${score}`;
  }

  function checkCollisions() {
    if (!player || !player.alive) return;

    const currentRow = rows.get(player.row);
    if (!currentRow) return;

    if (currentRow.type === 'road') {
      for (const obs of currentRow.obstacles) {
        const obstacleY = getRowY(player.row) + (TILE_SIZE - obs.height) / 2;
        
        if (boxCollision(player.x, player.y, player.size, player.size,
                         obs.x, obstacleY, obs.width, obs.height)) {
          endGame();
          return;
        }
      }
    } else if (currentRow.type === 'river') {
      let onLog = false;
      
      for (const obs of currentRow.obstacles) {
        const playerCenterX = player.x + player.size / 2;
        const obstacleY = getRowY(player.row) + (TILE_SIZE - obs.height) / 2;
        
        if (playerCenterX > obs.x && playerCenterX < obs.x + obs.width &&
            player.y < obstacleY + obs.height && player.y + player.size > obstacleY) {
          onLog = true;
          player.ridingLog = obs;
          break;
        }
      }
      
      if (!onLog && !player.ridingLog) {
        endGame();
        return;
      }
      
      if (player.ridingLog && !onLog) {
        endGame();
        return;
      }
    } else {
      player.ridingLog = null;
    }

    if (player.x < -player.size || player.x > CANVAS_W) {
      endGame();
    }
  }

  function boxCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 - 8 && x1 + w1 > x2 + 8 &&
           y1 < y2 + h2 - 8 && y1 + h1 > y2 + 8;
  }

  function getRowY(rowNum) {
    return rowNum * TILE_SIZE - cameraY;
  }

  function updateObstacles(dt) {
    for (const [rowNum, row] of rows) {
      for (const obs of row.obstacles) {
        obs.x += obs.speed * dt * 0.1;
        
        if (obs.speed > 0 && obs.x > CANVAS_W + 100) {
          obs.x = -obs.width - 50;
        } else if (obs.speed < 0 && obs.x < -obs.width - 100) {
          obs.x = CANVAS_W + 50;
        }
      }
    }

    if (player && player.ridingLog) {
      updateRaftMovement(dt);
    }
  }

  // Input handling
  let lastMoveTime = 0;
  const MOVE_COOLDOWN = 150;

  window.addEventListener('keydown', (e) => {
    if (!running || !player || !player.alive) return;
    
    const now = Date.now();
    if (now - lastMoveTime < MOVE_COOLDOWN) return;

    const key = e.key.toLowerCase();
    let moved = false;

    if (key === 'arrowleft' || key === 'a' || key === 'j') {
      movePlayer(-1, 0);
      moved = true;
    } else if (key === 'arrowright' || key === 'd' || key === 'l') {
      movePlayer(1, 0);
      moved = true;
    } else if (key === 'arrowup' || key === 'w' || key === 'i') {
      movePlayer(0, -1);
      moved = true;
    } else if (key === 'arrowdown' || key === 's' || key === 'k') {
      movePlayer(0, 1);
      moved = true;
    }

    if (moved) {
      lastMoveTime = now;
      e.preventDefault();
    }
  });

  // Drawing functions
  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, '#0a0508');
    grad.addColorStop(1, '#1a0a14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  function drawRows() {
    const sortedRows = Array.from(rows.values()).sort((a, b) => a.num - b.num);
    
    for (const row of sortedRows) {
      const y = getRowY(row.num);
      
      if (y < -TILE_SIZE || y > CANVAS_H + TILE_SIZE) continue;

      if (row.type === 'grass') {
        ctx.fillStyle = '#3d2f1f';
        ctx.fillRect(0, y, CANVAS_W, TILE_SIZE);
        ctx.fillStyle = '#2d1f0f';
        for (let i = 0; i < GRID_COLS; i++) {
          ctx.fillRect(i * TILE_SIZE + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }
      } else if (row.type === 'island') {
        ctx.fillStyle = '#5a4a2a';
        ctx.fillRect(0, y, CANVAS_W, TILE_SIZE);
        ctx.fillStyle = '#ff8c00';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎃', CANVAS_W / 2, y + TILE_SIZE / 2 + 10);
      } else if (row.type === 'road') {
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, y, CANVAS_W, TILE_SIZE);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 15]);
        ctx.beginPath();
        ctx.moveTo(0, y + TILE_SIZE / 2);
        ctx.lineTo(CANVAS_W, y + TILE_SIZE / 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (row.type === 'river') {
        const grad = ctx.createLinearGradient(0, y, 0, y + TILE_SIZE);
        grad.addColorStop(0, '#1a4a5a');
        grad.addColorStop(1, '#0f2a3a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, y, CANVAS_W, TILE_SIZE);
      }

      for (const obs of row.obstacles) {
        const oy = y + (TILE_SIZE - obs.height) / 2;
        
        if (obs.type === 'car') {
          const speedRatio = Math.abs(obs.speed) / 1.5;
          const red = Math.min(255, 180 + speedRatio * 75);
          const color = `rgb(${red}, 30, 58)`;
          
          ctx.fillStyle = color;
          roundRect(ctx, obs.x, oy, obs.width, obs.height, 8);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillRect(obs.x + 10, oy + 5, obs.width * 0.4, obs.height * 0.4);
        } else if (obs.type === 'ghost') {
          const speedRatio = Math.abs(obs.speed) / 1.5;
          const alpha = Math.min(0.95, 0.7 + speedRatio * 0.25);
          
          ctx.fillStyle = `rgba(230,240,255,${alpha})`;
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, oy + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(obs.x + obs.width * 0.35, oy + obs.height * 0.4, 4, 0, Math.PI * 2);
          ctx.arc(obs.x + obs.width * 0.65, oy + obs.height * 0.4, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === 'log') {
          const speedRatio = Math.abs(obs.speed) / 0.8;
          const darken = Math.min(80, speedRatio * 40);
          
          ctx.fillStyle = `rgb(${93 - darken}, ${58 - darken}, ${26 - darken})`;
          roundRect(ctx, obs.x, oy, obs.width, obs.height, 6);
          ctx.fill();
          ctx.fillStyle = `rgb(${125 - darken}, ${90 - darken}, ${58 - darken})`;
          ctx.fillRect(obs.x + 4, oy + 4, obs.width - 8, obs.height - 8);
        }
      }
    }
  }

  function drawPlayer() {
    if (!player || !player.alive) return;

    const cx = player.x + player.size / 2;
    const cy = player.y + player.size / 2;
    const r = player.size / 2;

    const grad = ctx.createRadialGradient(cx, cy - r * 0.3, 0, cx, cy, r);
    grad.addColorStop(0, '#ffb347');
    grad.addColorStop(0.7, '#ff8c00');
    grad.addColorStop(1, '#d97000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(180,80,0,0.4)';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * r * 0.3, cy - r);
      ctx.quadraticCurveTo(cx + i * r * 0.15, cy, cx + i * r * 0.3, cy + r);
      ctx.stroke();
    }

    ctx.fillStyle = '#4a3a1a';
    ctx.fillRect(cx - 4, cy - r - 8, 8, 10);

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.3, cy - r * 0.2);
    ctx.lineTo(cx - r * 0.15, cy - r * 0.4);
    ctx.lineTo(cx - r * 0.05, cy - r * 0.2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.3, cy - r * 0.2);
    ctx.lineTo(cx + r * 0.15, cy - r * 0.4);
    ctx.lineTo(cx + r * 0.05, cy - r * 0.2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - r * 0.4, cy + r * 0.2);
    ctx.quadraticCurveTo(cx, cy + r * 0.5, cx + r * 0.4, cy + r * 0.2);
    ctx.lineTo(cx + r * 0.2, cy + r * 0.1);
    ctx.quadraticCurveTo(cx, cy + r * 0.3, cx - r * 0.2, cy + r * 0.1);
    ctx.closePath();
    ctx.fill();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // Game loop
  let lastTime = performance.now();

  function update(timestamp) {
    const dt = Math.min(50, timestamp - lastTime);
    lastTime = timestamp;

    if (running && player && player.alive) {
      updateObstacles(dt);
      ensureRowsExist();
      checkCollisions();
      updateCamera();
    }

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawBackground();
    drawRows();
    drawPlayer();

    gameLoop = requestAnimationFrame(update);
  }

  // Modal helpers
  function hideModal(modal) {
    modal.classList.add('hidden');
  }

  // Timer update
  function updateTimers(){
    if(!gameTimerHeader) return;
    const left = GAME_END_TS - Date.now();
    gameTimerHeader.textContent = left <= 0 ? 'Game Ended' : (() => {
      const s = Math.floor(left/1000);
      const hh = String(Math.floor(s/3600)).padStart(2,'0');
      const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
      const ss = String(s%60).padStart(2,'0');
      return `${hh}:${mm}:${ss}`;
    })();
  }

  // Toast notification
  function showToast(msg, timeout=1800){
    if(!playbound) return;
    let t = playbound.querySelector('.save-toast');
    if(!t){ t = document.createElement('div'); t.className='save-toast'; playbound.appendChild(t); }
    t.textContent = msg;
    clearTimeout(t._timeout);
    t._timeout = setTimeout(()=> { t && t.remove(); }, timeout);
  }

  // Background elements
  function initBackgroundElements(){
    if(!backgroundRoot) return;
    if(backgroundRoot.dataset.initted) return;
    backgroundRoot.dataset.initted = '1';
    for(let i=0;i<20;i++){
      const leaf = document.createElement('div'); leaf.className='leaf';
      leaf.style.left = `${Math.random()*100}%`;
      leaf.style.top = `${-10 - Math.random()*60}%`;
      leaf.style.animationDelay = `${Math.random()*10}s`;
      backgroundRoot.appendChild(leaf);
    }
    for(let i=0;i<8;i++){
      const pk = document.createElement('div'); pk.className='bg-pumpkin';
      pk.style.left = `${Math.random()*100}%`;
      pk.style.top = `${-20 - Math.random()*60}%`;
      pk.style.animationDelay = `${Math.random()*12}s`;
      backgroundRoot.appendChild(pk);
    }
  }

  // Firebase save score
  async function submitScoreToFirestoreDocs(entry){
    try{
      if(!window.firebaseDb || !window.firebaseDoc || !window.firebaseSetDoc) return { ok:false, reason:'no-firebase' };
      const id = entry.uid ? entry.uid : `${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      const docRef = window.firebaseDoc(window.firebaseDb, 'day3_scores', id);
      if(entry.uid && window.firebaseGetDoc){
        const existing = await window.firebaseGetDoc(docRef);
        if(existing && existing.exists && existing.exists()){
          const data = existing.data();
          if((data.score||0) < entry.score){
            await window.firebaseSetDoc(docRef, entry);
          }
        } else {
          await window.firebaseSetDoc(docRef, entry);
        }
      } else {
        await window.firebaseSetDoc(docRef, entry);
      }
      if(entry.uid && window.firebaseGetDoc && window.firebaseSetDoc){
        const userDocRef = window.firebaseDoc(window.firebaseDb, 'users', entry.uid);
        const snap = await window.firebaseGetDoc(userDocRef);
        let docData = {};
        if(snap && snap.exists && snap.exists()) docData = snap.data();
        else docData = { username: entry.playerName, email:'', createdAt:new Date(), scores:{ day1:0,day2:0,day3:0,day4:0,day5:0, total:0 } };
        docData.scores = docData.scores || {};
        docData.scores.day3 = Math.max(docData.scores.day3 || 0, entry.score);
        const s = docData.scores;
        docData.scores.total = (s.day1||0)+(s.day2||0)+(s.day3||0)+(s.day4||0)+(s.day5||0);
        await window.firebaseSetDoc(userDocRef, docData);
      }
      return { ok:true };
    } catch(err){
      console.error('save error', err);
      return { ok:false, reason: err && err.message || 'unknown' };
    }
  }

  async function handleSubmitScore(){
    const fbUser = (window.firebaseAuth && window.firebaseAuth.currentUser) ? window.firebaseAuth.currentUser : null;
    let uid = fbUser ? fbUser.uid : null;
    let playerName = (window.userData && window.userData.username) ? window.userData.username : (fbUser && fbUser.email ? fbUser.email.split('@')[0] : 'Anonymous');
    const entry = { score, playerName, uid, ts: Date.now(), withinEvent: Date.now() <= GAME_END_TS };

    if(!uid){
      if(window.firebaseSignInWithPopup && window.firebaseAuth && window.googleProvider){
        try{
          const res = await window.firebaseSignInWithPopup(window.firebaseAuth, window.googleProvider);
          const user = res.user;
          uid = user.uid;
          playerName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
          entry.uid = uid; entry.playerName = playerName;
        } catch(e){
          showToast('Sign-in failed'); return;
        }
      } else { showToast('Sign-in unavailable'); return; }
    }

    const r = await submitScoreToFirestoreDocs(entry);
    if(!r.ok){ showToast('Save failed'); return; }
    showToast('Score saved');
    setTimeout(()=> startGame(), 600);
  }

  // Leaderboard
  dayLeaderboardBtn && dayLeaderboardBtn.addEventListener('click', async () => {
    if(dayLeaderboardModal.parentElement !== document.body) document.body.appendChild(dayLeaderboardModal);
    dayLeaderboardBody.innerHTML = '<tr><td colspan="5">Loading…</td></tr>';
    dayLeaderboardModal.classList.remove('hidden');
    let remote = [];
    if(window.firebaseDb && window.firebaseGetDocs && window.firebaseCollection && window.firebaseQuery && window.firebaseOrderBy){
      try {
        const q = window.firebaseQuery(window.firebaseCollection(window.firebaseDb,'day3_scores'), window.firebaseOrderBy('score','desc'));
        const snap = await window.firebaseGetDocs(q);
        snap.forEach(d => remote.push(d.data()));
      } catch(e){ console.warn(e); }
    }
    const rows = (remote || []).slice(0,50).map((r,idx) => {
      const when = new Date(r.ts).toLocaleString();
      const within = r.withinEvent ? 'Yes' : 'No';
      const name = r.playerName || (r.uid ? r.uid : 'Anonymous');
      return `<tr class="${idx===0?'rank-1':idx===1?'rank-2':idx===2?'rank-3':''}"><td>${idx+1}</td><td>${escapeHtml(name)}</td><td>${r.score}</td><td>${when}</td><td>${within}</td></tr>`;
    });
    dayLeaderboardBody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="5">No scores yet</td></tr>';
  });

  dayLeaderboardClose && dayLeaderboardClose.addEventListener('click', ()=> { dayLeaderboardModal.classList.add('hidden'); });

  function escapeHtml(str=''){ return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }

  // Fullscreen
  async function toggleFullscreen(){
    try{
      if(!document.fullscreenElement){
        await playbound.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    }catch(e){}
  }

  // Event listeners
  playBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);
  submitScoreBtn && submitScoreBtn.addEventListener('click', async ()=> { await handleSubmitScore(); });
  fullscreenBtn.addEventListener('click', toggleFullscreen);

  // Initialize
  initBackgroundElements();
  setInterval(updateTimers, 1000);
  updateTimers();
  gameLoop = requestAnimationFrame(update);
})();
