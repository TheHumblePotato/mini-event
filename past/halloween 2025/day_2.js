/* day_3.js — updated per request:
   - stains precomputed (no per-frame randomness) and removed when they fall past bottom
   - large stains slide down slowly, leave small trailing drips, no shaking
   - stains use multiple non-elliptical shapes (splat/blob/polygon/drip/ellipse)
   - high-DPI + aspect-fit scaling so canvas and game world scale up to available playbound space
   - fullscreen resizes canvas to occupy almost the full screen
   - candies leave stains in their own color
   - background init preserved (copied from day_1)

   Modified resizeCanvasToDisplay() to ensure the entire .halloween-frame (playbound + game-note)
   fits into the viewport below the top-controls by:
   - reading the CSS --vh-offset and reserving that much vertical space
   - computing the canvas display size in CSS pixels (logical -> CSS px)
   - computing playbound outer size using its computed border+padding so the outer box does not overflow
   - clamping the frame maxWidth/maxHeight to the visible viewport
*/
(() => {
const PT_TZ = 'America/Los_Angeles';
const nowPT = () => new Date(new Date().toLocaleString('en-US', { timeZone: PT_TZ }));

// blocked weekday ranges in minutes (08:15–11:00, 12:50–15:20 PT)
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

// set per-day unlock ISO (change as needed). Example for day_1:
const UNLOCK_ISO = '2025-10-28T00:00:00-07:00'; // adjust per-day
const unlockDate = new Date(UNLOCK_ISO);

const rn = nowPT();
if(rn < unlockDate){
  showTimeLockOverlay(`This game will unlock on ${unlockDate.toLocaleString('en-US', { timeZone: PT_TZ })} PT.`);
  return; // stop executing the rest of the day's script (paste inside the day's IIFE)
}

if(inBlockedWindow(rn)){
  showTimeLockOverlay('This game is temporarily blocked for scheduled hours. Please try again later.');
  // continue polling until outside blocked hours, remove overlay when allowed
}

const __timeLockChecker = setInterval(() => {
  const n = nowPT();
  if(n < unlockDate){
    if(!document.getElementById('time-lock-overlay')){
      showTimeLockOverlay(`This game will unlock on ${unlockDate.toLocaleString('en-US', { timeZone: PT_TZ })} PT.`);
    }
    return;
  }
  // unlocked; hide overlay if not in blocked window
  if(!inBlockedWindow(n)){
    hideTimeLockOverlay();
    // once unlocked and outside blocked window, we can stop checking
    clearInterval(__timeLockChecker);
  } else {
    // still in blocked window: ensure overlay visible
    if(!document.getElementById('time-lock-overlay')){
      showTimeLockOverlay('This game is temporarily blocked for scheduled hours. Please try again later.');
    }
  }
}, 30_000);

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const playbound = document.getElementById('playbound');
  const bigScoreEl = document.getElementById('big-score');
  const gameTimerHeader = document.getElementById('game-timer');
  const playOverlay = document.getElementById('play-overlay');
  const playBtn = document.getElementById('play-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const dayLeaderboardBtn = document.getElementById('day-leaderboard-btn');
  const dayLeaderboardModal = document.getElementById('day-leaderboard-modal');
  const dayLeaderboardBody = document.getElementById('day-leaderboard-body');
  const dayLeaderboardClose = document.getElementById('day-leaderboard-close');
  const gameOverModal = document.getElementById('game-over-modal');
  const gameOverContent = gameOverModal ? gameOverModal.querySelector('.modal-content') : null;
  const finalScoreEl = document.getElementById('final-score');
  const submitScoreBtn = document.getElementById('submit-score-btn');
  const retryBtn = document.getElementById('retry-btn');
  const submitNote = document.getElementById('submit-note');
  const flashEl = document.getElementById('flash');
  const backgroundRoot = document.getElementById('background');

  const now = new Date();
  const year = now.getFullYear();
  const GAME_END_TS = Date.parse(`${year}-10-29T00:00:00-07:00`);

  // base logical resolution (game world coordinates)
  const LOGICAL_W = 640;
  const LOGICAL_H = 480;

  // runtime state
  let scale = 1;           // CSS scale (logical -> CSS px)
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let W = LOGICAL_W, H = LOGICAL_H;

  const GRAVITY = 0.35;
  const SPAWN_INTERVAL = 800;
  const POWERUP_CHANCE = 0.02;
  const TRAIL_LIFETIME = 160;
  const TRAIL_MIN_DIST = 4;
  const START_LIVES = 3;

  let running = false;
  let lastTime = performance.now();
  let objects = [];
  let powerups = [];
  let trail = [];
  let stains = [];
  let lives = START_LIVES;
  let score = 0;
  let lastSpawn = 0;
  let candyStormUntil = 0;
  let bombInvincibleUntil = 0;
  let flashUntil = 0;
  let animationId = null;
  // UI: shield indicator shown when bomb invincibility is active
  let shieldEl = null;

  let wave = { type: 'normal', startedAt: 0, duration: 8000, spawnRate: SPAWN_INTERVAL, allowBombs: true, fromSidesProb: 0.25, burstCount: 0 };

  function startNewWave(){
    const t = Math.random(), nowTs = Date.now();
    if (t < 0.12) {
      // special bomb-only wave: lots of bombs, from sides occasionally
      wave = { type:'bombs', startedAt:nowTs, duration:6000 + Math.random()*4000, spawnRate:320, allowBombs:true, fromSidesProb:0.45, burstCount:0 };
    } else if (t < 0.30) wave = { type:'fast', startedAt:nowTs, duration:8000+Math.random()*4000, spawnRate:220, allowBombs:true, fromSidesProb:0.35, burstCount:0 };
    else if (t < 0.48) wave = { type:'shower', startedAt:nowTs, duration:7000+Math.random()*5000, spawnRate:90, allowBombs:false, fromSidesProb:0.18, burstCount:0 };
    else if (t < 0.72) wave = { type:'burst', startedAt:nowTs, duration:4200, spawnRate:700, allowBombs:false, fromSidesProb:0.6, burstCount:8 + Math.floor(Math.random()*6) };
    else wave = { type:'normal', startedAt:nowTs, duration:10000+Math.random()*8000, spawnRate:720+Math.random()*320, allowBombs:true, fromSidesProb:0.22, burstCount:0 };
    lastSpawn = 0;
  }

  const CANDY_TYPES = [
    { id:'candy_orb', color:'#ffd84d', r:16, shape:'circle' },
    { id:'candy_twist', color:'#ff6bcb', r:14, shape:'twist' },
    { id:'candy_square', color:'#6bd1ff', r:18, shape:'square' },
    { id:'candy_star', color:'#fff38a', r:20, shape:'star' },
    { id:'candy_bite', color:'#ff8c42', r:22, shape:'bite' },
    { id:'candy_long', color:'#b18cff', r:12, shape:'stick' },
    { id:'candy_gummy', color:'#66dd77', r:20, shape:'gummy' },
    { id:'candy_choco', color:'#7b4a2a', r:18, shape:'choco' },
    { id:'candy_ring', color:'#ffdfb0', r:20, shape:'ring' },
    { id:'candy_spike', color:'#ff4d6d', r:15, shape:'spike' },
    { id:'candy_hex', color:'#9be3ff', r:16, shape:'hex' }
  ];

  // Resize so the canvas logical world remains LOGICAL_W x LOGICAL_H but is scaled to fit playbound area (preserving aspect)
  function resizeCanvasToDisplay() {
    if (!canvas || !playbound) return;

    // compute available viewport area that the playbound/game should fit into.
    // prefer explicit top-controls measurements so we always leave room for the header bar.
    let topBarBottom = 0;
    try {
      const left = document.getElementById('left-controls');
      const right = document.getElementById('right-controls');
      topBarBottom = Math.max(
        left ? left.getBoundingClientRect().bottom : 0,
        right ? right.getBoundingClientRect().bottom : 0,
        12
      );
    } catch (e) {
      topBarBottom = 64;
    }

    // read CSS var for reserved vertical space (fallback to 112)
    let vhOffset = 112;
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--vh-offset');
      if (v) vhOffset = parseInt(v.trim().replace('px','')) || vhOffset;
    } catch(e){}

    // compute available width/height inside the window while keeping a small page margin
    const availW = Math.max(120, window.innerWidth - 36);
    // We use window.innerHeight minus the reserved vhOffset (which includes top controls + desired bottom gap).
    // That ensures the whole frame (playbound + game-note + padding) fits.
    const maxFrameH = Math.max(120, window.innerHeight - vhOffset);

    // choose the largest scale that fits LOGICAL into availW x maxFrameH
    const scaleCss = Math.min(availW / LOGICAL_W, maxFrameH / LOGICAL_H);

    // compute final display size in CSS pixels for the canvas (rounded to avoid blurriness)
    const canvasCssW = Math.max(64, Math.round(LOGICAL_W * scaleCss));
    const canvasCssH = Math.max(64, Math.round(LOGICAL_H * scaleCss));

    // compute playbound outer size by adding its computed border/padding so outer box will fit properly
    let pbStyle = window.getComputedStyle(playbound);
    const borderHoriz = (parseFloat(pbStyle.borderLeftWidth) || 0) + (parseFloat(pbStyle.borderRightWidth) || 0);
    const borderVert = (parseFloat(pbStyle.borderTopWidth) || 0) + (parseFloat(pbStyle.borderBottomWidth) || 0);
    const padHoriz = (parseFloat(pbStyle.paddingLeft) || 0) + (parseFloat(pbStyle.paddingRight) || 0);
    const padVert = (parseFloat(pbStyle.paddingTop) || 0) + (parseFloat(pbStyle.paddingBottom) || 0);

    const playboundOuterW = canvasCssW + borderHoriz + padHoriz;
    const playboundOuterH = canvasCssH + borderVert + padVert;

    // apply the CSS size to the canvas (CSS pixels)
    canvas.style.width = `${canvasCssW}px`;
    canvas.style.height = `${canvasCssH}px`;

    // set playbound outer size so it encloses the canvas exactly
    playbound.style.width = `${playboundOuterW}px`;
    playbound.style.height = `${playboundOuterH}px`;

    // ensure parent frame reserves space so the canvas never clips under top controls
    try {
      const frame = playbound.closest('.halloween-frame');
      const gameWrap = document.getElementById('game-wrap');
      if (frame) {
        // constrain frame max sizes to viewport minus a small margin
        const maxWidthClamp = Math.max(120, window.innerWidth - 48);
        const maxHeightClamp = Math.max(120, window.innerHeight - 24);
        frame.style.maxWidth = `${Math.min(maxWidthClamp, playboundOuterW + 40)}px`;
        frame.style.maxHeight = `${Math.min(maxHeightClamp, playboundOuterH + 100)}px`;
        frame.style.boxSizing = 'border-box';
      }
      // set padding-top dynamically so top-controls won't overlap the frame
      if (gameWrap) {
        const topBarBottom = Math.max(12, Math.round((document.getElementById('left-controls')||{getBoundingClientRect:()=>({bottom:12})}).getBoundingClientRect().bottom || 12));
        gameWrap.style.paddingTop = `${topBarBottom + 12}px`;
      }
    } catch(e){}

    // device pixel ratio for crisp canvas backing store
    dpr = Math.max(1, window.devicePixelRatio || 1);
    // backing store size in device pixels (match the canvas CSS size)
    canvas.width = Math.max(1, Math.round(canvasCssW * dpr));
    canvas.height = Math.max(1, Math.round(canvasCssH * dpr));

    // set transform so drawing commands operate in logical (LOGICAL_W x LOGICAL_H) coordinates
    const deviceScale = canvas.width / LOGICAL_W; // should equal canvas.height / LOGICAL_H
    ctx.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);

    // keep logical world values unchanged
    scale = scaleCss;
    W = LOGICAL_W; H = LOGICAL_H;
  }

  // When fullscreen, try to nearly fill viewport (small padding)
  async function toggleFullscreen(){
    try{
      if(!document.fullscreenElement){
        await playbound.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      // resize after fullscreen state changes (some browsers need a tick)
      setTimeout(resizeCanvasToDisplay, 80);
    }catch(e){}
  }

  // Background init (copied from day_1)
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

  // Precompute stable shape data for stains so they don't "shake"
  function makeShapeData(shape, r) {
    if(shape === 'ellipse') {
      return { rx: r, ry: Math.round(r * (0.55 + Math.random()*0.25)) };
    }
    if(shape === 'drip') {
      return { rx: Math.round(r * 0.6), ry: Math.round(r * 1.2) };
    }
    if(shape === 'splat') {
      const pieces = 4 + Math.floor(Math.random()*4);
      const parts = [];
      for(let i=0;i<pieces;i++){
        const angle = (i / pieces) * Math.PI * 2;
        parts.push({ ox: Math.cos(angle) * (r * (0.25 + Math.random()*0.6)), oy: Math.sin(angle) * (r * (0.15 + Math.random()*0.45)), rr: Math.max(2, r * (0.2 + Math.random()*0.8)) });
      }
      return { pieces: parts };
    }
    if(shape === 'blob') {
      // store a simple bezier control offsets for a blobby oval
      const ctrl = [];
      const count = 4 + Math.floor(Math.random()*3);
      for(let i=0;i<count;i++){
        const a = (i / count) * Math.PI * 2;
        ctrl.push({ ox: Math.cos(a) * (r * (0.2 + Math.random()*0.7)), oy: Math.sin(a) * (r * (0.15 + Math.random()*0.6)) });
      }
      return { points: ctrl };
    }
    if(shape === 'polygon') {
      const sides = 5 + Math.floor(Math.random()*3);
      const pts = [];
      for(let i=0;i<sides;i++){
        const a = (i / sides) * Math.PI*2;
        pts.push({ x: Math.cos(a) * r * (0.6 + Math.random()*0.6), y: Math.sin(a) * r * (0.6 + Math.random()*0.6) });
      }
      return { pts };
    }
    // fallback circular data
    return { rx: r, ry: Math.round(r*0.6) };
  }

  function addStain(x,y,r,color='#4a1a00', shape='ellipse'){
    // clamp inside logical area
    x = Math.max(4, Math.min(LOGICAL_W - 4, x));
    y = Math.max(4, Math.min(LOGICAL_H - 4, y));
    const s = {
      x, y,
      r: Math.max(6, r),
      color,
      shape,
      ts: Date.now(),
      vy: 0,
      drips: [],
      // sliding if large
      sliding: (r > 28),
      // persistent shape data so the render is stable
      shapeData: makeShapeData(shape, Math.max(6, r)),
      // a small internal timer for drip spawn control
      _dripTimer: 0
    };
    // if sliding ensure a gentle downward velocity
    if (s.sliding) s.vy = 0.06 + Math.random()*0.12;
    stains.push(s);
    if(stains.length > 300) stains.shift();
  }

  function flashbangAndClearStains(){
    flashUntil = Date.now() + 300;
    stains = [];
  }

  // small helper to spawn a drip object
  function spawnDripFrom(s){
    const dx = (Math.random()-0.5) * s.r * 0.6;
    const dy = s.y + s.r*0.6;
    return { x: s.x + dx, y: dy, r: Math.max(2, s.r*0.06 + Math.random()*2), vy: 0.6 + Math.random()*0.8, color: s.color };
  }

  // collision helper unchanged
  function segmentCircleHit(x1,y1,x2,y2, cx,cy, r){
    const dx = x2-x1, dy = y2-y1;
    const l2 = dx*dx + dy*dy;
    if(l2 === 0) return Math.hypot(cx-x1, cy-y1) <= r;
    let t = ((cx - x1)*dx + (cy - y1)*dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + t*dx, py = y1 + t*dy;
    return Math.hypot(cx - px, cy - py) <= r;
  }

  function spawnThrown(x = null, opts = {}) {
    if (!running) return;
    const allowBombs = (typeof opts.allowBomb === 'boolean') ? opts.allowBomb : wave.allowBombs;
    let type = null;
    // bias more towards candies normally, but allow bomb-heavy waves to favor bombs
    const preferBombs = (wave && wave.type === 'bombs');
    if (preferBombs) {
      // during bomb wave, almost always spawn bombs
      type = 'bomb';
    } else if (Math.random() < 0.24) {
      const c = CANDY_TYPES[Math.floor(Math.random()*CANDY_TYPES.length)];
      type = c.id;
    } else {
      const types = ['pumpkin','pumpkin_small','ghost'];
      type = types[Math.floor(Math.random() * types.length)];
      // increase baseline bomb chance so more bombs appear
      if (allowBombs && Math.random() < 0.25) type = 'bomb';
    }

    const fromSide = Math.random() < wave.fromSidesProb;
    let sx, sy, vx, vy;
    if (fromSide) {
      const left = Math.random() < 0.5;
      sx = left ? -20 : LOGICAL_W + 20;
      sy = 120 + Math.random()*(LOGICAL_H - 240);
      vx = (left ? 3 + Math.random()*4 : -3 - Math.random()*4) * (1 + (wave.type === 'fast' ? 0.4 : 0));
      vy = -3 - Math.random()*6;
    } else {
      sx = x !== null ? x : (80 + Math.random()*(LOGICAL_W-160));
      sy = LOGICAL_H + 26;
      vx = (Math.random() - 0.5) * (5 + (wave.type === 'fast' ? 2 : 0));
      vy = -9 - Math.random()*9;
    }

    const obj = { x: sx, y: sy, vx, vy, type, r: 22, alive: true, sliced: false, created: Date.now() };

    if (type && type.startsWith('candy_')) {
      const meta = CANDY_TYPES.find(c => c.id === type) || CANDY_TYPES[0];
      obj.r = meta.r;
      obj.color = meta.color;
      obj.candyShape = meta.shape;
    } else if (type === 'pumpkin') obj.r = 28;
    else if (type === 'pumpkin_small') obj.r = 18;
    else if (type === 'ghost') obj.r = 22;
    else if (type === 'bomb') obj.r = 16;

    objects.push(obj);
  }

  function spawnPowerup(){
    if (!running) return;
    const types = ['life','candyStorm','bombInv'];
    const type = types[Math.floor(Math.random()*types.length)];
    const fromLeft = Math.random() < 0.5;
    const y = 60 + Math.random()*(LOGICAL_H - 120);
    const speed = 4.0 + Math.random()*3.2;
    const p = { x: fromLeft ? -40 : LOGICAL_W + 40, y, vx: fromLeft ? speed : -speed, type, w: 20, h: 14, created: Date.now() };
    powerups.push(p);
  }

  function spawnCandyStorm(){ candyStormUntil = Math.max(candyStormUntil, Date.now() + 10000); }
  function startBombInvincibility(){ bombInvincibleUntil = Math.max(bombInvincibleUntil, Date.now() + 15000); showToast('Bomb invincible!'); }

  function sliceObject(obj){
    if(!obj.alive) return;
    obj.alive = false;
    obj.sliced = true;

    if (obj.type === 'bomb') {
      if (Date.now() < bombInvincibleUntil) {
        score += 8;
      } else {
        loseLife();
        flashbangAndClearStains();
      }
      return;
    }

    if (obj.type && obj.type.startsWith('candy_')) {
      const points = Math.round(obj.r * (1.0 + Math.random()*1.6));
      score += points;
      // choose shape per candy (use candyShape bias)
      const shaped = obj.candyShape || ['ellipse','splat','blob','drip'][Math.floor(Math.random()*4)];
      addStain(obj.x + (Math.random()-0.5)*6, obj.y + (Math.random()-0.5)*6, obj.r * (0.8 + Math.random()*0.8), obj.color || '#ffd84d', shaped);
      return;
    }

    if (obj.type === 'ghost') score += 10;
    else score += (obj.type === 'pumpkin_small' ? 6 : 12);

    addStain(obj.x, obj.y, obj.r * (0.8 + Math.random()*0.8), '#4a1a00', Math.random() < 0.5 ? 'ellipse' : 'splat');
  }

  function activatePowerup(p){
    if(p.type === 'life'){ lives = Math.min(5, lives + 1); renderHearts(); }
    else if(p.type === 'candyStorm'){ spawnCandyStorm(); showToast('Candy Storm!'); }
    else if(p.type === 'bombInv'){ startBombInvincibility(); }
  }

  function loseLife(){
    lives = Math.max(0, lives - 1);
    renderHearts();
    if(lives <= 0) endGame();
  }

  function endGame(){
    running = false;
    if(finalScoreEl) finalScoreEl.textContent = score;
    if(submitNote) submitNote.textContent = (Date.now() <= GAME_END_TS) ? 'This score is within the event window and can be submitted to the main leaderboard.' : 'Event window ended — score will not be counted'
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

  function showToast(msg, timeout=1800){
    if(!playbound) return;
    let t = playbound.querySelector('.save-toast');
    if(!t){ t = document.createElement('div'); t.className='save-toast'; playbound.appendChild(t); }
    t.textContent = msg;
    clearTimeout(t._timeout);
    t._timeout = setTimeout(()=> { t && t.remove(); }, timeout);
  }

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

  // Update & draw stains (stable shapes, sliding big stains, remove when off-bottom)
  function updateAndDrawStains(dtMs){
    // update phase: motion & drip generation
    for (let i = stains.length - 1; i >= 0; i--) {
      const s = stains[i];

      if (s.sliding) {
        // constant slow slide (no shaking)
        s.y += (s.vy || 0.08) * (dtMs / 16.666);
        // spawn small trail drips regularly
        s._dripTimer += dtMs;
        if (s._dripTimer > 220) {
          s._dripTimer = 0;
          s.drips.push(spawnDripFrom(s));
        }
      } else {
        // normal stain affected by gentle gravity (can drip as well)
        s.vy = (s.vy || 0) + 0.03 * (dtMs/16.666);
        s.y += s.vy * (dtMs / 16.666);
        if (Math.random() < 0.02) s.drips.push(spawnDripFrom(s));
      }

      // update drips for this stain
      for (let j = s.drips.length - 1; j >= 0; j--) {
        const d = s.drips[j];
        d.vy += 0.06 * (dtMs/16.666);
        d.y += d.vy * (dtMs / 16.666);
        if (d.y > LOGICAL_H + 16) s.drips.splice(j,1);
      }

      // Remove stains as soon as their visible bottom reaches the play area's bottom
      // using a slightly conservative bottom margin prevents visible piling.
      const visibleBottom = s.y + (s.r * 0.7);
      if (visibleBottom >= LOGICAL_H - 6) {
        stains.splice(i,1);
        continue;
      }
    }

    // draw phase: shapes are deterministic using shapeData
    stains.forEach(s => {
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.fillStyle = s.color || '#4a1a00';

      if (s.shape === 'ellipse') {
        const sd = s.shapeData;
        ctx.beginPath(); ctx.ellipse(s.x, s.y, sd.rx, sd.ry, 0, 0, Math.PI*2); ctx.fill();
      } else if (s.shape === 'drip') {
        const sd = s.shapeData;
        ctx.beginPath(); ctx.ellipse(s.x, s.y, sd.rx, sd.ry, 0, 0, Math.PI*2); ctx.fill();
      } else if (s.shape === 'splat') {
        const pieces = s.shapeData.pieces;
        for (let p of pieces) {
          ctx.beginPath();
          ctx.arc(s.x + p.ox, s.y + p.oy, p.rr, 0, Math.PI*2);
          ctx.fill();
        }
      } else if (s.shape === 'blob') {
        const pts = s.shapeData.points;
        if (pts && pts.length) {
          ctx.beginPath();
          ctx.moveTo(s.x + pts[0].ox, s.y + pts[0].oy);
          for (let k = 1; k < pts.length; k++) {
            const a = pts[k-1], b = pts[k];
            ctx.quadraticCurveTo(s.x + a.ox*0.6, s.y + a.oy*0.6, s.x + b.ox, s.y + b.oy);
          }
          ctx.quadraticCurveTo(s.x + pts[pts.length-1].ox*0.6, s.y + pts[pts.length-1].oy*0.6, s.x + pts[0].ox, s.y + pts[0].oy);
          ctx.fill();
        }
      } else if (s.shape === 'polygon') {
        const pts = s.shapeData.pts;
        ctx.beginPath();
        ctx.moveTo(s.x + pts[0].x, s.y + pts[0].y);
        for (let k=1;k<pts.length;k++) ctx.lineTo(s.x + pts[k].x, s.y + pts[k].y);
        ctx.closePath(); ctx.fill();
      } else {
        // fallback ellipse
        const sd = s.shapeData;
        ctx.beginPath(); ctx.ellipse(s.x, s.y, sd.rx || s.r, sd.ry || s.r*0.6, 0, 0, Math.PI*2); ctx.fill();
      }

      // draw small drips
      if (s.drips && s.drips.length) {
        ctx.globalAlpha = 0.95;
        for (let d of s.drips) {
          ctx.beginPath();
          ctx.ellipse(d.x, d.y, d.r, d.r*1.6, 0, 0, Math.PI*2);
          ctx.fill();
        }
      }
      ctx.restore();
    });
  }

  // draw entire frame
  function draw(dtMs=16.666){
    // clear logical surface
    ctx.clearRect(0,0, LOGICAL_W, LOGICAL_H);

    const g = ctx.createLinearGradient(0,0,0,LOGICAL_H);
    g.addColorStop(0,'#0b0506'); g.addColorStop(1,'#090305');
    ctx.fillStyle = g; ctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);

    // stains under everything
    updateAndDrawStains(dtMs);

    // objects (fruits/etc)
    objects.forEach(o => {
      if(!o.alive) return;
      ctx.fillStyle = 'rgba(0,0,0,0.30)';
      ctx.beginPath(); ctx.ellipse(o.x+4, o.y+6, o.r*0.95, o.r*0.55, 0,0,Math.PI*2); ctx.fill();

      if(o.type === 'bomb'){
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#f44'; ctx.fillRect(o.x-2, o.y - o.r - 8, 4, 6);
      } else if (o.type && o.type.startsWith('candy_')) {
        const c = o.color || '#ffd84d';
        ctx.save(); ctx.translate(o.x, o.y);
        switch (o.candyShape) {
          case 'circle': ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0,0,o.r,0,Math.PI*2); ctx.fill(); break;
          case 'twist': ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0,0,o.r*1.1,o.r*0.65, Math.PI/6,0,Math.PI*2); ctx.fill(); break;
          case 'square': ctx.fillStyle = c; ctx.fillRect(-o.r,-o.r,o.r*2,o.r*2); break;
          case 'star': { ctx.fillStyle = c; ctx.beginPath(); for(let i=0;i<5;i++){ ctx.lineTo(Math.cos((18+72*i)/180*Math.PI)*o.r, -Math.sin((18+72*i)/180*Math.PI)*o.r); ctx.lineTo(Math.cos((54+72*i)/180*Math.PI)*o.r*0.45, -Math.sin((54+72*i)/180*Math.PI)*o.r*0.45); } ctx.fill(); break; }
          case 'bite': ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0,0,o.r,Math.PI*0.1,Math.PI*1.9); ctx.fill(); break;
          case 'stick': ctx.fillStyle = c; ctx.fillRect(-o.r*0.5, -o.r*2, o.r, o.r*4); break;
          case 'gummy': ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0,0,o.r*0.9,o.r*0.7,0,0,Math.PI*2); ctx.fill(); break;
          case 'choco': ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0,0,o.r,0,Math.PI*2); ctx.fill(); break;
          case 'ring': ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0,0,o.r,0,Math.PI*2); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(0,0,o.r*0.45,0,Math.PI*2); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; break;
          case 'spike': { ctx.fillStyle = c; ctx.beginPath(); for(let i=0;i<6;i++){ const a=(i/6)*Math.PI*2; ctx.lineTo(Math.cos(a)*o.r, Math.sin(a)*o.r); ctx.lineTo(Math.cos(a+Math.PI/6)*(o.r*0.4), Math.sin(a+Math.PI/6)*(o.r*0.4)); } ctx.fill(); break; }
          case 'hex': { ctx.fillStyle = c; ctx.beginPath(); for(let i=0;i<6;i++){ const a=(i/6)*Math.PI*2; const px=Math.cos(a)*o.r, py=Math.sin(a)*o.r; if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.closePath(); ctx.fill(); break; }
          default: ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0,0,o.r,0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
      } else {
        if(o.type === 'ghost'){
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill();
          ctx.fillStyle = '#000'; ctx.fillRect(o.x-6, o.y-4, 4, 4); ctx.fillRect(o.x+2, o.y-4, 4, 4);
        } else {
          ctx.fillStyle = '#ff8c00'; ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill();
        }
      }
    });

    // powerups
    powerups.forEach(p => {
      ctx.save(); ctx.globalAlpha = 0.95;
      ctx.fillStyle = (p.type === 'life') ? '#6bbf6b' : (p.type === 'candyStorm' ? '#ffd84d' : '#7fbfff');
      ctx.fillRect(p.x - p.w/2, p.y - p.h/2, p.w, p.h);
      ctx.restore();
    });

    // trail
    ctx.lineCap = 'round';
    for(let i = 0; i < trail.length - 1; i++){
      const a = trail[i], b = trail[i+1];
      const alpha = Math.max(0, 1 - (Date.now() - a.t) / TRAIL_LIFETIME);
      ctx.strokeStyle = `rgba(255,255,255,${0.28 * alpha})`;
      ctx.lineWidth = 8 * alpha;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.strokeStyle = `rgba(255,230,160,${0.9 * alpha})`;
      ctx.lineWidth = 3 * alpha;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }

    if(Date.now() < flashUntil){
      const alpha = (flashUntil - Date.now()) / 300;
      ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
      ctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);
    }
  }

  // update physics & logic
  function update(dtMs){
    const nowTs = Date.now();
    const stormActive = nowTs < candyStormUntil;

    if(stormActive){
      if(Math.random() < 0.45) spawnThrown(80 + Math.random()*(LOGICAL_W-160));
    } else {
      if(nowTs - lastSpawn > SPAWN_INTERVAL + Math.random()*400) {
        spawnThrown();
        lastSpawn = nowTs;
        if(Math.random() < POWERUP_CHANCE) spawnPowerup();
      }
    }

    for(let i = objects.length -1; i >=0; i--){
      const o = objects[i];
      if(!o.alive) continue;
      o.vy += GRAVITY * (dtMs / 16.666);
      o.x += o.vx * (dtMs / 16.666);
      o.y += o.vy * (dtMs / 16.666);
      if(o.y > LOGICAL_H + 100) objects.splice(i,1);
    }

    for(let i = powerups.length -1; i >=0; i--){
      const p = powerups[i];
      p.x += p.vx * (dtMs / 16.666);
      if(p.x < -80 || p.x > LOGICAL_W + 80 || Date.now() - p.created > 22000) powerups.splice(i,1);
    }

    const nowt = Date.now();
    for(let i = trail.length -1; i >=0; i--){
      if(nowt - trail[i].t > TRAIL_LIFETIME) trail.splice(i,1);
    }

    if(trail.length >= 2){
      for(let oi = objects.length -1; oi >= 0; oi--){
        const o = objects[oi];
        if(!o.alive) continue;
        for(let i = 0; i < trail.length -1; i++){
          const a = trail[i], b = trail[i+1];
          if(segmentCircleHit(a.x,a.y,b.x,b.y, o.x,o.y, o.r)){
            sliceObject(o);
            break;
          }
        }
      }

      for(let pi = powerups.length -1; pi >=0; pi--){
        const p = powerups[pi];
        for(let i = 0; i < trail.length -1; i++){
          const a = trail[i], b = trail[i+1];
          if(segmentCircleHit(a.x,a.y,b.x,b.y, p.x, p.y, Math.max(p.w,p.h)/2)){
            activatePowerup(p);
            powerups.splice(pi,1);
            break;
          }
        }
      }
    }

    if(bigScoreEl) bigScoreEl.textContent = `Score: ${score}`;
    // show/hide shield indicator for bomb invincibility
    try{
      if(shieldEl) shieldEl.style.display = (Date.now() < bombInvincibleUntil) ? 'block' : 'none';
    }catch(e){}
  }

  function loop(nowTs){
    const dt = Math.min(40, nowTs - lastTime);
    lastTime = nowTs;

    if (!wave.startedAt || Date.now() - wave.startedAt > wave.duration) startNewWave();

    if (running) {
      if (wave.type === 'burst' && wave.burstCount > 0 && Math.random() < 0.12) {
        for (let i=0;i<wave.burstCount;i++) spawnThrown(null, { allowBomb: wave.allowBombs });
        wave.burstCount = 0;
      } else {
        if (Date.now() - lastSpawn > wave.spawnRate + Math.random()*120) {
          spawnThrown(null, { allowBomb: wave.allowBombs });
          lastSpawn = Date.now();
        }
      }
      update(dt);
    }
    draw(dt);
    animationId = requestAnimationFrame(loop);
  }

  // input handling
  let lastPos = null;
  function pushTrail(x,y){
    const t = Date.now();
    if(lastPos){
      const dx = x - lastPos.x, dy = y - lastPos.y;
      if(Math.hypot(dx,dy) < TRAIL_MIN_DIST) return;
    }
    trail.push({ x: Math.max(0, Math.min(LOGICAL_W, x)), y: Math.max(0, Math.min(LOGICAL_H, y)), t });
    lastPos = { x, y };
    if(trail.length > 64) trail.shift();
  }

  function clientToCanvasPos(clientX, clientY){
    const rect = canvas.getBoundingClientRect();
    // convert client coordinates to logical coordinates (0..LOGICAL_W/H)
    const x = (clientX - rect.left) / rect.width * LOGICAL_W;
    const y = (clientY - rect.top) / rect.height * LOGICAL_H;
    return { x, y };
  }

  canvas.addEventListener('mousemove', e => { const p = clientToCanvasPos(e.clientX, e.clientY); pushTrail(p.x, p.y); });
  canvas.addEventListener('mousedown', e => { const p = clientToCanvasPos(e.clientX, e.clientY); pushTrail(p.x, p.y); });
  canvas.addEventListener('touchmove', e => { const t = e.touches[0]; const p = clientToCanvasPos(t.clientX, t.clientY); pushTrail(p.x, p.y); }, { passive: true });
  canvas.addEventListener('touchstart', e => { const t = e.touches[0]; const p = clientToCanvasPos(t.clientX, t.clientY); pushTrail(p.x, p.y); }, { passive: true });
  window.addEventListener('mouseup', ()=> lastPos = null);
  window.addEventListener('touchend', ()=> lastPos = null);

  setInterval(()=> { if(!running) return; if(Math.random() < 0.12) spawnPowerup(); }, 2200);

  function startGame(){
    initBackgroundElements();
    objects = []; powerups = []; trail = []; stains = [];
    lives = START_LIVES; score = 0;
    lastSpawn = 0; candyStormUntil = 0; bombInvincibleUntil = 0; flashUntil = 0;
    running = true;
    lastTime = performance.now();
    // ensure canvas matches the current layout (handles un/fullscreen transition)
    resizeCanvasToDisplay();
    // ensure shield indicator exists in playbound
    try {
      if (playbound && !shieldEl) {
        shieldEl = document.createElement('div');
        shieldEl.id = 'bomb-shield';
        shieldEl.className = 'shield-icon';
        shieldEl.setAttribute('aria-hidden','true');
        shieldEl.style.display = 'none';
        playbound.appendChild(shieldEl);
      }
    } catch(e){}
    // refresh hearts UI immediately so retry after game over shows correct hearts
    renderHearts();
    if(!animationId) animationId = requestAnimationFrame(loop);
    hideGameOverContent();
    if(playOverlay) playOverlay.classList.add('hidden');
  }

  function restartFromSave(){
    hideGameOverContent();
    // restore lives display and start
    startGame();
  }

  const heartsEl = (() => {
    let el = document.getElementById('hearts');
    if (!el && playbound) {
      el = document.createElement('div');
      el.id = 'hearts';
      el.style.position = 'absolute';
      el.style.top = '8px';
      el.style.left = '50%';
      el.style.transform = 'translateX(-50%)';
      el.style.zIndex = '220';
      el.style.pointerEvents = 'none';
      el.style.display = 'flex';
      el.style.gap = '6px';
      playbound.appendChild(el);
    }
    return el;
  })();

  function renderHearts() {
    if (!heartsEl) return;
    const max = 5;
    const cur = Math.max(0, Math.min(max, lives));
    const out = [];
    for (let i = 0; i < max; i++) out.push(i < cur ? '❤' : '♡');
    heartsEl.textContent = out.join(' ');
  }

  // firebase save / leaderboard handlers (unchanged, adapted from prior)
  async function submitScoreToFirestoreDocs(entry){
    try{
      if(!window.firebaseDb || !window.firebaseDoc || !window.firebaseSetDoc) return { ok:false, reason:'no-firebase' };
      const id = entry.uid ? entry.uid : `${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      const docRef = window.firebaseDoc(window.firebaseDb, 'day2_scores', id);
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
        docData.scores.day2 = Math.max(docData.scores.day2 || 0, entry.score);
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
    setTimeout(()=> restartFromSave(), 600);
  }

  dayLeaderboardBtn && dayLeaderboardBtn.addEventListener('click', async () => {
    // ensure leaderboard uses day_1 CSS rules (modal full-page)
    if(dayLeaderboardModal.parentElement !== document.body) document.body.appendChild(dayLeaderboardModal);
    dayLeaderboardBody.innerHTML = '<tr><td colspan="5">Loading…</td></tr>';
    dayLeaderboardModal.classList.remove('hidden');
    let remote = [];
    if(window.firebaseDb && window.firebaseGetDocs && window.firebaseCollection && window.firebaseQuery && window.firebaseOrderBy){
      try {
        const q = window.firebaseQuery(window.firebaseCollection(window.firebaseDb,'day2_scores'), window.firebaseOrderBy('score','desc'));
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

  playBtn && playBtn.addEventListener('click', ()=> startGame());
  retryBtn && retryBtn.addEventListener('click', ()=> { hideGameOverContent(); startGame(); });
  submitScoreBtn && submitScoreBtn.addEventListener('click', async ()=> { await handleSubmitScore(); });
  fullscreenBtn && fullscreenBtn.addEventListener('click', toggleFullscreen);

  function escapeHtml(str=''){ return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }

  function init(){
    // initial sizing
    resizeCanvasToDisplay();
    // ensure resizing on window/orientation/fullscreen changes so canvas always fits below top bar
    window.addEventListener('resize', resizeCanvasToDisplay);
    window.addEventListener('orientationchange', () => setTimeout(resizeCanvasToDisplay, 120));
    const _fsHandler = () => setTimeout(() => {
      // after fullscreen change recalc layout and remove any leftover page scroll
      resizeCanvasToDisplay();
      // keep body overflow hidden so unfullscreen doesn't create scrollbars
      try { document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; } catch(e){}
    }, 64);
    document.addEventListener('fullscreenchange', _fsHandler);
    document.addEventListener('webkitfullscreenchange', _fsHandler);
    document.addEventListener('mozfullscreenchange', _fsHandler);
    document.addEventListener('MSFullscreenChange', _fsHandler);

    initBackgroundElements();
    lastTime = performance.now();
    animationId = requestAnimationFrame(function frame(t){ lastTime = t; animationId = requestAnimationFrame(loop); });
    setInterval(updateTimers, 1000);
    renderHearts();
  }

  setTimeout(init, 16);

})();
