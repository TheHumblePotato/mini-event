/*
  Halloween-themed Doodle Jump (Day 1)
  - Canvas-based platformer with platform types: static, break, spring, jetpack, enemy, blackhole
  - Score by max altitude (simple approach)
  - Timer tied to Oct 28 00:00 Pacific time (PST/PDT). After timer passes, scores won't be sent to main leaderboard.
  - Saves scores to Firestore collection 'day1_scores' (if firebase ready). Each doc includes
      { score, playerName, uid?, ts, withinEvent }
  - Local leaderboard kept in localStorage and shown in-day modal
  - Scary mode toggles extra visuals and jumpscare on death
*/

(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const timerEl = document.getElementById('time-left');
  const gameTimerHeader = document.getElementById('game-timer');
  const scaryToggle = document.getElementById('day-scary-toggle');
  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('day-help-modal');
  const helpClose = document.getElementById('help-close');
  const helpStep = document.getElementById('help-step');
  const helpInteractive = document.getElementById('help-interactive');
  const dayLeaderboardBtn = document.getElementById('day-leaderboard-btn');
  const dayLeaderboardModal = document.getElementById('day-leaderboard-modal');
  const dayLeaderboardClose = document.getElementById('day-leaderboard-close');
  const dayLeaderboardBody = document.getElementById('day-leaderboard-body');
  const gameOverModal = document.getElementById('game-over-modal');
  const finalScoreEl = document.getElementById('final-score');
  const submitScoreBtn = document.getElementById('submit-score-btn');
  const retryBtn = document.getElementById('retry-btn');
  const submitNote = document.getElementById('submit-note');
  const dayJumpscare = document.getElementById('day-jumpscare');
  const dayJumpscareImg = document.getElementById('day-jumpscare-img');

  // Game constants
  const W = canvas.width;
  const H = canvas.height;
  const GRAVITY = 0.5;
  const PLAYER_SIZE = 28;
  const SCROLL_THRESHOLD = H * 0.4;

  // state
  let platforms = [];
  let enemies = [];
  let blackholes = [];
  let player = null;
  let keys = { left: false, right: false };
  let score = 0;
  let maxY = H;
  let running = true;
  let scaryMode = localStorage.getItem('day1Scary') === 'true';
  let gameStart = Date.now();
  let lastTime = performance.now();
  let animationId = null;

  // Event end time in Pacific (PST/PDT) — uses a fixed offset string so results match Pacific wall-clock.
  // Note: uses current year and assumes local DST offset; this uses -07:00 which is PDT in late Oct (correct for typical DST years).
  const now = new Date();
  const year = now.getFullYear();
  // Use Oct 28 00:00 Pacific time. We'll use -07:00 which corresponds to PDT (during DST). For most event usages this matches intended Pacific wall clock.
  const EVENT_END_ISO = `${year}-10-28T00:00:00-07:00`;
  const GAME_END_TS = Date.parse(EVENT_END_ISO);

  function formatTimeRemaining(ms) {
    if (ms <= 0) return '00:00:00';
    const s = Math.floor(ms / 1000);
    const hh = Math.floor(s / 3600).toString().padStart(2,'0');
    const mm = Math.floor((s % 3600) / 60).toString().padStart(2,'0');
    const ss = (s % 60).toString().padStart(2,'0');
    return `${hh}:${mm}:${ss}`;
  }

  function updateTimers() {
    const nowTs = Date.now();
    const left = GAME_END_TS - nowTs;
    timerEl.textContent = formatTimeRemaining(left);
    gameTimerHeader.textContent = (left <= 0) ? 'Game Ended' : formatTimeRemaining(left);
  }

  // Scary mode visuals & audio helpers
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function playCreepyTone() {
    try {
      const ctx = getAudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.value = 110;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      o.start();
      o.stop(ctx.currentTime + 1.25);
    } catch (e) { /* ignore */ }
  }

  function doJumpscare() {
    if (!scaryMode) return;
    dayJumpscareImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='900' viewBox='0 0 900 900'%3E%3Crect width='900' height='900' fill='%23000'/%3E%3Ctext x='450' y='480' font-size='120' fill='%23ff0000' text-anchor='middle' font-family='Creepster, Arial' font-weight='700'%3EBEWARE%3C/text%3E%3C/svg%3E";
    dayJumpscare.classList.remove('hidden');
    playCreepyTone();
    setTimeout(()=> dayJumpscare.classList.add('hidden'), 1200);
  }

  // Game objects and generation
  function createPlayer() {
    return {
      x: W/2 - PLAYER_SIZE/2,
      y: H - 80,
      vx: 0,
      vy: 0,
      w: PLAYER_SIZE,
      h: PLAYER_SIZE,
      alive: true,
      yTopRecord: H
    };
  }

  function createPlatform(x,y,type='static') {
    return { x, y, w: 80 + Math.random()*40, h: 12, type, used:false };
  }

  function spawnInitial() {
    platforms = [];
    let y = H - 20;
    platforms.push(createPlatform(W/2 - 50, y, 'static'));
    for (let i=1;i<8;i++) {
      y -= 90 + Math.random()*70;
      const tRand = Math.random();
      let type='static';
      if (tRand < 0.12) type='break';
      else if (tRand < 0.22) type='spring';
      else if (tRand < 0.26) type='jet';
      platforms.push(createPlatform(Math.random()*(W-100), y, type));
    }
    enemies = [];
    blackholes = [];
  }

  function addPlatformRow(aboveY) {
    const gap = 80 + Math.random()*60;
    let y = aboveY - gap;
    for (let i=0;i<3;i++) {
      const tRand = Math.random();
      let type='static';
      if (tRand < 0.12) type='break';
      else if (tRand < 0.22) type='spring';
      else if (tRand < 0.26) type='jet';
      else if (tRand < 0.30) type='enemySpawn';
      const p = createPlatform(Math.random()*(W-90), y, type);
      platforms.push(p);
      y -= 90 + Math.random()*40;
      if (Math.random() < 0.06) {
        // place blackhole nearby
        blackholes.push({ x: Math.random()*(W-60), y: y+40, r: 22 });
      }
    }
  }

  // handle collisions
  function rectsOverlap(a,b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // input
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  // mobile touch
  let touchX = null;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchX = t.clientX;
    if (touchX < window.innerWidth/2) keys.left = true; else keys.right = true;
  }, {passive:true});
  canvas.addEventListener('touchend', () => { keys.left = keys.right = false; touchX = null; });

  // physics & loop
  function update(dt) {
    if (!player || !player.alive) return;
    // apply controls
    if (keys.left) player.vx -= 0.6;
    if (keys.right) player.vx += 0.6;
    // clamp vx
    player.vx *= 0.95;
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    // wrap horizontal
    if (player.x > W) player.x = -player.w;
    if (player.x + player.w < 0) player.x = W - 1;

    // platform collisions (only when falling)
    if (player.vy > 0) {
      platforms.forEach(p => {
        if (p.type === 'enemySpawn') return;
        const platRect = { x: p.x, y: p.y, w: p.w, h: p.h };
        const playerRect = { x: player.x, y: player.y + player.h, w: player.w, h: 6 };
        if (rectsOverlap(playerRect, platRect) && player.y + player.h - player.vy <= p.y) {
          // landed
          if (p.type === 'break') {
            // break platform (bounce a little)
            player.vy = -10;
            p.toRemove = true;
            playSoundSmall();
          } else if (p.type === 'spring') {
            player.vy = -18;
            p.used = true;
            playSoundSpring();
          } else if (p.type === 'jet') {
            player.vy = -28;
            p.used = true;
            playSoundJet();
          } else {
            player.vy = -12 - Math.random()*2;
          }
        }
      });
    }

    // remove broken platforms
    platforms = platforms.filter(p => !p.toRemove);

    // vertical scrolling: if player passes threshold, move everything down
    if (player.y < SCROLL_THRESHOLD) {
      const dy = Math.floor(SCROLL_THRESHOLD - player.y);
      player.y = SCROLL_THRESHOLD;
      platforms.forEach(p => p.y += dy);
      blackholes.forEach(b => b.y += dy);
      enemies.forEach(e => e.y += dy);
      score += Math.floor(dy/10);
    }

    // enemy simple movement
    enemies.forEach(e => {
      e.x += Math.sin((Date.now()+e.seed)/1500) * e.osc;
      // collision with player
      if (rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, {x:e.x,y:e.y,w:e.w,h:e.h})) {
        killPlayer('enemy');
      }
    });

    // blackhole collision
    blackholes.forEach(b => {
      const px = player.x + player.w/2;
      const py = player.y + player.h/2;
      const dx = px - (b.x + b.r);
      const dy = py - (b.y + b.r);
      if (dx*dx + dy*dy < (b.r+player.w/4)*(b.r+player.w/4)) {
        killPlayer('blackhole');
      }
    });

    // if player falls past bottom
    if (player.y > H + 200) killPlayer('fall');

    // ensure there are enough platforms up above
    const minY = Math.min(...platforms.map(p => p.y));
    if (minY === Infinity || minY > 200) addPlatformRow(minY === Infinity ? H/2 : minY);

    // cleanup platforms off bottom
    platforms = platforms.filter(p => p.y < H + 120);

    // update score by maximum ascent
    if (player.yTopRecord > player.y) {
      player.yTopRecord = player.y;
      score = Math.max(score, Math.floor((H - player.y) / 10));
    }
  }

  function draw() {
    // background
    ctx.clearRect(0,0,W,H);
    // subtle gradient
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, '#0b0405');
    g.addColorStop(1, '#12060a');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    // draw blackholes
    blackholes.forEach(b => {
      const cx = b.x + b.r;
      const cy = b.y + b.r;
      // spooky glowing ring
      const rg = ctx.createRadialGradient(cx,cy,b.r*0.2,cx,cy,b.r*2);
      rg.addColorStop(0,'rgba(0,0,0,0.9)');
      rg.addColorStop(1,'rgba(80,0,0,0.0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(cx,cy,b.r*1.6,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx,cy,b.r,0,Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#300';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // draw platforms
    platforms.forEach(p => {
      ctx.fillStyle = (p.type === 'break') ? '#5a1a1a' : (p.type === 'spring' ? '#ffd86b' : (p.type === 'jet' ? '#7fe0ff' : '#884422'));
      if (p.type === 'break') {
        ctx.fillStyle = '#3a0d0d';
      }
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // fancy edge
      ctx.strokeStyle = '#000';
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    });

    // draw player
    if (player) {
      ctx.fillStyle = scaryMode ? '#ff0000' : '#ffd86b';
      ctx.beginPath();
      ctx.ellipse(player.x + player.w/2, player.y + player.h/2, player.w/2, player.h/2, 0, 0, Math.PI*2);
      ctx.fill();
      // eyes
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(player.x + player.w*0.35, player.y + player.h*0.35, 3, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(player.x + player.w*0.65, player.y + player.h*0.35, 3, 0, Math.PI*2);
      ctx.fill();
    }

    // draw enemies (simple ghosts)
    enemies.forEach(e => {
      ctx.fillStyle = scaryMode ? '#800000' : '#ffffff';
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x + 6, e.y + 6, 6, 6);
      ctx.fillRect(e.x + e.w - 12, e.y + 6, 6, 6);
    });

    // debug score text (HUD handled elsewhere)
  }

  function loop(nowTime) {
    const dt = (nowTime - lastTime) / 16.666;
    lastTime = nowTime;
    if (running) {
      update(dt);
      draw();
      scoreEl.textContent = `Score: ${score}`;
      updateTimers();
    }
    animationId = requestAnimationFrame(loop);
  }

  // small sound effects
  function playSoundSmall() {
    if (!scaryMode) return;
    try {
      const ctx = getAudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = 600;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      o.start(); o.stop(ctx.currentTime + 0.25);
    } catch(e) {}
  }
  function playSoundSpring() { if (!scaryMode) return playCreepyTone(); }
  function playSoundJet() { if (!scaryMode) return playCreepyTone(); }

  // handle death
  function killPlayer(reason) {
    if (!player || !player.alive) return;
    player.alive = false;
    running = false;
    finalScoreEl.textContent = score;
    const within = Date.now() <= GAME_END_TS;
    submitNote.textContent = within ? 'This score is within the event window and will be submitted to the main leaderboard.' : 'Event window passed — score will be recorded in the day leaderboard only.';
    gameOverModal.classList.remove('hidden');
    // scary effect on death
    if (scaryMode) {
      doJumpscare();
      // subtle blood overlay effect (quick)
      const flash = document.createElement('div');
      flash.style.position='fixed';
      flash.style.left='0'; flash.style.top='0'; flash.style.right='0'; flash.style.bottom='0';
      flash.style.background='radial-gradient(circle, rgba(120,0,0,0.2), rgba(0,0,0,0.0))';
      flash.style.zIndex='2000';
      document.body.appendChild(flash);
      setTimeout(()=> flash.remove(),800);
    }
  }

  // restart
  function startGame() {
    platforms = [];
    enemies = [];
    blackholes = [];
    player = createPlayer();
    score = 0;
    running = true;
    spawnInitial();
    lastTime = performance.now();
    gameStart = Date.now();
    if (!animationId) animationId = requestAnimationFrame(loop);
  }

  // leaderboard / persistence
  const DAY1_KEY = 'day1_local_scores_v1';
  function loadLocalScores() {
    try {
      return JSON.parse(localStorage.getItem(DAY1_KEY) || '[]');
    } catch (e) { return []; }
  }
  function saveLocalScore(entry) {
    const arr = loadLocalScores();
    arr.push(entry);
    arr.sort((a,b)=> b.score - a.score);
    arr.splice(50);
    localStorage.setItem(DAY1_KEY, JSON.stringify(arr));
  }

  async function submitScoreToFirestore(entry) {
    if (!window.firebaseReady || !window.firebaseDb || !window.firebaseSetDoc || !window.firebaseDoc) return;
    try {
      const id = `${Date.now()}_${entry.uid||'anon'}`;
      const docRef = window.firebaseDoc(window.firebaseDb, 'day1_scores', id);
      await window.firebaseSetDoc(docRef, entry);
    } catch (err) {
      console.error('Failed to submit score to Firestore', err);
    }
  }

  // show day leaderboard modal
  async function openDayLeaderboard() {
    dayLeaderboardBody.innerHTML = '<tr><td colspan="5">Loading…</td></tr>';
    dayLeaderboardModal.classList.remove('hidden');

    // load local first
    const local = loadLocalScores().slice(0,20);
    // also query Firestore
    let remote = [];
    if (window.firebaseReady && window.firebaseGetDocs && window.firebaseQuery && window.firebaseCollection && window.firebaseOrderBy) {
      try {
        const q = window.firebaseQuery(window.firebaseCollection(window.firebaseDb,'day1_scores'), window.firebaseOrderBy('score','desc'));
        const snap = await window.firebaseGetDocs(q);
        snap.forEach(d => {
          const data = d.data();
          remote.push(data);
        });
      } catch (e) {
        console.warn('Could not load remote day1 scores', e);
      }
    }
    // merge top remote/local (remote likely has duplicates of local entries saved)
    const merged = [...remote, ...local];
    merged.sort((a,b)=> (b.score||0)-(a.score||0));
    const rows = merged.slice(0,30).map((r,idx) => {
      const when = new Date(r.ts).toLocaleString();
      const within = (r.withinEvent) ? 'Yes' : 'No';
      const name = r.playerName || (r.uid ? r.uid : 'Anonymous');
      return `<tr><td>${idx+1}</td><td>${escapeHtml(name)}</td><td>${r.score}</td><td>${when}</td><td>${within}</td></tr>`;
    });
    if (rows.length === 0) {
      dayLeaderboardBody.innerHTML = '<tr><td colspan="5">No scores yet</td></tr>';
    } else {
      dayLeaderboardBody.innerHTML = rows.join('');
    }
  }

  // Save when player decides
  async function handleSubmitScore() {
    const playerName = (window.userData && window.userData.username) ? window.userData.username : (window.currentUser && window.currentUser.email ? window.currentUser.email.split('@')[0] : 'Anonymous');
    const uid = window.currentUser && window.currentUser.uid ? window.currentUser.uid : null;
    const entry = {
      score,
      playerName,
      uid,
      ts: Date.now(),
      withinEvent: Date.now() <= GAME_END_TS
    };
    // save locally always
    saveLocalScore(entry);
    // save remote day1 collection
    await submitScoreToFirestore(entry);
    // if within event and user signed in, also write to main leaderboard (collection 'users' logic used by index)
    if (entry.withinEvent && window.firebaseReady && uid && window.firebaseDoc && window.firebaseSetDoc && window.firebaseGetDoc) {
      try {
        const userDoc = window.firebaseDoc(window.firebaseDb, 'users', uid);
        const snapshot = await window.firebaseGetDoc(userDoc);
        let docData = {};
        if (snapshot && snapshot.exists && snapshot.exists()) {
          docData = snapshot.data();
          // update day1 score and totals
          if (!docData.scores) docData.scores = {};
        } else {
          // build a minimal user doc
          docData = { username: playerName, email: (window.currentUser && window.currentUser.email) || '', createdAt: new Date(), scores: { day1: 0, day2:0, day3:0, day4:0, day5:0, total:0 }};
        }
        docData.scores.day1 = Math.max(docData.scores.day1 || 0, score);
        // recalc total
        const s = docData.scores;
        docData.scores.total = (s.day1||0)+(s.day2||0)+(s.day3||0)+(s.day4||0)+(s.day5||0);
        await window.firebaseSetDoc(userDoc, docData);
      } catch (e) {
        console.warn('Failed to update main leaderboard user doc', e);
      }
    }
    gameOverModal.classList.add('hidden');
  }

  // small helper
  function escapeHtml(str='') {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[s]));
  }

  // help / interactive demo
  function openHelp() {
    helpModal.classList.remove('hidden');
    helpInteractive.innerHTML = `<div style="color:#ffd8a8">Use Arrow keys (or touch left/right) to move. Land on glowing springs for big jump. Breaking platforms will crumble. Jetpack platforms give huge boost. Avoid blackholes and spooky enemies.</div>`;
  }

  // UI wiring
  helpBtn.addEventListener('click', openHelp);
  helpClose.addEventListener('click', ()=> helpModal.classList.add('hidden'));
  helpStep.addEventListener('click', ()=> {
    helpInteractive.innerHTML = `<div style="margin-top:8px;"><button class="btn-primary" id="demo-jump">Simulate Jump</button> <button class="btn-secondary" id="demo-break">Show Breaking Platform</button></div>`;
    document.getElementById('demo-jump').addEventListener('click', ()=> {
      // quick visual demo inside modal: animate little canvas
      helpInteractive.innerHTML += `<div style="margin-top:8px;color:#ffb86b">Press arrows during play to move. This demo only shows explanation.</div>`;
    });
  });

  dayLeaderboardBtn.addEventListener('click', openDayLeaderboard);
  dayLeaderboardClose.addEventListener('click', ()=> dayLeaderboardModal.classList.add('hidden'));

  submitScoreBtn.addEventListener('click', async ()=> {
    await handleSubmitScore();
  });

  retryBtn.addEventListener('click', ()=> {
    gameOverModal.classList.add('hidden');
    startGame();
  });

  // scary toggle persistence
  if (scaryToggle) {
    scaryToggle.checked = scaryMode;
    scaryToggle.addEventListener('change', (e) => {
      scaryMode = !!e.target.checked;
      localStorage.setItem('day1Scary', scaryMode ? 'true' : 'false');
      if (scaryMode) playCreepyTone();
    });
  }

  // initialize and spawn
  spawnInitial();
  startGame();
  updateTimers();
  setInterval(updateTimers, 1000);

  // periodically spawn enemies
  setInterval(()=> {
    if (!running) return;
    if (Math.random() < 0.25) {
      enemies.push({ x: Math.random()*(W-40), y: Math.random()*H/2, w: 28, h: 28, osc: 2 + Math.random()*4, seed: Math.random()*1000 });
    }
  }, 4200);

  // expose debug start/stop for console
  window.day1 = { startGame, killPlayer };

  // integrate firebase auth UI usage (index.html attaches globals)
  function tryAttachUser() {
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay && window.userData && window.userData.username) {
      usernameDisplay.textContent = window.userData.username;
      document.getElementById('user-info').classList.remove('hidden');
      document.getElementById('sign-in-btn').classList.add('hidden');
    }
  }
  // attempt to attach user info if firebase already initialized
  if (window.firebaseReady) {
    tryAttachUser();
  } else {
    document.addEventListener('DOMContentLoaded', tryAttachUser);
  }

  // ensure UI cleans resources on unload
  window.addEventListener('beforeunload', ()=> {
    cancelAnimationFrame(animationId);
  });
})();