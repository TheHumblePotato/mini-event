/* Day 3 - Fruitoween (Halloween Fruit Ninja)
   - copies leaderboard / save flow patterns from day_1
   - gameplay: objects thrown up, slice with mouse/touch trail
   - 3 lives, infinite time
   - powerups: +1 life, candy storm (10s), bomb invincibility (15s)
   - stains left on background when objects explode; bombs flashbang and clear stains
*/
(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const playbound = document.getElementById('playbound');
  const bigScoreEl = document.getElementById('big-score');
  const livesEl = document.getElementById('lives-indicator');
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

  // event end for day_3: Oct 30 0:00 AM PT (local)
  const now = new Date();
  const year = now.getFullYear();
  const GAME_END_TS = Date.parse(`${year}-10-30T00:00:00-07:00`);

  // game constants
  const W = canvas.width = 640;
  const H = canvas.height = 480;
  const GRAVITY = 0.35;
  const SPAWN_INTERVAL = 800; // ms normally
  const POWERUP_CHANCE = 0.02; // per spawn
  const TRAIL_LIFETIME = 160; // ms
  const TRAIL_MIN_DIST = 4;
  const START_LIVES = 3;

  // state
  let running = false;
  let lastTime = performance.now();
  let objects = []; // flying items: pumpkins, candy pumpkins, bombs
  let powerups = [];
  let trail = []; // {x,y,t}
  let stains = []; // {x,y,r,ts}
  let lives = START_LIVES;
  let score = 0;
  let lastSpawn = 0;
  let candyStormUntil = 0;
  let bombInvincibleUntil = 0;
  let flashUntil = 0;
  let animationId = null;

  // --- Added: wave manager, gravity vector, hearts UI, modifier system and spawn/source changes ---
  // gravity as vector (default down)
  let gravityVec = { x: 0, y: GRAVITY };

  // waves: choose random waves that affect spawn rate / sources / bombs
  let wave = { type: 'normal', startedAt: 0, duration: 8000, spawnRate: SPAWN_INTERVAL, allowBombs: true, fromSidesProb: 0.25, burstCount: 0 };

  function startNewWave() {
    const t = Math.random();
    const nowTs = Date.now();
    if (t < 0.18) {
      // fast wave: more frequent, sometimes from sides
      wave = { type: 'fast', startedAt: nowTs, duration: 8000 + Math.random()*4000, spawnRate: 220, allowBombs: true, fromSidesProb: 0.35, burstCount: 0 };
    } else if (t < 0.36) {
      // shower: many fruits, no bombs
      wave = { type: 'shower', startedAt: nowTs, duration: 7000 + Math.random()*5000, spawnRate: 90, allowBombs: false, fromSidesProb: 0.18, burstCount: 0 };
    } else if (t < 0.6) {
      // burst: lots at once from multiple sources
      wave = { type: 'burst', startedAt: nowTs, duration: 4200, spawnRate: 700, allowBombs: false, fromSidesProb: 0.6, burstCount: 8 + Math.floor(Math.random()*6) };
    } else {
      // normal
      wave = { type: 'normal', startedAt: nowTs, duration: 10000 + Math.random()*8000, spawnRate: 720 + Math.random()*320, allowBombs: true, fromSidesProb: 0.22, burstCount: 0 };
    }
    // no screen message per spec; we still notify on big modifier changes only
    lastSpawn = 0;
  }

  // modifier system: random modifiers that alter gravity or invert behaviour
  let modifier = { active: false, kind: null, until: 0 };

  function maybeStartModifier() {
    if (modifier.active) return;
    if (Math.random() < 0.045) {
      const kinds = ['angle', 'reverse', 'flip', 'weird'];
      const k = kinds[Math.floor(Math.random()*kinds.length)];
      const nowTs = Date.now();
      modifier.active = true;
      modifier.kind = k;
      modifier.until = nowTs + (8000 + Math.random()*10000); // 8-18s
      // apply immediately
      if (k === 'angle') {
        // random diagonal gravity
        const angle = (Math.random()*Math.PI*2);
        const mag = 0.28 + Math.random()*0.5;
        gravityVec = { x: Math.cos(angle)*mag, y: Math.sin(angle)*mag };
        showToast('Gravity changed!');
      } else if (k === 'flip') {
        gravityVec = { x: 0, y: -Math.abs(GRAVITY) };
        showToast('Gravity flipped!');
      } else if (k === 'reverse') {
        // reverse roles: bombs become good (points) and fruits harm
        showToast('Danger reversed!');
      } else if (k === 'weird') {
        // weird small rotating gravity
        gravityVec = { x: (Math.random()-0.5)*0.8, y: (Math.random()-0.2)*0.6 };
        showToast('Weird gravity!');
      }
    }
  }

  function maybeEndModifier() {
    if (!modifier.active) return;
    if (Date.now() > modifier.until) {
      modifier.active = false;
      modifier.kind = null;
      gravityVec = { x: 0, y: GRAVITY };
      showToast('Gravity back to normal');
    }
  }

  // hearts UI (max 5)
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
    for (let i = 0; i < max; i++) {
      if (i < cur) out.push('❤'); else out.push('♡');
    }
    heartsEl.textContent = out.join(' ');
  }

  // spawn a thrown object (pumpkin or bomb or spooky props)
  function spawnThrown(x = null, opts = {}) {
    if (!running) return;
    const allowBombs = (typeof opts.allowBomb === 'boolean') ? opts.allowBomb : wave.allowBombs;

    // Very rare chance to spawn special event candy (max once per 30s)
    const nowTs = Date.now();
    if (nowTs - lastEventCandyAt > EVENT_CANDY_COOLDOWN && Math.random() < 0.003) {
      // spawn event candy from bottom or side
      const fromSide = Math.random() < 0.3;
      const sx = fromSide ? (Math.random()<0.5 ? -20 : W+20) : (80 + Math.random()*(W-160));
      const sy = fromSide ? (60 + Math.random()*(H-120)) : (H + 26);
      makeEventCandy(sx, sy);
      lastEventCandyAt = nowTs;
      return;
    }

    // sometimes spawn one of many candy variants (treat as target candy)
    if (Math.random() < 0.08) {
      const cv = candyVariants[Math.floor(Math.random()*candyVariants.length)];
      // spawn from bottom (mostly)
      const sx = x !== null ? x : (80 + Math.random()*(W-160));
      const sy = H + 26;
      const vx = (Math.random() - 0.5) * 5;
      const vy = -8 - Math.random()*8;
      const obj = { x: sx, y: sy, vx, vy, type: 'candy', subtype: cv.id, candyMeta: cv, r: 12 + Math.random()*8, alive: true, created: Date.now() };
      objects.push(obj);
      return;
    }

    // otherwise normal targets / bombs (respect wave allowBombs)
    const targetTypes = ['pumpkin','pumpkin_small','ghost'];
    let type = targetTypes[Math.floor(Math.random()*targetTypes.length)];
    if (allowBombs && Math.random() < 0.10) type = 'bomb';

    const fromSide = Math.random() < wave.fromSidesProb;
    let sx, sy, vx, vy;
    if (fromSide) {
      const left = Math.random() < 0.5;
      sx = left ? -20 : W + 20;
      sy = 120 + Math.random()*(H - 240);
      vx = (left ? 3 + Math.random()*4 : -3 - Math.random()*4) * (1 + (wave.type === 'fast' ? 0.4 : 0));
      vy = -3 - Math.random()*6;
    } else {
      sx = x !== null ? x : (80 + Math.random()*(W-160));
      sy = H + 26;
      vx = (Math.random() - 0.5) * (5 + (wave.type === 'fast' ? 2 : 0));
      vy = -9 - Math.random()*9;
    }

    // rocket bombs stronger if event active
    if (type === 'bomb' && rocketBombsActive) {
      vx *= 2;
      vy *= 1.9;
    }

    const radius = (type === 'pumpkin') ? 28 : (type === 'pumpkin_small' ? 18 : 22);
    const obj = { x: sx, y: sy, vx, vy, type, r: radius, alive: true, sliced: false, created: Date.now() };
    objects.push(obj);
  }

  // spawn powerup crossing screen horizontally
  function spawnPowerup(){
    if (!running) return;
    const types = ['life','candyStorm','bombInv'];
    const type = types[Math.floor(Math.random()*types.length)];
    const fromLeft = Math.random() < 0.5;
    const y = 60 + Math.random()*(H - 120);
    const speed = 4.0 + Math.random()*3.2; // faster
    const p = {
      x: fromLeft ? -40 : W + 40,
      y,
      vx: fromLeft ? speed : -speed,
      type,
      w: 20, // smaller -> harder to get
      h: 14,
      created: Date.now()
    };
    powerups.push(p);
  }

  // slice detection: segment vs circle
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

  // constants
  const EVENT_CANDY_COOLDOWN = 30_000; // 30s minimum between special event candies
  const EVENT_DURATION_MS = 30_000; // events last 30s
  let lastEventCandyAt = 0;
  let activeEvent = { kind: null, until: 0 };

  // time scale for speedup/slowdown
  let timeScale = 1.0;
  let rocketBombsActive = false;
  let rolesReversed = false;

  // candy variants (>=10) with distinct stain shapes/sizes
  const candyVariants = [
    { id: 'candy0', color:'#ff66cc', stain:{type:'splat',size:18} },
    { id: 'candy1', color:'#ffde59', stain:{type:'drip',size:20} },
    { id: 'candy2', color:'#8cff8c', stain:{type:'blob',size:14} },
    { id: 'candy3', color:'#66d9ff', stain:{type:'radial',size:22} },
    { id: 'candy4', color:'#ff9a3d', stain:{type:'streak',size:20} },
    { id: 'candy5', color:'#c27bff', stain:{type:'splat',size:26} },
    { id: 'candy6', color:'#ff7b7b', stain:{type:'drip',size:16} },
    { id: 'candy7', color:'#ffe066', stain:{type:'ring',size:24} },
    { id: 'candy8', color:'#6bffa6', stain:{type:'splatter',size:28} },
    { id: 'candy9', color:'#ffc0ff', stain:{type:'ink',size:18} }
  ];

  // special event candy visual variant
  function makeEventCandy(x,y){
    const c = { id:'eventCandy', glow:true, color:'#fff14d', x, y, vx: (Math.random()-0.5)*4, vy: -10 - Math.random()*6, r: 18, created: Date.now() };
    objects.push(c);
  }

  // add stain with shape information
  function addStain(x,y, r, shape='ellipse', color='#4a1a00'){
    stains.push({ x, y, r, ts: Date.now(), shape, color });
    if(stains.length > 260) stains.shift();
  }

  // render stains with different shapes/drips
  function drawStains(){
    stains.forEach(s => {
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = s.color || '#4a1a00';
      if(s.shape === 'ellipse' || !s.shape){
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.r, s.r*0.6, 0, 0, Math.PI*2);
        ctx.fill();
      } else if(s.shape === 'splat' || s.shape === 'splatter'){
        // draw multiple circles
        const count = 4 + Math.floor(Math.random()*5);
        for(let i=0;i<count;i++){
          const a = Math.random()*Math.PI*2;
          const rr = s.r*(0.4 + Math.random()*0.9);
          const ox = Math.cos(a)* (s.r*0.6*Math.random());
          const oy = Math.sin(a)* (s.r*0.6*Math.random());
          ctx.beginPath(); ctx.arc(s.x+ox, s.y+oy, rr,0,Math.PI*2); ctx.fill();
        }
      } else if(s.shape === 'drip'){
        // round blob with 1-2 drips
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r*0.8, 0, Math.PI*2); ctx.fill();
        const drips = 1 + Math.floor(Math.random()*2);
        for(let i=0;i<drips;i++){
          const dx = (Math.random()-0.5)*(s.r*0.4);
          const dy = s.r*0.6 + Math.random()*s.r*0.6;
          ctx.beginPath(); ctx.ellipse(s.x+dx, s.y+dy, s.r*0.18, s.r*0.3, 0,0,Math.PI*2); ctx.fill();
        }
      } else if(s.shape === 'streak'){
        ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r, s.r*0.3, -0.4,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha = 0.45;
        ctx.fillRect(s.x - s.r*0.2, s.y + s.r*0.1, s.r*0.4, s.r*0.8);
      } else if(s.shape === 'ring'){
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.strokeStyle = s.color; ctx.lineWidth = Math.max(3, s.r*0.18); ctx.stroke();
      } else {
        // fallback
        ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r, s.r*0.5, 0, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    });
  }

  // physics: apply gravityVec and timeScale
  function update(dtMs){
    const nowTs = Date.now();
    const stormActive = nowTs < candyStormUntil;

    // spawn behavior: use wave.spawnRate adjusted by timeScale
    if (running) {
      if (wave.type === 'burst' && wave.burstCount > 0 && Math.random() < 0.12) {
        for (let i=0;i<wave.burstCount;i++) spawnThrown(null, { allowBomb: wave.allowBombs });
        wave.burstCount = 0;
      } else {
        const spawnPeriod = Math.max(80, wave.spawnRate / Math.max(0.2, timeScale));
        if (Date.now() - lastSpawn > spawnPeriod + Math.random()*120) {
          spawnThrown(null, { allowBomb: wave.allowBombs });
          lastSpawn = Date.now();
          // powerups rarer while slowed or during storms? still spawn independently below
        }
      }
    }

    // objects physics: apply gravity vector scaled by timeScale
    for(let i = objects.length -1; i >=0; i--){
      const o = objects[i];
      if(!o.alive) continue;
      // apply gravity vector per ms (normalize to 16.666 baseline)
      const dtFactor = (dtMs / 16.666) * timeScale;
      o.vx += (gravityVec.x || 0) * dtFactor;
      o.vy += (gravityVec.y || GRAVITY) * dtFactor;
      o.x += o.vx * dtFactor;
      o.y += o.vy * dtFactor;

      // if object is eventCandy and falls off, remove after some time
      if(o.type === 'eventCandy' && (o.y < -60 || o.y > H + 120 || o.x < -120 || o.x > W + 120)){
        objects.splice(i,1);
        continue;
      }

      // remove if fall off bottom after a while (and not event candy or power candy)
      if(o.y > H + 120 || o.x < -160 || o.x > W + 160) {
        objects.splice(i,1);
      }
    }

    // powerups move faster already; timeScale affects movement slightly
    for(let i = powerups.length -1; i >=0; i--){
      const p = powerups[i];
      p.x += p.vx * (dtMs / 16.666) * timeScale;
      if(p.x < -80 || p.x > W + 80 || Date.now() - p.created > 22000) powerups.splice(i,1);
    }

    // trail cleanup and slicing (unchanged) but consider timeScale for scoring cadence
    const now = Date.now();
    for(let i = trail.length -1; i >=0; i--){
      if(now - trail[i].t > TRAIL_LIFETIME) trail.splice(i,1);
    }

    // slicing: check each segment of trail against objects & powerups
    if(trail.length >= 2){
      for(let oi = objects.length -1; oi >= 0; oi--){
        const o = objects[oi];
        if(!o.alive) continue;
        for(let i = 0; i < trail.length -1; i++){
          const a = trail[i], b = trail[i+1];
          if(segmentCircleHit(a.x,a.y,b.x,b.y, o.x,o.y, o.r)){
            // if it's an event candy
            if(o.id === 'eventCandy' || o.type === 'eventCandy' || o.id === 'eventCandy') {
              // trigger a 30s event (rare candy triggers events)
              triggerRandomEvent();
              objects.splice(oi,1);
              break;
            }
            // candy variants
            if(o.type === 'candy' && o.candyMeta){
              // leave candy-specific stain
              const meta = o.candyMeta;
              addStain(o.x, o.y, meta.stain.size, meta.stain.type, meta.color);
              score += 10;
              objects.splice(oi,1);
              break;
            }
            // normal targets / bombs
            if(o.type === 'bomb'){
              if(Date.now() < bombInvincibleUntil){
                score += 6;
                objects.splice(oi,1);
                break;
              } else {
                // normal bomb behavior: if rocketBombsActive they are nastier but still penalize
                loseLife();
                flashbangAndClearStains();
                objects.splice(oi,1);
                break;
              }
            } else {
              // normal pumpkin or ghost
              addStain(o.x, o.y, o.r * (0.6 + Math.random()*0.8), 'splat');
              score += (o.type === 'pumpkin_small' ? 6 : 12);
              objects.splice(oi,1);
              break;
            }
          }
        }
      }

      // powerups
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

    // event expiration
    if(activeEvent.kind && Date.now() > activeEvent.until){
      // reset effects
      activeEvent.kind = null;
      activeEvent.until = 0;
      timeScale = 1.0;
      rocketBombsActive = false;
      rolesReversed = false;
      gravityVec = { x: 0, y: GRAVITY };
      showToast('Event ended');
    }

    // update UI
    if(bigScoreEl) bigScoreEl.textContent = `Score: ${score}`;
    renderHearts();
  }

  // event triggering from special candy
  function triggerRandomEvent(){
    const kinds = ['angleGravity','flipGravity','rocketBombs','speedx2','slowHalf','reverseRoles'];
    const k = kinds[Math.floor(Math.random()*kinds.length)];
    activeEvent.kind = k;
    activeEvent.until = Date.now() + EVENT_DURATION_MS;
    // apply immediately
    if(k === 'angleGravity'){
      const angle = (Math.random()*Math.PI*2);
      const mag = 0.38;
      gravityVec = { x: Math.cos(angle)*mag, y: Math.sin(angle)*mag };
      showToast('Gravity now at an angle!');
    } else if(k === 'flipGravity'){
      gravityVec = { x: 0, y: -Math.abs(GRAVITY) * 1.1 };
      showToast('Gravity reversed!');
    } else if(k === 'rocketBombs'){
      rocketBombsActive = true;
      showToast('Rocket bombs active!');
    } else if(k === 'speedx2'){
      timeScale = 2.0;
      showToast('Everything sped up x2!');
    } else if(k === 'slowHalf'){
      timeScale = 0.5;
      showToast('Everything slowed x0.5!');
    } else if(k === 'reverseRoles'){
      rolesReversed = true;
      showToast('Fruits are dangerous!');
    }
  }

  // draw
  function draw(){
    ctx.clearRect(0,0,W,H);
    // background subtle
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#0b0506'); g.addColorStop(1,'#090305');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    // stains
    drawStains();

    // objects
    objects.forEach(o => {
      if(!o.alive) return;
      // simple shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(o.x+4, o.y+6, o.r*0.9, o.r*0.5, 0,0,Math.PI*2); ctx.fill();

      // candy variants
      if(o.type === 'candy' && o.candyMeta){
        ctx.fillStyle = o.candyMeta.color;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); ctx.fill();
        if(o.glow){
          const gr = ctx.createRadialGradient(o.x,o.y,2,o.x,o.y,o.r*2);
          gr.addColorStop(0,'rgba(255,255,200,0.9)');
          gr.addColorStop(1,'rgba(255,255,200,0)');
          ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(o.x,o.y,o.r*1.4,0,Math.PI*2); ctx.fill();
        }
      } else if(o.type === 'eventCandy' || o.id === 'eventCandy'){
        // very vibrant glowing candy
        ctx.save();
        ctx.shadowColor = '#fff06b';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#fffb79';
        ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill();
        ctx.restore();
        const gr = ctx.createRadialGradient(o.x,o.y,2,o.x,o.y,o.r*2);
        gr.addColorStop(0,'rgba(255,250,180,0.95)');
        gr.addColorStop(1,'rgba(255,120,40,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(o.x,o.y,o.r*1.6,0,Math.PI*2); ctx.fill();
      } else if(o.type === 'bomb'){
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#f44'; ctx.fillRect(o.x - 2, o.y - o.r - 8, 4, 6);
      } else {
        if(o.type === 'ghost'){
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#000'; ctx.fillRect(o.x - 6, o.y - 4, 4, 4); ctx.fillRect(o.x + 2, o.y - 4, 4, 4);
        } else {
          ctx.fillStyle = '#ff8c00';
          ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); ctx.fill();
        }
      }
    });

    // powerups
    powerups.forEach(p => {
      ctx.save();
      ctx.globalAlpha = 0.95;
      if(p.type === 'life') ctx.fillStyle = '#6bbf6b';
      else if(p.type === 'candyStorm') ctx.fillStyle = '#ffd84d';
      else ctx.fillStyle = '#7fbfff';
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

    // flash overlay for bombs
    if(Date.now() < flashUntil){
      const alpha = (flashUntil - Date.now()) / 300;
      ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
      ctx.fillRect(0,0,W,H);
    }
  }

  // pushTrail unchanged but convert positions to canvas scale
  function pushTrail(x,y){
    const t = Date.now();
    if(lastPos){
      const dx = x - lastPos.x, dy = y - lastPos.y;
      if(Math.hypot(dx,dy) < TRAIL_MIN_DIST) return;
    }
    trail.push({ x, y, t });
    lastPos = { x, y };
    if(trail.length > 48) trail.shift();
  }

  // powerup spawning: make them faster and a bit rarer/harder (respect timeScale)
  setInterval(()=> {
    if(!running) return;
    // chance reduced and speed increased in spawnPowerup function already
    if(Math.random() < 0.08) spawnPowerup();
  }, 1800);

  // ensure hearts UI initial render
  renderHearts();

  // ensure startGame resets event state
  function startGame(){
    objects = []; powerups = []; trail = []; stains = [];
    lives = START_LIVES; score = 0;
    lastSpawn = 0; candyStormUntil = 0; bombInvincibleUntil = 0; flashUntil = 0;
    lastEventCandyAt = 0;
    activeEvent = { kind:null, until:0 };
    timeScale = 1.0; rocketBombsActive = false; rolesReversed = false; gravityVec = { x:0, y:GRAVITY };
    running = true;
    lastTime = performance.now();
    if(!animationId) animationId = requestAnimationFrame(loop);
    hideGameOverContent();
    if(playOverlay) playOverlay.classList.add('hidden');
    renderHearts();
  }

  function restartFromSave(){
    hideGameOverContent();
    startGame();
  }

  // scoreboard & firebase save (copied/adapted from day_1)
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
      // update user totals
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
    // automatically restart game
    setTimeout(()=> restartFromSave(), 600);
  }

  // leaderboard UI: span full page
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

  // misc UI wiring
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

  // simple escaping
  function escapeHtml(str=''){ return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }

  // initial animation & timers
  lastTime = performance.now();
  animationId = requestAnimationFrame(function frame(t){ lastTime = t; animationId = requestAnimationFrame(loop); });
  setInterval(updateTimers, 1000);
})();

