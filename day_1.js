/*
  Updated Day 1 game script
  - fixed platform stacking and softlock issues
  - spawn fewer enemies (rare)
  - removed pumpkin pickups, keep Halloween Jetpack and Witch Hat
  - staged difficulty: easier near start, more hazards later (but always solvable)
  - fullscreen toggles only the playbound
  - better save flow with error reporting
  - background initialization for eyes/moving bits
*/

(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // central HUD element (centered on playbound)
  const bigScoreEl = document.getElementById('big-score');

  // top timer (keeps the only countdown)
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
  const playbound = document.getElementById('playbound');
  const backgroundRoot = document.getElementById('background');

  const W = canvas.width;
  const H = canvas.height;
  const GRAVITY = 0.45;
  const PLAYER_SIZE = 28;
  const SCROLL_THRESHOLD = H * 0.42;
  const JUMP_VEL = -12;

  let platforms = [];
  let enemies = [];
  let blackholes = [];
  let pickups = []; // only jetpack / hat remain
  let player = null;
  let keys = { left: false, right: false };
  let score = 0;
  let running = false;
  let scaryMode = localStorage.getItem('day1Scary') === 'true';
  let lastTime = performance.now();
  let animationId = null;
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
    if (!gameTimerHeader) return;
    const left = GAME_END_TS - Date.now();
    gameTimerHeader.textContent = left <= 0 ? 'Game Ended' : formatTimeRemaining(left);
  }

  // audio helpers (same pattern as index)
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
  function glitchFreezeBrief() { frozen = true; setTimeout(()=> { frozen = false; }, 400 + Math.random()*700); }
  function doJumpscareBig() { if (!scaryMode) return; dayJumpscareImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='1000' viewBox='0 0 1000 1000'%3E%3Crect width='1000' height='1000' fill='%23000'/%3E%3Ctext x='500' y='520' font-size='140' fill='%23ff0000' text-anchor='middle' font-family='Creepster, Arial' font-weight='700'%3ESCREAM%3C/text%3E%3C/svg%3E"; dayJumpscare.classList.remove('hidden'); playScreamLoud(); setTimeout(()=> dayJumpscare.classList.add('hidden'), 1400); }

  function createPlayer() {
    return { x: W/2 - PLAYER_SIZE/2, y: H - 100, vx: 0, vy: 0, w: PLAYER_SIZE, h: PLAYER_SIZE, alive: true, yTop: H };
  }

  function createPlatform(x,y,type='static') {
    // ensure platform inside bounds and not overlapping existing in y too-close
    const w = 70 + Math.random()*60;
    const px = Math.max(8, Math.min(W - w - 8, Math.round(x)));
    const p = { x: px, y: Math.round(y), w, h: 12, type, used:false, toRemove:false };
    if (type === 'moving') { p.vx = (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random()*1.0); p.minX = Math.max(6, p.x-70); p.maxX = Math.min(W - p.w - 6, p.x+70); }
    return p;
  }

  function spawnInitial() {
    platforms = [];
    enemies = [];
    blackholes = [];
    pickups = [];
    let y = H - 20;
    platforms.push(createPlatform(W/2 - 50, y, 'static'));

    // more safe platforms near start, then progressively harder
    for (let i=1;i<18;i++) {
      // gradually increase vertical spacing slightly with index
      y -= (48 + Math.random()*32); // decreased gap to avoid softlock, fits single page
      // decide type based on height/stage
      let type = 'static';
      if (i < 4) {
        // early: mostly safe
        const r = Math.random();
        if (r < 0.06) type = 'spring';
        if (r < 0.02) type = 'moving';
      } else if (i < 10) {
        // mid: introduce break and moving
        const r = Math.random();
        if (r < 0.14) type = 'break';
        else if (r < 0.26) type = 'moving';
        else if (r < 0.36) type = 'spring';
        else type = 'static';
      } else {
        // higher: more hazards but still solvable
        const r = Math.random();
        if (r < 0.22) type = 'break';
        else if (r < 0.36) type = 'moving';
        else if (r < 0.46) type = 'spring';
        else if (r < 0.56) type = 'jet'; // jet platform gives big boost
        else type = 'static';
      }

      // create platform and ensure not colliding vertically with others
      let x = Math.random()*(W - 90);
      let p = createPlatform(x, y, type);
      // avoid stacking: nudge x until not overlapping a nearby platform at same y-range
      for (let k=0;k<10;k++) {
        const collision = platforms.some(q => Math.abs(q.y - p.y) < 18 && Math.abs(q.x - p.x) < Math.max(40, (q.w+p.w)/2));
        if (!collision) break;
        p.x = Math.random()*(W - p.w - 16);
      }
      platforms.push(p);

      // enemies spawn rarely and only in higher tiers
      if (i >= 6 && Math.random() < 0.08) { // spawn less enemies (rare)
        enemies.push({ x: Math.random()*(W-40), y: p.y - 28, w: 28, h: 28, rowY: p.y - 28, seed: Math.random()*1000, type:'ghost' });
      }

      // jetpack / hat pickups are rarer; keep halloween naming
      if (Math.random() < 0.06) {
        pickups.push({ kind: Math.random() < 0.6 ? 'jetpack' : 'hat', x: Math.max(10,p.x + Math.random()*(p.w-20)), y: p.y - 28, picked:false });
      }

      // blackholes very rare
      if (Math.random() < 0.04 && i > 6) blackholes.push({ x: Math.random()*(W-60), y: y - 24, r: 20 });
    }

    // final anti-softlock sweep
    ensureNoSoftlock();
    // keep platforms sorted by y ascending (smaller y = higher on screen)
    platforms.sort((a,b)=> a.y - b.y);
  }

  function ensureNoSoftlock() {
    // ensure each ~120px band has at least one safe (non-break) platform
    const bandMap = {};
    platforms.forEach(p => {
      const k = Math.floor(p.y / 120);
      bandMap[k] = bandMap[k] || [];
      bandMap[k].push(p);
    });
    Object.values(bandMap).forEach(band => {
      const hasSafe = band.some(p => p.type !== 'break');
      if (!hasSafe && band.length > 0) {
        band[0].type = 'static';
      }
    });

    // ensure vertical gaps never exceed reachable threshold
    const maxJump = Math.abs(JUMP_VEL) * 7 + 80;
    platforms.sort((a,b)=> a.y - b.y);
    for (let i=1;i<platforms.length;i++) {
      const dy = Math.abs(platforms[i].y - platforms[i-1].y);
      if (dy > maxJump) {
        const newY = Math.round((platforms[i].y + platforms[i-1].y)/2);
        // pick an x away from neighbors
        let nx = Math.min(Math.max(20, platforms[i-1].x + 40), W - 120);
        let newP = createPlatform(nx, newY, 'static');
        // ensure no heavy overlap
        let tries = 0;
        while (platforms.some(q => Math.abs(q.y - newP.y) < 18 && Math.abs(q.x - newP.x) < Math.max(40, (q.w+newP.w)/2)) && tries++ < 8) {
          newP.x = Math.random()*(W - newP.w - 16);
        }
        platforms.push(newP);
      }
    }
    // re-sort
    platforms.sort((a,b)=> a.y - b.y);
  }

  function rectsOverlap(a,b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // input
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'f' && document.fullscreenEnabled) toggleFullscreen();
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    if (t.clientX < window.innerWidth/2) { keys.left = true; keys.right = false; }
    else { keys.right = true; keys.left = false; }
  }, { passive:true });
  canvas.addEventListener('touchend', () => { keys.left = keys.right = false; });

  function update(dt) {
    if (!player || !player.alive || frozen) return;

    // flight handling (jetpack/hat)
    if (flightTimer > 0) {
      player.vy -= 0.28;
      flightTimer -= dt * 0.016666;
    }

    if (keys.left) player.vx -= 0.6;
    if (keys.right) player.vx += 0.6;
    player.vx *= 0.96;

    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    // wrap horizontally
    if (player.x > W) player.x = -player.w;
    if (player.x + player.w < 0) player.x = W - 1;

    // move moving platforms
    platforms.forEach(p => {
      if (p.type === 'moving') {
        p.x += p.vx * (dt/16.666);
        if (p.x < p.minX || p.x > p.maxX) { p.vx *= -1; p.x = Math.max(p.minX, Math.min(p.x, p.maxX)); }
      }
    });

    // landing
    if (player.vy > 0) {
      platforms.forEach(p => {
        const platRect = { x: p.x, y: p.y, w: p.w, h: p.h };
        const playerFoot = { x: player.x, y: player.y + player.h, w: player.w, h: 6 };
        if (rectsOverlap(playerFoot, platRect) && (player.y + player.h - player.vy) <= p.y + 3) {
          if (p.type === 'break') {
            // only break if there is a reachable safe above
            const reachable = platforms.some(q => q !== p && (q.type !== 'break') && (q.y < p.y) && (p.y - q.y) < 180);
            if (!reachable) {
              p.type = 'static';
            } else {
              player.vy = -9;
              p.toRemove = true;
            }
          } else if (p.type === 'spring') {
            player.vy = -18;
            p.used = true;
          } else if (p.type === 'jet') {
            // this platform acts like a booster
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

    // pickup collisions (only jetpack/hat remain)
    pickups.forEach(it => {
      if (!it.picked && rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, {x:it.x,y:it.y,w:20,h:20})) {
        it.picked = true;
        if (it.kind === 'jetpack') {
          flightTimer = Math.max(flightTimer, 3.2); // strong
          score += 30;
        } else if (it.kind === 'hat') {
          flightTimer = Math.max(flightTimer, 1.8); // weaker
          score += 18;
        }
      }
    });

    // enemies (oscillate a bit but stay in their row)
    enemies.forEach(e => {
      e.x += Math.sin((Date.now() + e.seed) / 800) * 0.4;
      if (rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, {x:e.x,y:e.y,w:e.w,h:e.h})) {
        killPlayer('enemy');
      }
    });

    // blackhole collision
    blackholes.forEach(b => {
      const px = player.x + player.w/2, py = player.y + player.h/2;
      const cx = b.x + b.r, cy = b.y + b.r;
      const dx = px - cx, dy = py - cy;
      if (dx*dx + dy*dy < (b.r + player.w/4)*(b.r + player.w/4)) killPlayer('blackhole');
    });

    // scroll world if player high
    if (player.y < SCROLL_THRESHOLD) {
      const dy = Math.floor(SCROLL_THRESHOLD - player.y);
      player.y = SCROLL_THRESHOLD;
      platforms.forEach(p => p.y += dy);
      enemies.forEach(e => e.y += dy);
      blackholes.forEach(b => b.y += dy);
      pickups.forEach(it => it.y += dy);
      score += Math.floor(dy/8);
    }

    // fall death
    if (player.y > H + 160) killPlayer('fall');

    // runtime anti-softlock
    antiSoftlockRuntime();
  }

  function antiSoftlockRuntime() {
    if (!player) return;
    const dangerZone = platforms.filter(p => p.y > player.y - 40 && p.y < player.y + 240);
    const hasSafe = dangerZone.some(p => p.type !== 'break');
    if (!hasSafe) {
      const y = Math.round(player.y - 140);
      let nx = Math.min(Math.max(40, player.x + 40), W-120);
      let np = createPlatform(nx, y, 'static');
      // prevent overlap with existing near y
      let tries = 0;
      while (platforms.some(q => Math.abs(q.y - np.y) < 18 && Math.abs(q.x - np.x) < Math.max(40, (q.w+np.w)/2)) && tries++ < 8) {
        np.x = Math.random()*(W - np.w - 16);
      }
      platforms.push(np);
    }
  }

  function drawBackground(nowTimeSec) {
    if (!backgroundRoot) return;
    // draw eyes and drifting shapes into the #background element if not already present
    if (!backgroundRoot.dataset.initted) {
      backgroundRoot.dataset.initted = '1';
      // add a few blinking eyes
      for (let i=0;i<4;i++) {
        const el = document.createElement('div');
        el.className = 'eye scary-mode';
        el.style.left = `${10 + i*22}%`;
        el.style.top = `${6 + (i%2)*6}%`;
        el.style.animationDelay = `${i*0.6}s`;
        backgroundRoot.appendChild(el);
      }
      // add a subtle fog
      for (let i=0;i<2;i++) {
        const fog = document.createElement('div');
        fog.className = 'fog';
        fog.style.left = `${-150 + i*180}px`;
        fog.style.top = `${20 + i*25}%`;
        backgroundRoot.appendChild(fog);
      }
    }
  }

  function draw(nowTime) {
    // clear canvas
    ctx.clearRect(0,0,W,H);

    // background gradient
    const bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0, '#080306');
    bg.addColorStop(1, '#0f0305');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,W,H);

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

    // pickups (jetpack/hat)
    pickups.forEach(it => {
      if (it.picked) return;
      if (it.kind === 'jetpack') {
        ctx.fillStyle = '#7bdfff';
        ctx.fillRect(it.x, it.y, 20, 16);
        ctx.fillStyle = '#000';
        ctx.fillRect(it.x+3, it.y+3, 3, 10);
        ctx.fillRect(it.x+13, it.y+3, 3, 10);
      } else if (it.kind === 'hat') {
        ctx.fillStyle = '#aa33aa';
        ctx.beginPath();
        ctx.moveTo(it.x, it.y+12);
        ctx.lineTo(it.x+10, it.y);
        ctx.lineTo(it.x+20, it.y+12);
        ctx.fill();
      }
    });

    // enemies
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

    // small scary glitch overlay occasionally in scary mode
    if (scaryMode && Math.random() < 0.002) {
      ctx.fillStyle = 'rgba(255,0,0,0.06)';
      ctx.fillRect(0, Math.random()*H, W, 4 + Math.random()*40);
    }
  }

  function loop(nowTime) {
    const dt = Math.min(32, nowTime - lastTime);
    lastTime = nowTime;
    drawBackground(nowTime / 1000);
    draw(nowTime / 1000);
    if (running) {
      update(dt/16.666);
      bigScoreEl && (bigScoreEl.textContent = `Score: ${score}`);
      updateTimers();
    }
    animationId = requestAnimationFrame(loop);
  }

  function killPlayer(reason) {
    if (!player || !player.alive) return;
    player.alive = false;
    running = false;
    finalScoreEl.textContent = score;
    const within = Date.now() <= GAME_END_TS;
    submitNote.textContent = within ? 'This score is within the event window and can be submitted to the main leaderboard.' : 'Event window ended — score will be recorded in the day leaderboard only.';
    gameOverModal.classList.remove('hidden');

    if (scaryMode) { doJumpscareBig(); if (Math.random() < 0.6) glitchFreezeBrief(); }
  }

  // start / reset
  function startGame() {
    if (running) return;
    spawnInitial();
    player = createPlayer();
    score = 0;
    running = true;
    lastTime = performance.now();
    if (!animationId) animationId = requestAnimationFrame(loop);
    playOverlay && playOverlay.classList.add('hidden');
  }

  function resetToPlayOnly() {
    gameOverModal.classList.add('hidden');
    playOverlay.classList.remove('hidden');
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    running = false;
  }

  // leaderboard persistence & submission (with improved error feedback)
  const DAY1_KEY = 'day1_local_scores_v3';
  function loadLocalScores() { try { return JSON.parse(localStorage.getItem(DAY1_KEY) || '[]'); } catch (e) { return []; } }
  function saveLocalScore(entry) { const arr = loadLocalScores(); arr.push(entry); arr.sort((a,b)=> b.score - a.score); arr.splice(50); localStorage.setItem(DAY1_KEY, JSON.stringify(arr)); }

  async function submitScoreToFirestoreDocs(entry) {
    try {
      if (!window.firebaseReady || !window.firebaseDb || !window.firebaseSetDoc || !window.firebaseDoc) {
        console.warn('Firebase not available; skipping remote save.');
        return { ok: false, reason: 'no-firebase' };
      }
      const id = `${Date.now()}_${entry.uid||'anon'}`;
      const docRef = window.firebaseDoc(window.firebaseDb, 'day1_scores', id);
      await window.firebaseSetDoc(docRef, entry);
      // update user's main doc if signed in and within event
      if (entry.withinEvent && window.currentUser && window.currentUser.uid && window.firebaseGetDoc) {
        const userDoc = window.firebaseDoc(window.firebaseDb, 'users', window.currentUser.uid);
        const snapshot = await window.firebaseGetDoc(userDoc);
        let docData = {};
        if (snapshot && snapshot.exists && snapshot.exists()) {
          docData = snapshot.data();
        } else {
          docData = { username: entry.playerName, email: (window.currentUser && window.currentUser.email) || '', createdAt: new Date(), scores: { day1:0,day2:0,day3:0,day4:0,day5:0, total:0 } };
        }
        docData.scores = docData.scores || {};
        docData.scores.day1 = Math.max(docData.scores.day1 || 0, entry.score);
        const s = docData.scores;
        docData.scores.total = (s.day1||0)+(s.day2||0)+(s.day3||0)+(s.day4||0)+(s.day5||0);
        await window.firebaseSetDoc(userDoc, docData);
      }
      return { ok: true };
    } catch (err) {
      console.error('Failed to submit score to Firestore:', err);
      return { ok: false, reason: err && err.message ? err.message : 'unknown' };
    }
  }

  // Save flow
  async function handleSubmitScore() {
    const uid = window.currentUser && window.currentUser.uid ? window.currentUser.uid : null;
    const name = (window.userData && window.userData.username) ? window.userData.username : (window.currentUser && window.currentUser.email ? window.currentUser.email.split('@')[0] : 'Anonymous');
    const entry = { score, playerName: name, uid, ts: Date.now(), withinEvent: Date.now() <= GAME_END_TS };
    saveLocalScore(entry);

    if (!uid) {
      pendingSaveEntry = entry;
      const loginModal = document.getElementById('login-modal');
      if (loginModal) loginModal.classList.remove('hidden');
      // show feedback to user
      alert('Sign in is required to save to the main leaderboard. Please sign in and the save will continue automatically.');
      return;
    }

    const res = await submitScoreToFirestoreDocs(entry);
    if (!res.ok) {
      alert('Saving score failed: ' + (res.reason || 'unknown') + '. Your score was saved locally.');
    } else {
      alert('Score saved.');
    }
    gameOverModal.classList.add('hidden');
    playOverlay.classList.remove('hidden');
  }

  // process pending save after login
  if (window.firebaseOnAuthStateChanged && window.firebaseAuth) {
    window.firebaseOnAuthStateChanged(window.firebaseAuth, async (user) => {
      if (user && pendingSaveEntry) {
        pendingSaveEntry.uid = user.uid;
        pendingSaveEntry.playerName = (window.userData && window.userData.username) ? window.userData.username : (user.email ? user.email.split('@')[0] : 'User');
        const r = await submitScoreToFirestoreDocs(pendingSaveEntry);
        if (!r.ok) alert('Auto-save after sign in failed: ' + (r.reason || 'unknown'));
        pendingSaveEntry = null;
        gameOverModal.classList.add('hidden');
        playOverlay.classList.remove('hidden');
      }
    });
  }

  // Day leaderboard viewing
  async function openDayLeaderboard() {
    dayLeaderboardBody.innerHTML = '<tr><td colspan="5">Loading…</td></tr>';
    dayLeaderboardModal.classList.remove('hidden');

    const local = loadLocalScores().slice(0,40);
    let remote = [];
    if (window.firebaseReady && window.firebaseGetDocs && window.firebaseQuery && window.firebaseCollection && window.firebaseOrderBy) {
      try {
        const q = window.firebaseQuery(window.firebaseCollection(window.firebaseDb,'day1_scores'), window.firebaseOrderBy('score','desc'));
        const snap = await window.firebaseGetDocs(q);
        snap.forEach(d => remote.push(d.data()));
      } catch (e) { console.warn('Failed to load remote day1 scores', e); }
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

  function escapeHtml(str='') { return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[s])); }

  // UI wiring
  dayLeaderboardBtn && dayLeaderboardBtn.addEventListener('click', openDayLeaderboard);
  dayLeaderboardClose && dayLeaderboardClose.addEventListener('click', ()=> dayLeaderboardModal.classList.add('hidden'));
  submitScoreBtn && submitScoreBtn.addEventListener('click', handleSubmitScore);
  retryBtn && retryBtn.addEventListener('click', ()=> { gameOverModal.classList.add('hidden'); playOverlay.classList.remove('hidden'); });

  helpBtn && helpBtn.addEventListener('click', ()=> helpModal.classList.remove('hidden'));
  helpClose && helpClose.addEventListener('click', ()=> helpModal.classList.add('hidden'));
  helpStep && helpStep.addEventListener('click', ()=> { helpInteractive.innerHTML = `<div style="color:#ffd8a8">Controls: ← → to move. Tap left/right on mobile. Halloween Jetpack gives long flight, Witch Hat gives short flight. Avoid blackholes & enemies.</div>`; });

  playBtn && playBtn.addEventListener('click', () => startGame());
  playCancel && playCancel.addEventListener('click', () => playOverlay.classList.add('hidden'));

  // fullscreen only for playbound
  let isFull = false;
  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await playbound.requestFullscreen();
        fullscreenBtn && (fullscreenBtn.textContent = '⤢');
        isFull = true;
      } else {
        await document.exitFullscreen();
        fullscreenBtn && (fullscreenBtn.textContent = '⤢');
        isFull = false;
      }
    } catch (e) { /* ignore */ }
  }
  fullscreenBtn && fullscreenBtn.addEventListener('click', toggleFullscreen);

  // scary toggle
  if (scaryToggle) {
    scaryToggle.checked = scaryMode;
    scaryToggle.addEventListener('change', () => {
      scaryMode = scaryToggle.checked;
      localStorage.setItem('day1Scary', scaryMode ? 'true' : 'false');
      if (scaryMode && Math.random() < 0.6) playScreamLoud();
    });
  }

  // background init (eyes/fog) - reuse small set if index didn't run
  function initBackgroundElements() {
    if (!backgroundRoot) return;
    // add a few eyes and fog if not already
    if (!backgroundRoot.dataset.ready) {
      backgroundRoot.dataset.ready = '1';
      for (let i=0;i<3;i++) {
        const e = document.createElement('div'); e.className = 'eye'; e.style.left = `${10 + i*28}%`; e.style.top = `${6 + (i%2)*5}%`; backgroundRoot.appendChild(e);
      }
      for (let i=0;i<2;i++) {
        const f = document.createElement('div'); f.className = 'fog'; f.style.left = `${-150 + i*220}px`; f.style.top = `${20 + i*20}%`; backgroundRoot.appendChild(f);
      }
    }
  }

  initBackgroundElements();

  // start loop but not game
  lastTime = performance.now();
  animationId = requestAnimationFrame(loop);
  updateTimers();
  setInterval(updateTimers, 1000);

  // expose debug
  window.day1 = { startGame, killPlayer, resetToPlayOnly };

  // cleanup
  window.addEventListener('beforeunload', ()=> { if (animationId) cancelAnimationFrame(animationId); });

  if (playOverlay) playOverlay.classList.remove('hidden');
})();