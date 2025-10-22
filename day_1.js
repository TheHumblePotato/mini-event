/*
  Updated Day 1 game script
  - reduced vertical gaps to reduce distance between platforms
  - moving platforms, pumpkins, pickups (jetpack/flying hat)
  - stronger anti-softlock checks
  - game starts after Play click
  - no periodic enemy spawning; enemies spawn with levels and stay in their row
  - scary mode adds freezes/glitches and loud screams
  - save flow checks login and uses index page auth logic
  - fullscreen support
*/

(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const bigScoreEl = document.getElementById('big-score');
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
  const playOverlay = document.getElementById('play-overlay');
  const playBtn = document.getElementById('play-btn');
  const playCancel = document.getElementById('play-cancel');
  const fullscreenBtn = document.getElementById('fullscreen-btn');

  const W = canvas.width;
  const H = canvas.height;
  const GRAVITY = 0.45;
  const PLAYER_SIZE = 28;
  const SCROLL_THRESHOLD = H * 0.42;
  const JUMP_VEL = -12;

  let platforms = [];
  let enemies = [];
  let blackholes = [];
  let pickups = []; // pumpkins, jetpacks, hats
  let player = null;
  let keys = { left: false, right: false };
  let score = 0;
  let running = false;
  let scaryMode = localStorage.getItem('day1Scary') === 'true';
  let lastTime = performance.now();
  let animationId = null;
  let gameStartedOnce = false;
  let pendingSaveEntry = null;
  let frozen = false;
  let flightTimer = 0;

  // Event end time in Pacific (Oct 28 00:00 Pacific)
  const now = new Date();
  const year = now.getFullYear();
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
    const left = GAME_END_TS - Date.now();
    timerEl.textContent = left <= 0 ? 'Game Ended' : formatTimeRemaining(left);
    if (gameTimerHeader) gameTimerHeader.textContent = left <= 0 ? 'Game Ended' : formatTimeRemaining(left);
  }

  // audio helpers
  let audioCtx = null;
  function getAudioCtx() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); return audioCtx; }
  function playScreamLoud() {
    try {
      const ctx = getAudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(220, ctx.currentTime);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.8, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 1.25);
    } catch(e) {}
  }

  function glitchFreezeBrief() {
    frozen = true;
    setTimeout(()=> { frozen = false; }, 500 + Math.random()*700);
  }

  function doJumpscareBig() {
    if (!scaryMode) return;
    dayJumpscareImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='1000' viewBox='0 0 1000 1000'%3E%3Crect width='1000' height='1000' fill='%23000'/%3E%3Ctext x='500' y='520' font-size='140' fill='%23ff0000' text-anchor='middle' font-family='Creepster, Arial' font-weight='700'%3ESCREAM%3C/text%3E%3C/svg%3E";
    dayJumpscare.classList.remove('hidden');
    playScreamLoud();
    setTimeout(()=> dayJumpscare.classList.add('hidden'), 1400);
  }

  // game objects
  function createPlayer() {
    return { x: W/2 - PLAYER_SIZE/2, y: H - 100, vx: 0, vy: 0, w: PLAYER_SIZE, h: PLAYER_SIZE, alive: true, yTop: H };
  }

  function createPlatform(x,y,type='static') {
    const p = { x, y, w: 70 + Math.random()*60, h: 12, type, used:false };
    if (type === 'moving') { p.vx = (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random()*1.2); p.minX = Math.max(6, x-80); p.maxX = Math.min(W- p.w - 6, x+80); }
    return p;
  }

  function spawnInitial() {
    platforms = [];
    enemies = [];
    blackholes = [];
    pickups = [];

    // base platform
    let y = H - 20;
    platforms.push(createPlatform(W/2 - 50, y, 'static'));

    // create columns up to a high negative y to allow long play
    for (let i=1;i<12;i++) {
      // reduce vertical gaps compared to previous: smaller range
      y -= (60 + Math.random()*50); // decreased gap
      // ensure we don't create too many break platforms consecutively
      const r = Math.random();
      let type = 'static';
      if (r < 0.10) type = 'break';
      else if (r < 0.20) type = 'spring';
      else if (r < 0.28) type = 'jet';
      else if (r < 0.36) type = 'moving';
      else type = 'static';

      const p = createPlatform(Math.random()*(W - 90), y, type);
      platforms.push(p);

      // sometimes spawn an enemy in that row (enemies stay at that y)
      if (Math.random() < 0.22) {
        enemies.push({ x: Math.random()*(W-40), y: y - 24, w: 30, h: 30, rowY: y - 24, osc: 20 * Math.random(), seed: Math.random()*1000, type:'ghost' });
      }

      // sometimes spawn a pumpkin pickup
      if (Math.random() < 0.28) {
        pickups.push({ kind:'pumpkin', x: p.x + p.w/2 - 10 + (Math.random()*30-15), y: p.y - 24, picked:false, value: 50 });
      }

      // sometimes spawn a jetpack or hat
      if (Math.random() < 0.08) {
        pickups.push({ kind: Math.random() < 0.5 ? 'jetpack' : 'hat', x: Math.random()*(W-40), y: y - 28, picked:false, value: 0 });
      }

      // small chance for blackhole near row
      if (Math.random() < 0.06) blackholes.push({ x: Math.random()*(W-60), y: y - 40, r: 20 });

    }

    // Anti-softlock: ensure each vertical segment has at least one non-break static/moving/spring/jet platform
    ensureNoSoftlock();
  }

  function ensureNoSoftlock() {
    // group platforms by y band (every ~120px)
    const bands = {};
    platforms.forEach(p => {
      const key = Math.floor(p.y / 120);
      bands[key] = bands[key] || [];
      bands[key].push(p);
    });
    Object.keys(bands).forEach(k => {
      const band = bands[k];
      // if all platforms in a band are break, convert one to static
      const hasNonBreak = band.some(p => p.type !== 'break');
      if (!hasNonBreak && band.length > 0) {
        band[0].type = 'static';
      }
    });

    // extra check: ensure distance between consecutive reachable platforms <= maxJumpDistance
    const maxJump = Math.abs(JUMP_VEL) * 6 + 80; // generous
    platforms.sort((a,b)=> a.y - b.y);
    for (let i=1;i<platforms.length;i++) {
      const dy = Math.abs(platforms[i].y - platforms[i-1].y);
      if (dy > maxJump) {
        // insert a normal platform halfway
        const newY = (platforms[i].y + platforms[i-1].y)/2;
        platforms.push(createPlatform(Math.min(Math.max(40, platforms[i-1].x + 30), W-100), newY, 'static'));
      }
    }
  }

  // collisions
  function rectsOverlap(a,b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // input
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'f' && (document.fullscreenEnabled)) toggleFullscreen();
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  // touch controls
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    if (t.clientX < window.innerWidth/2) { keys.left = true; keys.right = false; }
    else { keys.right = true; keys.left = false; }
  }, {passive:true});
  canvas.addEventListener('touchend', () => { keys.left = keys.right = false; });

  function update(dt) {
    if (!player || !player.alive || frozen) return;

    // flight handling
    if (flightTimer > 0) {
      player.vy -= 0.26; // upward thrust while flight active
      flightTimer -= dt * 16.666 / 1000;
    }

    if (keys.left) player.vx -= 0.6;
    if (keys.right) player.vx += 0.6;
    player.vx *= 0.96;

    // apply gravity normally if not flying
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    // wrap horizontally
    if (player.x > W) player.x = -player.w;
    if (player.x + player.w < 0) player.x = W - 1;

    // moving platforms update
    platforms.forEach(p => {
      if (p.type === 'moving') {
        p.x += p.vx * (dt || 1);
        if (p.x < p.minX || p.x > p.maxX) {
          p.vx *= -1;
          p.x = Math.max(p.minX, Math.min(p.x, p.maxX));
        }
      }
    });

    // landing only if falling
    if (player.vy > 0) {
      platforms.forEach(p => {
        // allow collision with static/spring/jet/moving but not break if it already removed
        const platRect = { x: p.x, y: p.y, w: p.w, h: p.h };
        const playerFoot = { x: player.x, y: player.y + player.h, w: player.w, h: 6 };
        if (rectsOverlap(playerFoot, platRect) && (player.y + player.h - player.vy) <= p.y + 3) {
          if (p.type === 'break') {
            // ensure we don't softlock: only break if there's a reachable non-break above within range
            const reachable = platforms.some(q => q !== p && Math.abs(q.y - p.y) < 160 && q.type !== 'break');
            if (!reachable) {
              // convert to safe static platform
              p.type = 'static';
            } else {
              player.vy = -9;
              p.toRemove = true;
            }
          } else if (p.type === 'spring') {
            player.vy = -18;
            p.used = true;
          } else if (p.type === 'jet') {
            // small boost plus jetpack pickup
            player.vy = -28;
            p.used = true;
          } else {
            player.vy = JUMP_VEL + (-Math.random()*2);
          }
        }
      });
    }

    // remove broken
    platforms = platforms.filter(p => !p.toRemove);

    // pickups collision
    pickups.forEach(it => {
      if (!it.picked && rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, {x:it.x,y:it.y,w:20,h:20})) {
        it.picked = true;
        if (it.kind === 'pumpkin') {
          score += it.value;
        } else if (it.kind === 'jetpack') {
          // grant flight for some time
          flightTimer = Math.max(flightTimer, 2.5);
          score += 25;
        } else if (it.kind === 'hat') {
          flightTimer = Math.max(flightTimer, 1.6);
          score += 20;
        }
      }
    });

    // enemies: collide if overlap
    enemies.forEach(e => {
      // small horizontal oscillation but keep y fixed
      e.x += Math.sin((Date.now() + e.seed) / 1000) * 0.6;
      if (rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, {x:e.x,y:e.y,w:e.w,h:e.h})) {
        killPlayer('enemy');
      }
    });

    // blackhole collision by circle distance
    blackholes.forEach(b => {
      const px = player.x + player.w/2, py = player.y + player.h/2;
      const cx = b.x + b.r, cy = b.y + b.r;
      const dx = px - cx, dy = py - cy;
      if (dx*dx + dy*dy < (b.r + player.w/4)*(b.r + player.w/4)) killPlayer('blackhole');
    });

    // if player goes high enough, scroll world down
    if (player.y < SCROLL_THRESHOLD) {
      const dy = Math.floor(SCROLL_THRESHOLD - player.y);
      player.y = SCROLL_THRESHOLD;
      platforms.forEach(p => p.y += dy);
      enemies.forEach(e => e.y += dy);
      blackholes.forEach(b => b.y += dy);
      pickups.forEach(it => it.y += dy);
      score += Math.floor(dy/8);
    }

    // death if fall too far
    if (player.y > H + 160) killPlayer('fall');

    // anti-softlock during runtime: if there are too many break platforms near player and no safe escape, spawn a normal platform ahead
    antiSoftlockRuntime();
  }

  function antiSoftlockRuntime() {
    const dangerZone = platforms.filter(p => p.y > player.y - 40 && p.y < player.y + 240);
    // if all platforms within next 220px are break then add one static platform ahead
    const hasSafe = dangerZone.some(p => p.type !== 'break');
    if (!hasSafe) {
      const y = player.y - 140;
      platforms.push(createPlatform(Math.min(Math.max(40, player.x + 40), W-120), y, 'static'));
    }
  }

  function drawBackground(nowTime) {
    // moving background: subtle parallax with eyes and falling leaves
    // draw gradient
    const bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0, '#080306');
    bg.addColorStop(1, '#0f0305');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,W,H);

    // creepy eyes that occasionally open wide
    const t = nowTime / 1000;
    for (let i=0;i<3;i++) {
      const x = 60 + i * 160 + Math.sin(t * (0.2 + i*0.05)) * 18;
      const y = 60 + Math.cos(t * 0.15 + i) * 8;
      const open = (Math.sin(t * (0.8 + i*0.1)) + 1) * 0.5;
      const r = 8 + open * 18;
      const g = ctx.createRadialGradient(x, y, r*0.1, x, y, r*1.8);
      g.addColorStop(0, 'rgba(255,120,0,0.9)');
      g.addColorStop(1, 'rgba(120,0,0,0.0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r*0.6 + open*6, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#200';
      ctx.beginPath();
      ctx.arc(x + open*4, y, 4, 0, Math.PI*2);
      ctx.fill();
    }

    // falling leaves
    const leafCount = 16;
    for (let i=0;i<leafCount;i++) {
      const sx = (i*73 + Math.floor(t*60)) % (W+80) - 40;
      const sy = (i*47 + Math.floor(t*30)) % H;
      ctx.fillStyle = `rgba(${100 + (i*10)%155},${20},${0},0.12)`;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 6, 2 + (i%3), Math.sin((i+t)*0.5), 0, Math.PI*2);
      ctx.fill();
    }
  }

  function draw(nowTime) {
    drawBackground(nowTime);

    // blackholes
    blackholes.forEach(b => {
      const cx = b.x + b.r, cy = b.y + b.r;
      const rg = ctx.createRadialGradient(cx,cy,b.r*0.2,cx,cy,b.r*2);
      rg.addColorStop(0,'rgba(0,0,0,0.95)');
      rg.addColorStop(1,'rgba(80,0,0,0.0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(cx,cy,b.r*1.6,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx,cy,b.r,0,Math.PI*2);
      ctx.fill();
    });

    // platforms
    platforms.forEach(p => {
      if (p.type === 'break') ctx.fillStyle = '#491111';
      else if (p.type === 'spring') ctx.fillStyle = '#ffd86b';
      else if (p.type === 'jet') ctx.fillStyle = '#7fe0ff';
      else if (p.type === 'moving') ctx.fillStyle = '#bb7f3a';
      else ctx.fillStyle = '#884422';

      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    });

    // pickups
    pickups.forEach(it => {
      if (it.picked) return;
      if (it.kind === 'pumpkin') {
        // draw pumpkin
        ctx.fillStyle = '#ff8c00';
        ctx.beginPath();
        ctx.ellipse(it.x + 10, it.y + 10, 10, 8, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle='#4b2000';
        ctx.fillRect(it.x + 7, it.y + 4, 6, 6);
      } else if (it.kind === 'jetpack') {
        ctx.fillStyle = '#8be0ff';
        ctx.fillRect(it.x, it.y, 20, 16);
      } else if (it.kind === 'hat') {
        ctx.fillStyle = '#aa33aa';
        ctx.beginPath();
        ctx.moveTo(it.x, it.y+12);
        ctx.lineTo(it.x+10, it.y);
        ctx.lineTo(it.x+20, it.y+12);
        ctx.fill();
      }
    });

    // enemies (simple spooky boxes)
    enemies.forEach(e => {
      ctx.fillStyle = scaryMode ? '#6a0000' : '#ffffff';
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x + 5, e.y + 6, 6, 6);
      ctx.fillRect(e.x + e.w - 11, e.y + 6, 6, 6);
    });

    // player
    if (player) {
      ctx.fillStyle = scaryMode ? '#ff0000' : '#ffd86b';
      ctx.beginPath();
      ctx.ellipse(player.x + player.w/2, player.y + player.h/2, player.w/2, player.h/2, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(player.x + player.w*0.35, player.y + player.h*0.35, 3, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(player.x + player.w*0.65, player.y + player.h*0.35, 3, 0, Math.PI*2);
      ctx.fill();
    }

    // overlay glitch effect when scary mode random glitch active
    if (scaryMode && Math.random() < 0.003) {
      ctx.fillStyle = 'rgba(255,0,0,0.06)';
      ctx.fillRect(0, Math.random()*H, W, 4 + Math.random()*40);
    }
  }

  function loop(nowTime) {
    const dt = Math.min(32, nowTime - lastTime);
    lastTime = nowTime;
    if (running) {
      update(dt/16.666);
      draw(nowTime/1000);
      bigScoreEl.textContent = `Score: ${score}`;
      updateTimers();
    }
    animationId = requestAnimationFrame(loop);
  }

  // death
  function killPlayer(reason) {
    if (!player || !player.alive) return;
    player.alive = false;
    running = false;
    finalScoreEl.textContent = score;
    const within = Date.now() <= GAME_END_TS;
    submitNote.textContent = within ? 'This score is within the event window and can be submitted to the main leaderboard.' : 'Event window ended — score will be recorded in the day leaderboard only.';
    gameOverModal.classList.remove('hidden');

    if (scaryMode) {
      // loud scream + big jumpscare + occasional freeze
      doJumpscareBig();
      if (Math.random() < 0.6) glitchFreezeBrief();
    }
  }

  // start / reset handling
  function startGame() {
    if (running) return;
    spawnInitial();
    player = createPlayer();
    score = 0;
    running = true;
    lastTime = performance.now();
    if (!animationId) animationId = requestAnimationFrame(loop);
    playOverlay.classList.add('hidden');
    gameStartedOnce = true;
  }

  function resetToPlayOnly() {
    gameOverModal.classList.add('hidden');
    playOverlay.classList.remove('hidden');
    // keep a fresh canvas and state, don't auto-start
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    running = false;
  }

  // leaderboard persistence (local + Firestore)
  const DAY1_KEY = 'day1_local_scores_v2';
  function loadLocalScores() { try { return JSON.parse(localStorage.getItem(DAY1_KEY) || '[]'); } catch (e) { return []; } }
  function saveLocalScore(entry) { const arr = loadLocalScores(); arr.push(entry); arr.sort((a,b)=> b.score - a.score); arr.splice(50); localStorage.setItem(DAY1_KEY, JSON.stringify(arr)); }

  async function submitScoreToFirestoreDocs(entry) {
    if (!window.firebaseReady || !window.firebaseDb || !window.firebaseSetDoc || !window.firebaseDoc) return;
    try {
      // day1_scores collection
      const id = `${Date.now()}_${entry.uid||'anon'}`;
      const docRef = window.firebaseDoc(window.firebaseDb, 'day1_scores', id);
      await window.firebaseSetDoc(docRef, entry);
      // update user's main doc if signed in and within event
      if (entry.withinEvent && window.currentUser && window.currentUser.uid) {
        const userDoc = window.firebaseDoc(window.firebaseDb, 'users', window.currentUser.uid);
        const snapshot = await window.firebaseGetDoc(userDoc);
        let docData = {};
        if (snapshot && snapshot.exists && snapshot.exists()) docData = snapshot.data();
        else docData = { username: entry.playerName, email: (window.currentUser && window.currentUser.email) || '', createdAt: new Date(), scores: { day1:0,day2:0,day3:0,day4:0,day5:0, total:0 } };
        docData.scores = docData.scores || {};
        docData.scores.day1 = Math.max(docData.scores.day1 || 0, entry.score);
        const s = docData.scores;
        docData.scores.total = (s.day1||0)+(s.day2||0)+(s.day3||0)+(s.day4||0)+(s.day5||0);
        await window.firebaseSetDoc(userDoc, docData);
      }
    } catch (e) { console.warn('submit error', e); }
  }

  // Save flow: checks login; if not logged in ask to sign in and queue the save
  async function handleSubmitScore() {
    const uid = window.currentUser && window.currentUser.uid ? window.currentUser.uid : null;
    const name = (window.userData && window.userData.username) ? window.userData.username : (window.currentUser && window.currentUser.email ? window.currentUser.email.split('@')[0] : 'Anonymous');
    const entry = { score, playerName: name, uid, ts: Date.now(), withinEvent: Date.now() <= GAME_END_TS };

    // always save local
    saveLocalScore(entry);

    // if not logged in, prompt and queue
    if (!uid) {
      pendingSaveEntry = entry;
      // open login modal from index (it exists in DOM)
      const loginModal = document.getElementById('login-modal');
      if (loginModal) loginModal.classList.remove('hidden');
      return;
    }

    // submit remote copies
    await submitScoreToFirestoreDocs(entry);

    // after saving, reset to play overlay and let user press play again
    gameOverModal.classList.add('hidden');
    playOverlay.classList.remove('hidden');
  }

  // listen for firebase auth changes to process pending save
  if (window.firebaseOnAuthStateChanged && window.firebaseAuth) {
    window.firebaseOnAuthStateChanged(window.firebaseAuth, async (user) => {
      if (user && pendingSaveEntry) {
        // attach uid and username then submit
        pendingSaveEntry.uid = user.uid;
        pendingSaveEntry.playerName = (window.userData && window.userData.username) ? window.userData.username : (user.email ? user.email.split('@')[0] : 'User');
        await submitScoreToFirestoreDocs(pendingSaveEntry);
        pendingSaveEntry = null;
        gameOverModal.classList.add('hidden');
        playOverlay.classList.remove('hidden');
      }
    });
  }

  // day leaderboard viewing (re-uses existing code)
  async function openDayLeaderboard() {
    dayLeaderboardBody.innerHTML = '<tr><td colspan="5">Loading…</td></tr>';
    dayLeaderboardModal.classList.remove('hidden');

    const local = loadLocalScores().slice(0,20);
    let remote = [];
    if (window.firebaseReady && window.firebaseGetDocs && window.firebaseQuery && window.firebaseCollection && window.firebaseOrderBy) {
      try {
        const q = window.firebaseQuery(window.firebaseCollection(window.firebaseDb,'day1_scores'), window.firebaseOrderBy('score','desc'));
        const snap = await window.firebaseGetDocs(q);
        snap.forEach(d => remote.push(d.data()));
      } catch (e) { console.warn(e); }
    }
    const merged = [...remote, ...local].sort((a,b)=> (b.score||0)-(a.score||0));
    const rows = merged.slice(0,30).map((r,idx) => {
      const when = new Date(r.ts).toLocaleString();
      const within = r.withinEvent ? 'Yes' : 'No';
      const name = r.playerName || (r.uid ? r.uid : 'Anonymous');
      return `<tr class="${idx===0?'rank-1':idx===1?'rank-2':idx===2?'rank-3':''}"><td>${idx+1}</td><td>${escapeHtml(name)}</td><td>${r.score}</td><td>${when}</td><td>${within}</td></tr>`;
    });
    dayLeaderboardBody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="5">No scores yet</td></tr>';
  }

  // helpers
  function escapeHtml(str='') { return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[s])); }

  // UI wiring
  document.getElementById('day-leaderboard-btn').addEventListener('click', openDayLeaderboard);
  dayLeaderboardClose.addEventListener('click', ()=> dayLeaderboardModal.classList.add('hidden'));
  submitScoreBtn.addEventListener('click', handleSubmitScore);
  retryBtn.addEventListener('click', ()=> { gameOverModal.classList.add('hidden'); playOverlay.classList.remove('hidden'); });

  helpBtn.addEventListener('click', ()=> helpModal.classList.remove('hidden'));
  helpClose.addEventListener('click', ()=> helpModal.classList.add('hidden'));
  helpStep.addEventListener('click', ()=> {
    helpInteractive.innerHTML = `<div style="color:#ffd8a8">Controls: ← → to move. Tap left/right on mobile. Collect pumpkins for + points. Jetpack/hat allow short flight. Avoid blackholes & enemies.</div>`;
  });

  // Play overlay
  playBtn.addEventListener('click', () => { startGame(); });
  playCancel.addEventListener('click', () => { playOverlay.classList.add('hidden'); });

  // fullscreen
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(()=>{});
    } else {
      document.exitFullscreen().catch(()=>{});
    }
  }
  fullscreenBtn && fullscreenBtn.addEventListener('click', toggleFullscreen);

  // scary toggle
  if (scaryToggle) {
    scaryToggle.checked = scaryMode;
    scaryToggle.addEventListener('change', () => {
      scaryMode = scaryToggle.checked;
      localStorage.setItem('day1Scary', scaryMode ? 'true' : 'false');
      if (scaryMode && Math.random() < 0.8) playScreamLoud();
    });
  }

  // start loop but not game
  lastTime = performance.now();
  animationId = requestAnimationFrame(loop);
  updateTimers();
  setInterval(updateTimers, 1000);

  // remove legacy periodic enemy spawner (we don't spawn during runtime)

  // expose debug
  window.day1 = { startGame, killPlayer, resetToPlayOnly };

  // clean on unload
  window.addEventListener('beforeunload', ()=> { if (animationId) cancelAnimationFrame(animationId); });

  // initial: show play overlay
  if (playOverlay) playOverlay.classList.remove('hidden');
})();