/* Full replacement for day_3.js
   - Removes modifier system
   - Adds 11 candy types
   - Candies leave colored stains in varied shapes and can drip
   - Removes "Life lost" toast when losing a life
   - Restores background element initialization (copied from day_1)
   - Adds high-DPI-aware canvas resize so game area scales to available playbound space
*/
(() => {
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

  // event end for day_3: Oct 30 0:00 AM PT (local)
  const now = new Date();
  const year = now.getFullYear();
  const GAME_END_TS = Date.parse(`${year}-10-30T00:00:00-07:00`);

  // logical canvas resolution (kept constant aspect ratio)
  const LOGICAL_W = 640;
  const LOGICAL_H = 480;

  // game constants
  let W = LOGICAL_W, H = LOGICAL_H;
  const GRAVITY = 0.35;
  const SPAWN_INTERVAL = 800; // ms
  const POWERUP_CHANCE = 0.02;
  const TRAIL_LIFETIME = 160;
  const TRAIL_MIN_DIST = 4;
  const START_LIVES = 3;

  // state
  let running = false;
  let lastTime = performance.now();
  let objects = []; // flying items
  let powerups = [];
  let trail = []; // {x,y,t}
  let stains = []; // {x,y,r,color,shape,vy,drips:[]}
  let lives = START_LIVES;
  let score = 0;
  let lastSpawn = 0;
  let candyStormUntil = 0;
  let bombInvincibleUntil = 0;
  let flashUntil = 0;
  let animationId = null;

  // waves (no modifiers)
  let wave = { type: 'normal', startedAt: 0, duration: 8000, spawnRate: SPAWN_INTERVAL, allowBombs: true, fromSidesProb: 0.25, burstCount: 0 };

  function startNewWave() {
    const t = Math.random();
    const nowTs = Date.now();
    if (t < 0.18) {
      wave = { type: 'fast', startedAt: nowTs, duration: 8000 + Math.random()*4000, spawnRate: 220, allowBombs: true, fromSidesProb: 0.35, burstCount: 0 };
    } else if (t < 0.36) {
      wave = { type: 'shower', startedAt: nowTs, duration: 7000 + Math.random()*5000, spawnRate: 90, allowBombs: false, fromSidesProb: 0.18, burstCount: 0 };
    } else if (t < 0.6) {
      wave = { type: 'burst', startedAt: nowTs, duration: 4200, spawnRate: 700, allowBombs: false, fromSidesProb: 0.6, burstCount: 8 + Math.floor(Math.random()*6) };
    } else {
      wave = { type: 'normal', startedAt: nowTs, duration: 10000 + Math.random()*8000, spawnRate: 720 + Math.random()*320, allowBombs: true, fromSidesProb: 0.22, burstCount: 0 };
    }
    lastSpawn = 0;
  }

  // candy catalog (11+ types)
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

  // helper: high-DPI aware canvas sizing to best-fit playbound while keeping aspect ratio and not overlapping top controls (CSS reserves top padding)
  function resizeCanvasToDisplay() {
    if (!canvas || !playbound) return;
    // compute CSS pixel size of canvas element inside playbound (it is set to 100% width/height of playbound)
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const displayW = Math.max(1, Math.round(rect.width));
    const displayH = Math.max(1, Math.round(rect.height));
    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;
    canvas.width = Math.round(displayW * dpr);
    canvas.height = Math.round(displayH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // set logical W/H used by game scaling
    W = LOGICAL_W;
    H = LOGICAL_H;
  }

  // background initializer copied from day_1 exactly (leaves & pumpkins)
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

  // stains: varied shapes and drips
  function addStain(x,y,r,color='#4a1a00', shape='ellipse'){
    const s = { x, y, r: Math.max(6, r), color, shape, ts: Date.now(), vy: 0, drips: [] };
    stains.push(s);
    if(stains.length > 300) stains.shift();
  }

  function flashbangAndClearStains(){
    flashUntil = Date.now() + 300;
    stains = [];
  }

  // spawn thrown object (pumpkins, bombs, ghosts, candies)
  function spawnThrown(x = null, opts = {}) {
    if (!running) return;
    const allowBombs = (typeof opts.allowBomb === 'boolean') ? opts.allowBomb : wave.allowBombs;
    // candy chance
    let type = null;
    if (Math.random() < 0.24) {
      const c = CANDY_TYPES[Math.floor(Math.random()*CANDY_TYPES.length)];
      type = c.id;
    } else {
      const types = ['pumpkin','pumpkin_small','ghost'];
      type = types[Math.floor(Math.random()*types.length)];
      if (allowBombs && Math.random() < 0.10) type = 'bomb';
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

  // spawn powerup horizontally
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

  function segmentCircleHit(x1,y1,x2,y2, cx,cy, r){
    const dx = x2-x1, dy = y2-y1;
    const l2 = dx*dx + dy*dy;
    if(l2 === 0) return Math.hypot(cx-x1, cy-y1) <= r;
    let t = ((cx - x1)*dx + (cy - y1)*dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + t*dx, py = y1 + t*dy;
    return Math.hypot(cx - px, cy - py) <= r;
  }

  function spawnCandyStorm(){
    const until = Date.now() + 10000;
    candyStormUntil = Math.max(candyStormUntil, until);
  }
  function startBombInvincibility(){
    bombInvincibleUntil = Math.max(bombInvincibleUntil, Date.now() + 15000);
    showToast('Bomb invincible!');
  }

  // slice object (candies create colored stains/shapes with drips)
  function sliceObject(obj){
    if(!obj.alive) return;
    obj.alive = false;
    obj.sliced = true;

    if (obj.type === 'bomb') {
      if (Date.now() < bombInvincibleUntil) {
        score += 8;
      } else {
        loseLife(); // no 'life lost' toast per spec
        flashbangAndClearStains();
      }
      return;
    }

    if (obj.type && obj.type.startsWith('candy_')) {
      const points = Math.round(obj.r * (1.0 + Math.random()*1.6));
      score += points;
      const shape = ['ellipse','splat','blob','drip'][Math.floor(Math.random()*4)];
      addStain(obj.x + (Math.random()-0.5)*6, obj.y + (Math.random()-0.5)*6, obj.r * (0.7 + Math.random()*0.8), obj.color || '#ffd84d', shape);
      return;
    }

    // pumpkins/ghosts
    if (obj.type === 'ghost') score += 10;
    else score += (obj.type === 'pumpkin_small' ? 6 : 12);

    // pumpkin stain
    addStain(obj.x, obj.y, obj.r * (0.8 + Math.random()*0.8), '#4a1a00', Math.random() < 0.5 ? 'ellipse' : 'splat');
  }

  function activatePowerup(p){
    if(p.type === 'life'){
      lives = Math.min(5, lives + 1);
      renderHearts();
    } else if(p.type === 'candyStorm'){
      spawnCandyStorm();
      showToast('Candy Storm!');
    } else if(p.type === 'bombInv'){
      startBombInvincibility();
    }
  }

  function loseLife(){
    lives = Math.max(0, lives - 1);
    renderHearts();
    if(lives <= 0) endGame();
  }

  function endGame(){
    running = false;
    finalScoreEl.textContent = score;
    submitNote.textContent = (Date.now() <= GAME_END_TS) ? 'This score is within the event window and can be submitted to the main leaderboard.' : 'Event window ended — score will be recorded in the day leaderboard only.';
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
    gameTimerHeader.textContent = left <= 0 ? 'Game Ended' : (()=>{
      const s = Math.floor(left/1000);
      const hh = String(Math.floor(s/3600)).padStart(2,'0');
      const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
      const ss = String(s%60).padStart(2,'0');
      return `${hh}:${mm}:${ss}`;
    })();
  }

  // stains update & draw with dripping
  function updateAndDrawStains(dtMs){
    // update
    for (let i = stains.length - 1; i >= 0; i--) {
      const s = stains[i];
      s.vy = (s.vy || 0) + 0.03 * (dtMs/16.666);
      if (s.y + s.r*0.6 < LOGICAL_H - 6) {
        s.y += s.vy;
        if (Math.random() < 0.02) {
          s.drips.push({ x: s.x + (Math.random()-0.5)*s.r*0.6, y: s.y + s.r*0.6, r: Math.max(2, s.r*0.08 + Math.random()*2), vy: 0.6 + Math.random()*1.2 });
        }
      } else {
        s.vy = 0;
      }
      // drips
      for (let j = s.drips.length - 1; j >= 0; j--) {
        const d = s.drips[j];
        d.vy += 0.06 * (dtMs/16.666);
        d.y += d.vy;
        if (d.y > LOGICAL_H + 16) s.drips.splice(j,1);
      }
    }

    // draw
    stains.forEach(s => {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = s.color || '#4a1a00';
      if (s.shape === 'ellipse') {
        ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r, s.r*0.6, 0, 0, Math.PI*2); ctx.fill();
      } else if (s.shape === 'splat') {
        const pieces = 4 + Math.floor(Math.random()*3);
        for(let p = 0; p < pieces; p++){
          const angle = (p / pieces) * Math.PI * 2;
          const rr = s.r * (0.3 + Math.random()*1.0);
          ctx.beginPath(); ctx.arc(s.x + Math.cos(angle)*s.r*0.4, s.y + Math.sin(angle)*s.r*0.25, rr, 0, Math.PI*2); ctx.fill();
        }
      } else if (s.shape === 'blob') {
        ctx.beginPath();
        ctx.moveTo(s.x - s.r*0.6, s.y);
        ctx.quadraticCurveTo(s.x, s.y - s.r*1.0, s.x + s.r*0.6, s.y);
        ctx.quadraticCurveTo(s.x, s.y + s.r*0.9, s.x - s.r*0.6, s.y);
        ctx.fill();
      } else if (s.shape === 'drip') {
        ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r*0.8, s.r*1.1, 0, 0, Math.PI*2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r, s.r*0.6, 0, 0, Math.PI*2); ctx.fill();
      }

      // draw drips
      if (s.drips && s.drips.length) {
        ctx.globalAlpha = 0.95;
        s.drips.forEach(d => {
          ctx.beginPath();
          ctx.ellipse(d.x, d.y, d.r, d.r*1.6, 0, 0, Math.PI*2);
          ctx.fill();
        });
      }
      ctx.restore();
    });
  }

  // draw scene
  function draw(dtMs=16.666){
    // clear logical surface
    ctx.clearRect(0,0, LOGICAL_W, LOGICAL_H);

    // subtle background gradient
    const g = ctx.createLinearGradient(0,0,0,LOGICAL_H);
    g.addColorStop(0,'#0b0506'); g.addColorStop(1,'#090305');
    ctx.fillStyle = g; ctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);

    // stains first
    updateAndDrawStains(dtMs);

    // objects
    objects.forEach(o => {
      if(!o.alive) return;
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(o.x+4, o.y+6, o.r*0.9, o.r*0.5, 0,0,Math.PI*2); ctx.fill();

      if(o.type === 'bomb'){
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#f44'; ctx.fillRect(o.x-2, o.y - o.r - 8, 4, 6);
      } else if (o.type && o.type.startsWith('candy_')) {
        const c = o.color || '#ffd84d';
        ctx.save(); ctx.translate(o.x, o.y);
        switch (o.candyShape) {
          case 'circle': ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0,0,o.r,0,Math.PI*2); ctx.fill(); break;
          case 'twist': ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0,0,o.r*1.1,o.r*0.65, Math.PI/6,0,Math.PI*2); ctx.fill(); break;
          case 'square': ctx.fillStyle = c; ctx.fillRect(-o.r,-o.r,o.r*2,o.r*2); break;
          case 'star': { ctx.fillStyle = c; ctx.beginPath(); for(let i=0;i<5;i++){ ctx.lineTo(Math.cos((18+72*i)/180*Math.PI)*o.r, -Math.sin((18+72*i)/180*Math.PI)*o.r); ctx.lineTo(Math.cos((54+72*i)/180*Math.PI)*(o.r*0.5), -Math.sin((54+72*i)/180*Math.PI)*(o.r*0.5)); } ctx.closePath(); ctx.fill(); } break;
          case 'bite': ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0,0,o.r,Math.PI*0.1,Math.PI*1.9); ctx.fill(); break;
          case 'stick': ctx.fillStyle = c; ctx.fillRect(-o.r*0.5, -o.r*2, o.r, o.r*4); break;
          case 'gummy': ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0,0,o.r*0.9,o.r*0.7,0,0,Math.PI*2); ctx.fill(); break;
          case 'choco': ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0,0,o.r,0,Math.PI*2); ctx.fill(); break;
          case 'ring': ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0,0,o.r,0,Math.PI*2); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(0,0,o.r*0.45,0,Math.PI*2); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; break;
          case 'spike': { ctx.fillStyle = c; ctx.beginPath(); for(let i=0;i<6;i++){ const a=(i/6)*Math.PI*2; ctx.lineTo(Math.cos(a)*o.r, Math.sin(a)*o.r); ctx.lineTo(Math.cos(a+Math.PI/6)*(o.r*0.4), Math.sin(a+Math.PI/6)*(o.r*0.4)); } ctx.closePath(); ctx.fill(); } break;
          case 'hex': { ctx.fillStyle = c; ctx.beginPath(); for(let i=0;i<6;i++){ const a=(i/6)*Math.PI*2; const px=Math.cos(a)*o.r, py=Math.sin(a)*o.r; if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.closePath(); ctx.fill(); } break;
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

    // flash effect
    if(Date.now() < flashUntil){
      const alpha = (flashUntil - Date.now()) / 300;
      ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
      ctx.fillRect(0,0,LOGICAL_W,LOGICAL_H);
    }
  }

  // physics & logic update
  function update(dtMs){
    const nowTs = Date.now();
    const stormActive = nowTs < candyStormUntil;

    // spawn logic
    if(stormActive){
      if(Math.random() < 0.45) spawnThrown(80 + Math.random()*(LOGICAL_W-160));
    } else {
      if(nowTs - lastSpawn > SPAWN_INTERVAL + Math.random()*400) {
        spawnThrown();
        lastSpawn = nowTs;
        if(Math.random() < POWERUP_CHANCE) spawnPowerup();
      }
    }

    // objects physics
    for(let i = objects.length -1; i >=0; i--){
      const o = objects[i];
      if(!o.alive) continue;
      o.vy += GRAVITY * (dtMs / 16.666);
      o.x += o.vx * (dtMs / 16.666);
      o.y += o.vy * (dtMs / 16.666);
      if(o.y > LOGICAL_H + 80) objects.splice(i,1);
    }

    // powerups physics
    for(let i = powerups.length -1; i >=0; i--){
      const p = powerups[i];
      p.x += p.vx * (dtMs / 16.666);
      if(p.x < -80 || p.x > LOGICAL_W + 80 || Date.now() - p.created > 22000) powerups.splice(i,1);
    }

    // trail cleanup
    const now = Date.now();
    for(let i = trail.length -1; i >=0; i--){
      if(now - trail[i].t > TRAIL_LIFETIME) trail.splice(i,1);
    }

    // slicing detection
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

    // update UI
    if(bigScoreEl) bigScoreEl.textContent = `Score: ${score}`;
  }

  // main loop
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
    // clamp to logical canvas area
    trail.push({ x: Math.max(0, Math.min(LOGICAL_W, x)), y: Math.max(0, Math.min(LOGICAL_H, y)), t });
    lastPos = { x, y };
    if(trail.length > 64) trail.shift();
  }

  function clientToCanvasPos(clientX, clientY){
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (LOGICAL_W / rect.width);
    const y = (clientY - rect.top) * (LOGICAL_H / rect.height);
    return { x, y };
  }

  canvas.addEventListener('mousemove', e => {
    const p = clientToCanvasPos(e.clientX, e.clientY);
    pushTrail(p.x, p.y);
  });
  canvas.addEventListener('mousedown', e => {
    const p = clientToCanvasPos(e.clientX, e.clientY);
    pushTrail(p.x, p.y);
  });
  canvas.addEventListener('touchmove', e => {
    const t = e.touches[0];
    const p = clientToCanvasPos(t.clientX, t.clientY);
    pushTrail(p.x, p.y);
  }, { passive: true });
  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    const p = clientToCanvasPos(t.clientX, t.clientY);
    pushTrail(p.x, p.y);
  }, { passive: true });
  window.addEventListener('mouseup', ()=> lastPos = null);
  window.addEventListener('touchend', ()=> lastPos = null);

  // periodic powerup spawns
  setInterval(()=> {
    if(!running) return;
    if(Math.random() < 0.12) spawnPowerup();
  }, 2200);

  // game control
  function startGame(){
    initBackgroundElements();
    objects = []; powerups = []; trail = []; stains = [];
    lives = START_LIVES; score = 0;
    lastSpawn = 0; candyStormUntil = 0; bombInvincibleUntil = 0; flashUntil = 0;
    running = true;
    lastTime = performance.now();
    if(!animationId) animationId = requestAnimationFrame(loop);
    hideGameOverContent();
    if(playOverlay) playOverlay.classList.add('hidden');
  }

  function restartFromSave(){
    hideGameOverContent();
    startGame();
  }

  // hearts UI
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

  // scoreboard & firebase save (copied/adapted from previous)
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
    setTimeout(()=> restartFromSave(), 600);
  }

  // leaderboard UI
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

  // UI wiring
  playBtn && playBtn.addEventListener('click', ()=> startGame());
  retryBtn && retryBtn.addEventListener('click', ()=> { hideGameOverContent(); startGame(); });
  submitScoreBtn && submitScoreBtn.addEventListener('click', async ()=> { await handleSubmitScore(); });

  // fullscreen
  async function toggleFullscreen(){
    try{
      if(!document.fullscreenElement) await playbound.requestFullscreen();
      else await document.exitFullscreen();
    }catch(e){}
  }
  fullscreenBtn && fullscreenBtn.addEventListener('click', toggleFullscreen);

  // escape
  function escapeHtml(str=''){ return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }

  // startup
  function init() {
    // set canvas CSS to fill playbound — CSS already controls layout; we ensure DPI-aware resolution
    resizeCanvasToDisplay();
    window.addEventListener('resize', () => {
      resizeCanvasToDisplay();
    });
    initBackgroundElements();
    lastTime = performance.now();
    animationId = requestAnimationFrame(function frame(t){ lastTime = t; animationId = requestAnimationFrame(loop); });
    setInterval(updateTimers, 1000);
    // render initial hearts
    renderHearts();
  }

  // ensure canvas is sized after DOM/CSS applied
  setTimeout(init, 16);

})();

