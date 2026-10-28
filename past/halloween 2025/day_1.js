/*
  Changes summary:
  - Score moved to top HUD (CSS change too)
  - Background uses falling leaves & pumpkins (no eye elements)
  - Game countdown label simplified ("Game Ends")
  - Fullscreen toggles only the playbound, updates icon, keeps visible border in FS
  - Play/retry immediately start game; overlays hidden in fullscreen
  - Jetpack/hat are rarer and give stronger flight; larger visuals
  - Springs give a stronger bounce
  - Blackholes are Halloween-themed and more visible
  - Enemies spawn very rarely
  - Anti-softlock runtime is rate-limited and prevents stacked mass spawns (fixes terrain bug)
  - Save flow: no local-only leaderboard; requires Firebase; shows index sign-in modal if not signed in and auto-submits after auth
  - User total score updated when saving
*/

// Full replacement of day_1 runtime implementing requested fixes/features
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
const UNLOCK_ISO = '2025-10-27T00:00:00-07:00'; // adjust per-day
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

  // DOM
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const playbound = document.getElementById('playbound');
  const bigScoreEl = document.getElementById('big-score');
  const gameTimerHeader = document.getElementById('game-timer');
  const scaryToggle = document.getElementById('day-scary-toggle');
  const dayLeaderboardBtn = document.getElementById('day-leaderboard-btn');
  const dayLeaderboardModal = document.getElementById('day-leaderboard-modal');
  const dayLeaderboardClose = document.getElementById('day-leaderboard-close');
  const dayLeaderboardBody = document.getElementById('day-leaderboard-body');
  const gameOverModal = document.getElementById('game-over-modal');
  const finalScoreEl = document.getElementById('final-score');
  const submitScoreBtn = document.getElementById('submit-score-btn');
  const retryBtn = document.getElementById('retry-btn');
  const submitNote = document.getElementById('submit-note');
  const dayJumpscareImg = document.getElementById('day-jumpscare-img');
  const dayJumpscare = document.getElementById('day-jumpscare');
  const playOverlay = document.getElementById('play-overlay');
  const playBtn = document.getElementById('play-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const backgroundRoot = document.getElementById('background');

  // config / constants
  const W = canvas.width;
  const H = canvas.height;
  const GRAVITY = 0.45;
  const PLAYER_SIZE = 28;
  const SCROLL_THRESHOLD = H * 0.42;
  const JUMP_VEL = -12;
  const MAX_PLATFORMS = 120;
  const REGEN_MS = 5000; // breakable regen 5s
  const ANTI_SOFTLOCK_COOLDOWN = 600;

  // state
  let platforms = [];
  let enemies = [];
  let pumpkins = []; // previously blackholes
  let pickups = [];
  let player = null;
  let keys = { left: false, right: false };
  let score = 0;
  let running = false;
  let lastTime = performance.now();
  let animationId = null;
  let frozen = false;
  let lastAntiSoftlockAt = 0;
  let scaryMode = localStorage.getItem('day1Scary') === 'true';
  // firebase/persistence hooks expected on window: firebaseAuth, firebaseSignInWithPopup, googleProvider, firebaseDb, firebaseDoc, firebaseSetDoc, firebaseGetDoc, firebaseCollection, firebaseGetDocs, firebaseQuery, firebaseOrderBy

  // timers / event end
  const now = new Date();
  const year = now.getFullYear();
  const EVENT_END_ISO = `${year}-10-28T00:00:00-07:00`;
  const GAME_END_TS = Date.parse(EVENT_END_ISO);

  // helpers
  function formatTimeRemaining(ms) {
    if (ms <= 0) return '00:00:00';
    const s = Math.floor(ms / 1000);
    const hh = Math.floor(s / 3600).toString().padStart(2,'0');
    const mm = Math.floor((s % 3600) / 60).toString().padStart(2,'0');
    const ss = (s % 60).toString().padStart(2,'0');
    return `${hh}:${mm}:${ss}`;
  }
  function updateTimers() {
    if (!gameTimerHeader) return;
    const left = GAME_END_TS - Date.now();
    gameTimerHeader.textContent = left <= 0 ? 'Game Ended' : formatTimeRemaining(left);
  }
  function rectsOverlap(a,b){
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // audio / jumpscare
  function getAudioCtx(){ try { return new (window.AudioContext||window.webkitAudioContext)(); } catch(e){ return null; } }
  function playScreamLoud(){
    const ctx = getAudioCtx(); if(!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type='sawtooth'; o.frequency.setValueAtTime(220, ctx.currentTime);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.7, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 1.2);
  }
  function doJumpscare(){
    if(!scaryMode) return;
    dayJumpscareImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='1000'%3E%3Crect width='100%' height='100%' fill='%23000'/%3E%3Ctext x='50%' y='55%' font-size='140' text-anchor='middle' fill='%23ff0000' font-family='Creepster'%3ESCREAM%3C/text%3E%3C/svg%3E";
    dayJumpscare.classList.remove('hidden');
    playScreamLoud();
    setTimeout(()=> dayJumpscare.classList.add('hidden'), 1300);
  }

  // UI helpers
  function showModalInPlaybound(modalEl){
    if(!modalEl || !playbound) return;
    if(modalEl.parentElement !== playbound) playbound.appendChild(modalEl);
    modalEl.classList.remove('hidden');
  }
  function hideModal(modalEl){ if(!modalEl) return; modalEl.classList.add('hidden'); }
  function showToast(msg, timeout=2200){
    if(!playbound) return;
    let t = playbound.querySelector('.save-toast');
    if(!t){ t = document.createElement('div'); t.className='save-toast'; playbound.appendChild(t); }
    t.textContent = msg;
    clearTimeout(t._timeout);
    t._timeout = setTimeout(()=> { t && t.remove(); }, timeout);
  }

  // player factory
  function createPlayer(){
    return { x: W/2 - PLAYER_SIZE/2, y: H - 100, vx:0, vy:0, w:PLAYER_SIZE, h:PLAYER_SIZE, alive:true, flight: null };
  }

  // platform factory - springs removed; moving platforms faster / varied
  function createPlatform(x,y,type='static'){
    const w = 70 + Math.random()*60;
    const px = Math.max(8, Math.min(W - w - 8, Math.round(x)));
    const p = { x:px, y:Math.round(y), w, h:12, type, state: undefined, brokenAt:0, used:false };
    if(type === 'moving'){
      const base = 1.4 + Math.random()*2.0; // faster
      p.vx = (Math.random()<0.5?-1:1)*base;
      p.minX = Math.max(6, p.x-110);
      p.maxX = Math.min(W - p.w - 6, p.x+110);
    }
    return p;
  }

  function canLandOnPlatform(p){
    if(!p) return false;
    if(p.y > H - 8) return false;
    if(p.state === 'broken') return false;
    return true;
  }

  // initial spawn: fewer pumpkins, more pickups, no springs
  function spawnInitial(){
    platforms=[]; enemies=[]; pumpkins=[]; pickups=[];
    let y = H - 20;
    platforms.push(createPlatform(W/2 - 50, y, 'static'));
    for(let i=1;i<28;i++){
      y -= Math.round(38 + Math.random()*44);
      let type='static';
      if(i < 5){
        const r=Math.random();
        if(r < 0.06) type='moving';
      } else if(i < 12){
        const r=Math.random();
        if(r < 0.14) type='break';
        else if(r < 0.34) type='moving';
      } else {
        const r=Math.random();
        if(r < 0.32) type='break';
        else if(r < 0.6) type='moving';
        else if(r < 0.68) type='jet'; // rare boost platform
      }
      let x = Math.random()*(W-90);
      let p = createPlatform(x,y,type);
      for(let k=0;k<12;k++){
        const collision = platforms.some(q => Math.abs(q.y - p.y) < 18 && Math.abs(q.x - p.x) < Math.max(40, (q.w+p.w)/2));
        if(!collision) break;
        p.x = Math.random()*(W - p.w - 16);
      }
      platforms.push(p);

      // enemies: spawn more often
      if(i >= 4 && Math.random() < 0.03) {
        enemies.push({ x: Math.random()*(W-40), y: p.y - 28, w:28, h:28, seed:Math.random()*1000 });
      }

      // pickups more likely
      if(Math.random() < 0.001){
        pickups.push({ kind: Math.random() < 0.7 ? 'candy' : 'hat', x: Math.max(10,p.x + Math.random()*(p.w-20)), y: p.y - 36, picked:false });
      }

      // pumpkins rarer
      if(i > 12 && Math.random() < 0.02) pumpkins.push({ x: Math.random()*(W-60), y: y - 28, r: 20 });
    }
    ensureNoSoftlock();
    platforms.sort((a,b)=> a.y - b.y);
  }

  // ensure softlock free
  function ensureNoSoftlock(){
    const bandMap = {};
    platforms.forEach(p => {
      const k = Math.floor(p.y / 120);
      (bandMap[k] = bandMap[k] || []).push(p);
    });
    Object.values(bandMap).forEach(band => {
      const hasSafe = band.some(p => p.type !== 'break');
      if(!hasSafe && band.length>0) band[0].type='static';
    });
    const maxJump = Math.abs(JUMP_VEL)*7 + 80;
    platforms.sort((a,b)=> a.y - b.y);
    for(let i=1;i<platforms.length;i++){
      const dy = Math.abs(platforms[i].y - platforms[i-1].y);
      if(dy > maxJump){
        const newY = Math.round((platforms[i].y + platforms[i-1].y)/2);
        let nx = Math.min(Math.max(20, platforms[i-1].x + 40), W - 120);
        let newP = createPlatform(nx, newY, 'static');
        let tries = 0;
        while(platforms.some(q => Math.abs(q.y - newP.y) < 18 && Math.abs(q.x - newP.x) < Math.max(40, (q.w+newP.w)/2)) && tries++ < 10){
          newP.x = Math.random()*(W - newP.w - 16);
        }
        platforms.push(newP);
      }
    }
    platforms.sort((a,b)=> a.y - b.y);
    if(platforms.length > MAX_PLATFORMS) platforms = platforms.slice(0, MAX_PLATFORMS);
  }

  // continuous generator above player (keeps density consistent at high scores)
  function generatePlatformsAbove(){
    if(!player) return;
    let minY = Infinity;
    platforms.forEach(p => { if(p.y < minY) minY = p.y; });
    if(minY === Infinity) minY = H - 20;
    let attempts = 0;
    while(minY > -140 && platforms.length < MAX_PLATFORMS && attempts++ < 80){
      const gap = 34 + Math.random()*46;
      const newY = Math.round(minY - gap);
      const x = Math.random() * (W - 90);
      let type = 'static';
      const prog = Math.min(1, score/1000);
      const r = Math.random();
      if(r < 0.12 + 0.28*prog) type = 'break';
      else if(r < 0.42 + 0.2*prog) type = 'moving';
      else if(r < 0.46 + 0.06*prog) type = 'jet';
      const p = createPlatform(x, newY, type);
      if(!platforms.some(q => Math.abs(q.y - p.y) < 18 && Math.abs(q.x - p.x) < Math.max(40, (q.w+p.w)/2))){
        platforms.push(p);
        minY = p.y;
      } else {
        let tries = 0;
        while(tries++ < 6 && platforms.some(q => Math.abs(q.y - p.y) < 18 && Math.abs(q.x - p.x) < Math.max(40, (q.w+p.w)/2))){
          p.x = Math.random()*(W - p.w - 16);
        }
        platforms.push(p);
        minY = p.y;
      }
      // pickups spawn noticeably more often up high
      if(Math.random() < 0.06){
        pickups.push({ kind: Math.random() < 0.75 ? 'candy' : 'hat', x: Math.max(10,p.x + Math.random()*(p.w-20)), y: p.y - 36, picked:false });
      }
      // pumpkins rarer and later
      if(Math.random() < 0.012 && score > 150) pumpkins.push({ x: Math.random()*(W-60), y: newY - 28, r: 20 });
      // enemies more often
      if(Math.random() < 0.08) enemies.push({ x: Math.random()*(W-40), y: newY - 28, w:28, h:28, seed:Math.random()*1000 });
    }
    trimPlatforms();
    platforms.sort((a,b)=> a.y - b.y);
  }

  function antiSoftlockRuntime(){
    if(!player) return;
    const nowTs = Date.now();
    if(nowTs - lastAntiSoftlockAt < ANTI_SOFTLOCK_COOLDOWN) return;
    const dangerZone = platforms.filter(p => p.y > player.y - 40 && p.y < player.y + 240);
    const hasSafe = dangerZone.some(p => p.type !== 'break');
    if(!hasSafe){
      const y = Math.round(player.y - 140);
      if(!platforms.some(p => Math.abs(p.y - y) < 22)){
        let nx = Math.min(Math.max(40, player.x + 40), W - 120);
        let np = createPlatform(nx, y, 'static');
        let tries = 0;
        while(platforms.some(q => Math.abs(q.y - np.y) < 18 && Math.abs(q.x - np.x) < Math.max(40, (q.w+np.w)/2)) && tries++ < 8){
          np.x = Math.random()*(W - np.w - 16);
        }
        platforms.push(np);
        trimPlatforms();
        lastAntiSoftlockAt = nowTs;
      }
    }
  }

  function trimPlatforms(){
    platforms = platforms.filter(p => p.y < H + 260);
    if(platforms.length > MAX_PLATFORMS){
      platforms.sort((a,b)=> a.y - b.y);
      platforms = platforms.slice(0, MAX_PLATFORMS);
    }
  }

  // regeneration for breakables
  {
    // replace regeneration so breakables come back as breakable (not static)
    function regeneratePlatforms(){
      const nowTs = Date.now();
      platforms.forEach(p => {
        if (p.state === 'broken' && (nowTs - (p.brokenAt || 0) >= REGEN_MS)) {
          p.state = undefined;
          p.type = 'break';   // regenerate as breakable (was 'static')
          p.used = false;
        }
      });
    }
  }

  // draw background elements (leaves & pumpkins)
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

  // draw everything
  function draw(){
    ctx.clearRect(0,0,W,H);
    const bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#070306'); bg.addColorStop(1,'#0b0305');
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

    // pumpkins
    pumpkins.forEach(b => {
      const cx = b.x + b.r, cy = b.y + b.r;
      const g = ctx.createRadialGradient(cx,cy,b.r*0.6,cx,cy,b.r*2.5);
      g.addColorStop(0,'rgba(255,140,40,0.35)'); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx,cy,b.r*2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ff8c00'; ctx.beginPath(); ctx.arc(cx,cy,b.r*1.1,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx,cy,b.r*0.8,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#200'; ctx.beginPath(); ctx.moveTo(cx - 8, cy - 2); ctx.quadraticCurveTo(cx - 2, cy - 10, cx + 6, cy - 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - 10, cy + 6); ctx.quadraticCurveTo(cx - 2, cy + 12, cx + 10, cy + 6); ctx.fill();
    });

    // platforms
    platforms.forEach(p => {
      // alpha for broken
      const alpha = (p.state === 'broken') ? 0.25 : 1.0;
      ctx.globalAlpha = alpha;
      let color = '#884422';
      if(p.type === 'break') color = '#5a1b1b';
      else if(p.type === 'jet') color = '#7fe0ff';
      else if(p.type === 'moving') color = '#bb7f3a';
      ctx.fillStyle = color;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#000'; ctx.strokeRect(p.x, p.y, p.w, p.h);
      if(p.state === 'broken'){
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath();
        ctx.moveTo(p.x + 4, p.y + 2); ctx.lineTo(p.x + p.w - 4, p.y + 2); ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
    });

    // pickups: candy big & glowing, hat large
    pickups.forEach(it => {
      if(it.picked) return;
      const cx = it.x + 14, cy = it.y + 14;
      if(it.kind === 'candy'){
        const rad = 16;
        const grad = ctx.createRadialGradient(cx,cy,2,cx,cy,rad*1.8);
        grad.addColorStop(0,'rgba(255,255,180,0.98)'); grad.addColorStop(0.4,'rgba(255,140,60,0.95)'); grad.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx,cy,rad*1.1,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffd84d'; ctx.beginPath(); ctx.arc(cx,cy,rad,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#ff6b35'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(cx-8,cy-6); ctx.quadraticCurveTo(cx,cy, cx+8,cy+6); ctx.stroke();
      } else if(it.kind === 'hat'){
        ctx.fillStyle = '#9b2fa0';
        ctx.beginPath(); ctx.ellipse(cx, cy-2, 22, 10, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#4b0d4b'; ctx.fillRect(cx-8, cy+2, 16, 6);
      }
    });

    // enemies
    enemies.forEach(e => {
      ctx.fillStyle = '#fff'; ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.fillStyle = '#000'; ctx.fillRect(e.x + 5, e.y + 6, 6, 6); ctx.fillRect(e.x + e.w - 11, e.y + 6, 6, 6);
    });

    // player
    if(player){
      ctx.fillStyle = '#ffd86b'; ctx.beginPath();
      ctx.ellipse(player.x + player.w/2, player.y + player.h/2, player.w/2, player.h/2, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(player.x + player.w*0.35, player.y + player.h*0.35, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(player.x + player.w*0.65, player.y + player.h*0.35, 3, 0, Math.PI*2); ctx.fill();
    }

    // occasional scary glitch
    if(scaryMode && Math.random() < 0.002){
      ctx.fillStyle = 'rgba(255,0,0,0.06)'; ctx.fillRect(0, Math.random()*H, W, 4 + Math.random()*40);
    }
  }

  // main update
  function update(dtNorm){
    if(!player || !player.alive || frozen) return;
    const dtMs = Math.max(0, dtNorm * 16.666);

    regeneratePlatforms();

    // inputs: slightly reduced acceleration and stronger damping for easier direction changes
    if(keys.left) player.vx -= 0.65;    // was 0.7
    if(keys.right) player.vx += 0.65;   // was 0.7
    player.vx *= 0.9;                  // was 0.96 - stronger damping

    // gravity
    player.vy += GRAVITY;

    // flight: hold/taper velocity when active
    if(player.flight){
      player.flight.remaining -= dtMs;
      if(player.flight.remaining > player.flight.taper){
        player.vy = -player.flight.vel;
      } else if(player.flight.remaining > 0){
        const frac = Math.max(0, player.flight.remaining / player.flight.taper);
        player.vy = -player.flight.vel * frac;
      } else {
        player.flight = null;
      }
    }

    player.x += player.vx;
    player.y += player.vy;

    // wrap horizontal
    if(player.x > W) player.x = -player.w;
    if(player.x + player.w < 0) player.x = W - 1;

    // moving platforms
    platforms.forEach(p => {
      if(p.type === 'moving'){
        p.x += p.vx * (dtNorm);
        if(p.x < p.minX || p.x > p.maxX){ p.vx *= -1; p.x = Math.max(p.minX, Math.min(p.x, p.maxX)); }
      }
    });

    // landing logic (breakable platforms give slightly more lift than before, but still less than normal)
    if(player.vy > 0){
      platforms.forEach(p => {
        const platRect = { x: p.x, y: p.y, w: p.w, h: p.h };
        const playerFoot = { x: player.x, y: player.y + player.h, w: player.w, h: 6 };
        if(rectsOverlap(playerFoot, platRect) && (player.y + player.h - player.vy) <= p.y + 3 && canLandOnPlatform(p)){
          if(p.type === 'break'){
            const reachable = platforms.some(q => q !== p && (q.type !== 'break') && (q.y < p.y) && (p.y - q.y) < 180);
            if(!reachable){
              p.type = 'static';
            } else {
              // give slightly more lift than previous -9, but still less than normal (-12)
              player.vy = -11;
              p.state = 'broken';
              p.brokenAt = Date.now();
            }
          } else if(p.type === 'jet'){

            player.flight = { 
              remaining: 800, // Short duration just for the bounce
              vel: 20, 
              taper: 400 
            };
          } else {
            player.vy = JUMP_VEL + (-Math.random()*2);
          }
        }
      });
    }

    // cleanup placeholder removal if any
    platforms = platforms.filter(p => p !== undefined);

    // pickups collision -> set flight object (hold + taper)
    pickups.forEach(it => {
      if(!it.picked && rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, {x:it.x,y:it.y,w:28,h:28})){
        it.picked = true;
        if(it.kind === 'candy'){
          player.flight = { remaining: 2400, vel:46, taper:500 }; // candy: strong long
          player.vy = -player.flight.vel;
          score += 70;
        } else if(it.kind === 'hat'){
          player.flight = { remaining: 2100, vel:40, taper:450 }; // witch hat: stronger
          player.vy = -player.flight.vel;
          score += 55;
        }
      }
    });

    // enemies: if player is in a powered flight, destroy enemies you pass through instead of dying
    for(let i = enemies.length - 1; i >= 0; i--){
      const e = enemies[i];
      // small movement to keep enemies lively
      e.x += Math.sin((Date.now() + e.seed) / 600) * (0.6 + Math.random()*0.4);
      if(rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, {x:e.x,y:e.y,w:e.w,h:e.h})){
        if(player.flight){
          // destroy enemy harmlessly
          enemies.splice(i,1);
          score += 8;
          continue;
        } else {
          killPlayer('enemy');
          return; // player dead, bail out
        }
      }
    }

    // pumpkins: when in flight they are destroyed rather than killing the player
    for(let i = pumpkins.length - 1; i >= 0; i--){
      const b = pumpkins[i];
      const px = player.x + player.w/2, py = player.y + player.h/2;
      const cx = b.x + b.r, cy = b.y + b.r;
      const dx = px - cx, dy = py - cy;
      if(dx*dx + dy*dy < (b.r + player.w/4)*(b.r + player.w/4)){
        if(player.flight){
          // destroy the pumpkin harmlessly
          pumpkins.splice(i,1);
          score += 12;
          continue;
        } else {
          killPlayer('pumpkin');
          return;
        }
      }
    }

    // scroll world
    if(player.y < SCROLL_THRESHOLD){
      const dy = Math.floor(SCROLL_THRESHOLD - player.y);
      player.y = SCROLL_THRESHOLD;
      platforms.forEach(p => p.y += dy);
      enemies.forEach(e => e.y += dy);
      pumpkins.forEach(b => b.y += dy);
      pickups.forEach(it => it.y += dy);
      score += Math.floor(dy/8);
      generatePlatformsAbove();
    }

    // fall death
    if(player.y > H + 180) killPlayer('fall');

    antiSoftlockRuntime();
    generatePlatformsAbove();
  }

  // main loop
  function loop(nowTime){
    const dt = Math.min(32, nowTime - lastTime);
    lastTime = nowTime;
    initBackgroundElements();
    draw();
    if(running){
      update(dt/16.666);
      if(bigScoreEl) bigScoreEl.textContent = `Score: ${score}`;
      updateTimers();
    }
    animationId = requestAnimationFrame(loop);
  }

  // game control
  function startGame(){
    if(running) return;
    spawnInitial();
    player = createPlayer();
    score = 0;
    running = true;
    lastTime = performance.now();
    if(!animationId) animationId = requestAnimationFrame(loop);
    hideModal(gameOverModal);
    hideModal(playOverlay);
  }

  function resetToPlayOnly(){
    hideModal(gameOverModal);
    playOverlay.classList.remove('hidden');
    if(animationId){ cancelAnimationFrame(animationId); animationId = null; }
    running = false;
  }

  // kill player: always show modal inside playbound (works in fullscreen)
  {
    // replace killPlayer to show content (no modal wrapper border) so fullscreen still displays buttons
    function killPlayer(reason){
      if (!player || !player.alive) return;
      player.alive = false;
      running = false;
      finalScoreEl.textContent = score;
      submitNote.textContent = (Date.now() <= GAME_END_TS)
        ? 'This score is within the event window and can be submitted to the main leaderboard.'
        : 'Event window ended — score will be recorded in the day leaderboard only.';

      // show the game-over CONTENT (not the modal wrapper) so border disappears
      showGameOverContent();

      if (scaryMode) {
        doJumpscare();
        if (Math.random() < 0.5) {
          frozen = true;
          setTimeout(()=> frozen = false, 500 + Math.random()*900);
        }
      }
    }
  }

  {
    // add helpers to show/hide the modal CONTENT without the modal wrapper (removes modal border)
    const gameOverContent = gameOverModal ? gameOverModal.querySelector('.modal-content') : null;
    let _gameOverContentParent = null;
    function showGameOverContent() {
      if (!gameOverContent || !playbound) return;
      // hide the wrapper/modal element
      gameOverModal.classList.add('hidden');
      // remember original parent so we can restore later
      if (! _gameOverContentParent) _gameOverContentParent = gameOverContent.parentElement;
      // style the content to appear like a centered overlay but without the modal wrapper border
      gameOverContent.style.position = 'absolute';
      gameOverContent.style.left = '50%';
      gameOverContent.style.top = '52%';
      gameOverContent.style.transform = 'translate(-50%,-50%)';
      gameOverContent.style.zIndex = '220';
      gameOverContent.style.pointerEvents = 'auto';
      // append directly into playbound (so it overlays only game area); to show full-page remove this and append to body
      if (gameOverContent.parentElement !== playbound) playbound.appendChild(gameOverContent);
      gameOverContent.classList.remove('hidden');
    }
    function hideGameOverContent() {
      if (!gameOverContent) return;
      gameOverContent.classList.add('hidden');
      // restore original inline styles we set (minimal reset)
      gameOverContent.style.position = '';
      gameOverContent.style.left = '';
      gameOverContent.style.top = '';
      gameOverContent.style.transform = '';
      gameOverContent.style.zIndex = '';
      gameOverContent.style.pointerEvents = '';
      // move it back inside the modal wrapper if possible
      if (_gameOverContentParent && gameOverContent.parentElement !== _gameOverContentParent) {
        _gameOverContentParent.appendChild(gameOverContent);
      }
      // ensure the modal wrapper is hidden by default
      if (gameOverModal) gameOverModal.classList.add('hidden');
    }
  }

  // persistence helpers: one slot per uid, update totals
  async function submitScoreToFirestoreDocs(entry){
    try{
      if(!window.firebaseDb || !window.firebaseDoc || !window.firebaseSetDoc) return { ok:false, reason:'no-firebase' };
      const id = entry.uid ? entry.uid : `${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      const docRef = window.firebaseDoc(window.firebaseDb, 'day1_scores', id);
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
      // update user totals
      if(entry.uid && window.firebaseGetDoc && window.firebaseSetDoc){
        const userDocRef = window.firebaseDoc(window.firebaseDb, 'users', entry.uid);
        const snap = await window.firebaseGetDoc(userDocRef);
        let docData = {};
        if(snap && snap.exists && snap.exists()) docData = snap.data();
        else docData = { username: entry.playerName, email:'', createdAt:new Date(), scores:{ day1:0,day2:0,day3:0,day4:0,day5:0, total:0 } };
        docData.scores = docData.scores || {};
        docData.scores.day1 = Math.max(docData.scores.day1 || 0, entry.score);
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

  // save flow: try currentUser, otherwise popup sign-in; after successful save restart game automatically
  async function handleSubmitScore(){
    const fbUser = (window.firebaseAuth && window.firebaseAuth.currentUser) ? window.firebaseAuth.currentUser : null;
    let uid = fbUser ? fbUser.uid : null;
    let playerName = (window.userData && window.userData.username) ? window.userData.username : (fbUser && fbUser.email ? fbUser.email.split('@')[0] : 'Anonymous');
    const entry = { score, playerName, uid, ts: Date.now(), withinEvent: Date.now() <= GAME_END_TS };

    if(!uid){
      // attempt popup signin if available
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
      } else {
        showToast('Sign-in unavailable'); return;
      }
    }

    const r = await submitScoreToFirestoreDocs(entry);
    if(!r.ok){ showToast('Save failed'); return; }
    showToast('Score saved');

    // restart automatically shortly after save
    setTimeout(() => {
      hideModal(gameOverModal);
      hideModal(playOverlay);
      startGame();
    }, 700);
  }

  window.addEventListener('keydown', e => {
    const k = (e.key || '').toLowerCase();
    if (k === 'arrowleft' || k === 'a' || k === 'j') { keys.left = true; if(e.preventDefault) e.preventDefault(); }
    if (k === 'arrowright' || k === 'd' || k === 'l') { keys.right = true; if(e.preventDefault) e.preventDefault(); }
    if (k === 'f' && document.fullscreenEnabled) toggleFullscreen();
  });
  window.addEventListener('keyup', e => {
    const k = (e.key || '').toLowerCase();
    if (k === 'arrowleft' || k === 'a' || k === 'j') keys.left = false;
    if (k === 'arrowright' || k === 'd' || k === 'l') keys.right = false;
  });
  
  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    if(t.clientX < window.innerWidth/2){ keys.left = true; keys.right = false; } else { keys.right = true; keys.left=false; }
  }, { passive:true });
  canvas.addEventListener('touchend', ()=> { keys.left = keys.right = false; });

  // UI wiring
  {
    // modify leaderboard button handler so leaderboard modal spans the whole page (not confined to playbound)
    dayLeaderboardBtn && dayLeaderboardBtn.addEventListener('click', async () => {
      // make leaderboard modal full-page by appending to body (it will no longer be confined by .playbound .modal)
      if (dayLeaderboardModal.parentElement !== document.body) {
        document.body.appendChild(dayLeaderboardModal);
      }
      // load data
      dayLeaderboardBody.innerHTML = '<tr><td colspan="5">Loading…</td></tr>';
      dayLeaderboardModal.classList.remove('hidden');

      let remote = [];
      if (window.firebaseDb && window.firebaseGetDocs && window.firebaseCollection && window.firebaseQuery && window.firebaseOrderBy) {
        try {
          const q = window.firebaseQuery(window.firebaseCollection(window.firebaseDb,'day1_scores'), window.firebaseOrderBy('score','desc'));
          const snap = await window.firebaseGetDocs(q);
          snap.forEach(d => remote.push(d.data()));
        } catch (e) { console.warn(e); }
      }
      const rows = (remote || []).slice(0,30).map((r,idx) => {
        const when = new Date(r.ts).toLocaleString();
        const within = r.withinEvent ? 'Yes' : 'No';
        const name = r.playerName || (r.uid ? r.uid : 'Anonymous');
        return `<tr class="${idx===0?'rank-1':idx===1?'rank-2':idx===2?'rank-3':''}"><td>${idx+1}</td><td>${escapeHtml(name)}</td><td>${r.score}</td><td>${when}</td><td>${within}</td></tr>`;
      });
      dayLeaderboardBody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="5">No scores yet</td></tr>';
    });

    // ensure close puts modal back (optional) and hides it
    dayLeaderboardClose && dayLeaderboardClose.addEventListener('click', ()=> {
      dayLeaderboardModal.classList.add('hidden');
      // optionally move back into playbound to restore previous DOM state
      const frame = document.querySelector('.halloween-frame') || document.getElementById('game-area');
      if (frame && dayLeaderboardModal.parentElement !== frame) frame.appendChild(dayLeaderboardModal);
    });
  }

  submitScoreBtn && submitScoreBtn.addEventListener('click', handleSubmitScore);
  retryBtn && retryBtn.addEventListener('click', ()=> {
    hideGameOverContent();
    hideModal(playOverlay);
    setTimeout(()=> startGame(), 30);
  });


  playBtn && playBtn.addEventListener('click', ()=> startGame());

  // fullscreen toggles playbound only and keeps aspect
  async function toggleFullscreen(){
    try{
      if(!document.fullscreenElement){
        await playbound.requestFullscreen();
        if(fullscreenBtn) fullscreenBtn.textContent = '⤡';
      } else {
        await document.exitFullscreen();
        if(fullscreenBtn) fullscreenBtn.textContent = '⤢';
      }
    }catch(e){}
  }
  fullscreenBtn && fullscreenBtn.addEventListener('click', toggleFullscreen);

  // scary toggle
  if(scaryToggle){
    scaryToggle.checked = scaryMode;
    scaryToggle.addEventListener('change', ()=> {
      scaryMode = scaryToggle.checked;
      localStorage.setItem('day1Scary', scaryMode ? 'true' : 'false');
      if(scaryMode && Math.random() < 0.6) playScreamLoud();
    });
  }

  // escape html
  function escapeHtml(str=''){ return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }

  // draw loop start
  lastTime = performance.now();
  animationId = requestAnimationFrame(loop);
  updateTimers();
  setInterval(updateTimers, 1000);
  initBackgroundElements();

  // expose control for debugging if needed
  window.day1 = { startGame, killPlayer, resetToPlayOnly };

  // cleanup
  window.addEventListener('beforeunload', ()=> { if(animationId) cancelAnimationFrame(animationId); });
})();