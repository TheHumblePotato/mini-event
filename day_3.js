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
  const helpBtn = document.getElementById('help-btn');
  const helpClose = document.getElementById('help-close');
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

  // UI helpers (copy pattern from day_1)
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

  // spawn a thrown object (pumpkin or bomb or spooky props)
  function spawnThrown(x = null){
    // x null => spawn from bottom center range
    const types = ['pumpkin','pumpkin_small','ghost']; // pumpkins and other targets
    const r = Math.random();
    let type = types[Math.floor(Math.random()*types.length)];
    if(Math.random() < 0.12) type = 'bomb';
    // spawn position at bottom with slight horizontal random
    const sx = x !== null ? x : (100 + Math.random()*(W-200));
    const sy = H + 20;
    const vx = (Math.random() - 0.5) * 6;
    const vy = -8 - Math.random()*8; // toss upward
    const radius = (type === 'pumpkin') ? 28 : (type === 'pumpkin_small' ? 18 : 22);
    const obj = { x: sx, y: sy, vx, vy, type, r: radius, alive: true, sliced: false, created: Date.now() };
    objects.push(obj);
  }

  // spawn powerup crossing screen horizontally
  function spawnPowerup(){
    const types = ['life','candyStorm','bombInv'];
    const type = types[Math.floor(Math.random()*types.length)];
    const fromLeft = Math.random() < 0.5;
    const y = 60 + Math.random()*(H - 120);
    const speed = 2.2 + Math.random()*2.2;
    const p = {
      x: fromLeft ? -40 : W + 40,
      y,
      vx: fromLeft ? speed : -speed,
      type,
      w: 34,
      h: 20,
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

  function addStain(x,y,r){
    stains.push({ x, y, r, ts: Date.now() });
    // limit stains
    if(stains.length > 180) stains.shift();
  }

  function flashbangAndClearStains(){
    flashUntil = Date.now() + 300;
    stains = []; // wipe stains
  }

  function sliceObject(obj){
    if(!obj.alive) return;
    obj.alive = false;
    obj.sliced = true;
    addStain(obj.x, obj.y, obj.r * (0.6 + Math.random()*0.8));
    if(obj.type === 'bomb'){
      if(Date.now() < bombInvincibleUntil){
        score += 8; // harmless if invincible
      } else {
        loseLife();
        flashbangAndClearStains();
      }
    } else {
      score += (obj.type === 'pumpkin_small' ? 6 : 12);
    }
  }

  function activatePowerup(p){
    if(p.type === 'life'){
      lives = Math.min(9, lives + 1);
      showToast('+1 Life');
    } else if(p.type === 'candyStorm'){
      spawnCandyStorm();
      showToast('Candy Storm!');
    } else if(p.type === 'bombInv'){
      startBombInvincibility();
    }
  }

  function loseLife(){
    lives -= 1;
    if(lives < 0) lives = 0;
    showToast('Life lost');
    if(lives <= 0) endGame();
  }

  function endGame(){
    running = false;
    finalScoreEl.textContent = score;
    submitNote.textContent = (Date.now() <= GAME_END_TS) ? 'This score is within the event window and can be submitted to the main leaderboard.' : 'Event window ended — score will be recorded in the day leaderboard only.';
    // show game over content inside playbound (remove modal wrapper border)
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
    // move back to modal wrapper
    const wrapper = gameOverModal;
    if(wrapper && gameOverContent.parentElement !== wrapper) wrapper.appendChild(gameOverContent);
    gameOverContent.style.position = '';
    gameOverContent.style.left = '';
    gameOverContent.style.top = '';
    gameOverContent.style.transform = '';
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
    stains.forEach(s => {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#4a1a00';
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r, s.r*0.6, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // objects
    objects.forEach(o => {
      if(!o.alive) return;
      // simple shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(o.x+4, o.y+6, o.r*0.9, o.r*0.5, 0,0,Math.PI*2); ctx.fill();
      if(o.type === 'bomb'){
        // bomb visual
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#f44'; ctx.fillRect(o.x - 2, o.y - o.r - 8, 4, 6);
      } else {
        // pumpkin / ghost
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

    // trail (draw quickly fading strokes)
    ctx.lineCap = 'round';
    for(let i = 0; i < trail.length - 1; i++){
      const a = trail[i], b = trail[i+1];
      const alpha = Math.max(0, 1 - (Date.now() - a.t) / TRAIL_LIFETIME);
      ctx.strokeStyle = `rgba(255,255,255,${0.28 * alpha})`;
      ctx.lineWidth = 8 * alpha;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      // inner brighter line
      ctx.strokeStyle = `rgba(255,230,160,${0.9 * alpha})`;
      ctx.lineWidth = 3 * alpha;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }

    // UI overlays drawn outside canvas by DOM; we only need to draw flash if active
    if(Date.now() < flashUntil){
      const alpha = (flashUntil - Date.now()) / 300;
      ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
      ctx.fillRect(0,0,W,H);
    }
  }

  // update physics and game logic
  function update(dtMs){
    // spawn logic
    const nowTs = Date.now();
    // candy storm spawns many
    const stormActive = nowTs < candyStormUntil;
    if(stormActive){
      if(Math.random() < 0.45) spawnThrown(80 + Math.random()*(W-160));
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
      // remove if fall off bottom after a while
      if(o.y > H + 80){
        objects.splice(i,1);
      }
    }

    // powerup movement and expiration
    for(let i = powerups.length -1; i >=0; i--){
      const p = powerups[i];
      p.x += p.vx * (dtMs / 16.666);
      if(p.x < -80 || p.x > W + 80 || Date.now() - p.created > 22000) powerups.splice(i,1);
    }

    // trail cleanup
    const now = Date.now();
    for(let i = trail.length -1; i >=0; i--){
      if(now - trail[i].t > TRAIL_LIFETIME) trail.splice(i,1);
    }

    // slicing: check each segment of trail against objects & powerups
    if(trail.length >= 2){
      for(let oi = objects.length -1; oi >= 0; oi--){
        const o = objects[oi];
        if(!o.alive) continue;
        // check against all recent trail segments
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
          // approximate powerup hit as rectangle vs segment (simple: point near segment)
          if(segmentCircleHit(a.x,a.y,b.x,b.y, p.x, p.y, Math.max(p.w,p.h)/2)){
            activatePowerup(p);
            powerups.splice(pi,1);
            break;
          }
        }
      }
    }

    // while in bomb invincibility, bombs harmless
    if(Date.now() > bombInvincibleUntil) {
      // expired
    }

    // update UI
    if(bigScoreEl) bigScoreEl.textContent = `Score: ${score}`;
    if(livesEl) livesEl.textContent = `Lives: ${lives}`;
  }

  // main loop
  function loop(nowTs){
    const dt = Math.min(40, nowTs - lastTime);
    lastTime = nowTs;
    update(dt);
    draw();
    animationId = requestAnimationFrame(loop);
  }

  // input handling (mouse and touch)
  let lastPos = null;
  function pushTrail(x,y){
    const t = Date.now();
    if(lastPos){
      const dx = x - lastPos.x, dy = y - lastPos.y;
      if(Math.hypot(dx,dy) < TRAIL_MIN_DIST) return;
    }
    trail.push({ x, y, t });
    lastPos = { x, y };
    // keep trail short
    if(trail.length > 48) trail.shift();
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    pushTrail(x,y);
  });
  canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    pushTrail(x,y);
  });
  canvas.addEventListener('touchmove', e => {
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (t.clientX - rect.left) * (canvas.width / rect.width);
    const y = (t.clientY - rect.top) * (canvas.height / rect.height);
    pushTrail(x,y);
  }, { passive: true });
  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (t.clientX - rect.left) * (canvas.width / rect.width);
    const y = (t.clientY - rect.top) * (canvas.height / rect.height);
    pushTrail(x,y);
  }, { passive: true });
  window.addEventListener('mouseup', ()=> lastPos = null);
  window.addEventListener('touchend', ()=> lastPos = null);

  // spawn powerups occasionally (independent loop)
  setInterval(()=> {
    if(!running) return;
    if(Math.random() < 0.12) spawnPowerup();
  }, 2200);

  // game control
  function startGame(){
    // reset
    objects = []; powerups = []; trail = []; stains = [];
    lives = START_LIVES; score = 0;
    lastSpawn = 0; candyStormUntil = 0; bombInvincibleUntil = 0; flashUntil = 0;
    running = true;
    lastTime = performance.now();
    if(!animationId) animationId = requestAnimationFrame(loop);
    // hide overlays
    hideGameOverContent();
    if(playOverlay) playOverlay.classList.add('hidden');
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

  helpBtn && helpBtn.addEventListener('click', ()=> { if(playbound) playbound.appendChild(document.getElementById('day-help-modal')); document.getElementById('day-help-modal').classList.remove('hidden'); });
  helpClose && helpClose.addEventListener('click', ()=> document.getElementById('day-help-modal').classList.add('hidden'));

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

