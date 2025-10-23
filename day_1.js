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

(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const bigScoreEl = document.getElementById('big-score');
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

  // anti-softlock spawn throttle
  let lastAntiSoftlockAt = 0;
  const ANTI_SOFTLOCK_COOLDOWN = 800; // ms
  const MAX_PLATFORMS = 80;

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

    // staged level: many safe platforms early, then hazards later
    for (let i=1;i<22;i++) {
      // smaller gaps early, gradually increase a bit
      y -= Math.round(42 + Math.random()*36);
      let type = 'static';
      if (i < 5) {
        const r = Math.random();
        if (r < 0.08) type = 'spring';
        else if (r < 0.02) type = 'moving';
      } else if (i < 12) {
        const r = Math.random();
        if (r < 0.12) type = 'break';
        else if (r < 0.22) type = 'moving';
        else if (r < 0.32) type = 'spring';
      } else {
        const r = Math.random();
        if (r < 0.26) type = 'break';
        else if (r < 0.40) type = 'moving';
        else if (r < 0.50) type = 'spring';
        else if (r < 0.56) type = 'jet';
      }

      let x = Math.random()*(W - 90);
      let p = createPlatform(x, y, type);
      // nudge to avoid stacking (try a few times)
      for (let k=0;k<12;k++) {
        const collision = platforms.some(q => Math.abs(q.y - p.y) < 18 && Math.abs(q.x - p.x) < Math.max(40, (q.w+p.w)/2));
        if (!collision) break;
        p.x = Math.random()*(W - p.w - 16);
      }
      platforms.push(p);

      // enemies are rare
      if (i >= 8 && Math.random() < 0.06) {
        enemies.push({ x: Math.random()*(W-40), y: p.y - 28, w: 28, h: 28, rowY: p.y - 28, seed: Math.random()*1000, type:'ghost' });
      }

      // pickups (jetpack/hat) very rare
      if (Math.random() < 0.03) {
        pickups.push({ kind: Math.random() < 0.6 ? 'jetpack' : 'hat', x: Math.max(10,p.x + Math.random()*(p.w-20)), y: p.y - 34, picked:false });
      }

      // blackholes: very rare and only later
      if (i > 10 && Math.random() < 0.05) blackholes.push({ x: Math.random()*(W-60), y: y - 28, r: 24 });
    }

    ensureNoSoftlock();
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
        let nx = Math.min(Math.max(20, platforms[i-1].x + 40), W - 120);
        let newP = createPlatform(nx, newY, 'static');
        let tries = 0;
        while (platforms.some(q => Math.abs(q.y - newP.y) < 18 && Math.abs(q.x - newP.x) < Math.max(40, (q.w+newP.w)/2)) && tries++ < 10) {
          newP.x = Math.random()*(W - newP.w - 16);
        }
        platforms.push(newP);
      }
    }
    platforms.sort((a,b)=> a.y - b.y);
    // cap total platforms
    if (platforms.length > MAX_PLATFORMS) platforms = platforms.slice(0, MAX_PLATFORMS);
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

    if (flightTimer > 0) {
      player.vy -= 0.45; // much stronger thrust when flying
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

    // moving platforms
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
            const reachable = platforms.some(q => q !== p && (q.type !== 'break') && (q.y < p.y) && (p.y - q.y) < 180);
            if (!reachable) {
              p.type = 'static';
            } else {
              player.vy = -9;
              p.toRemove = true;
            }
          } else if (p.type === 'spring') {
            player.vy = -22; // stronger spring
            p.used = true;
          } else if (p.type === 'jet') {
            player.vy = -36; // jet platform huge boost
            p.used = true;
          } else {
            player.vy = JUMP_VEL + (-Math.random()*2);
          }
        }
      });
    }

    // remove broken
    platforms = platforms.filter(p => !p.toRemove);

    // pickups (jetpack/hat)
    pickups.forEach(it => {
      if (!it.picked && rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, {x:it.x,y:it.y,w:28,h:28})) {
        it.picked = true;
        if (it.kind === 'jetpack') {
          flightTimer = Math.max(flightTimer, 5.0); // very strong
          score += 50;
        } else if (it.kind === 'hat') {
          flightTimer = Math.max(flightTimer, 3.2);
          score += 35;
        }
      }
    });

    // enemies (very rare, stay in row)
    enemies.forEach(e => {
      e.x += Math.sin((Date.now() + e.seed) / 800) * 0.4;
      if (rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, {x:e.x,y:e.y,w:e.w,h:e.h})) {
        killPlayer('enemy');
      }
    });

    // blackhole collision (more visible / themed)
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

    // runtime anti-softlock (rate-limited)
    antiSoftlockRuntime();
  }

  {
  // --- replaced/added functions & small handler fixes to address spawn, save, retry, auth ---
  // runtime anti-softlock (rate-limited) + continuous generator
  function antiSoftlockRuntime() {
    if (!player) return;
    const nowTs = Date.now();
    if (nowTs - lastAntiSoftlockAt < ANTI_SOFTLOCK_COOLDOWN) return;

    // If there are very few platforms near player or none above the view, generate more above
    const dangerZone = platforms.filter(p => p.y > player.y - 40 && p.y < player.y + 240);
    const hasSafe = dangerZone.some(p => p.type !== 'break');
    if (!hasSafe) {
      const y = Math.round(player.y - 140);
      if (!platforms.some(p => Math.abs(p.y - y) < 22)) {
        let nx = Math.min(Math.max(40, player.x + 40), W - 120);
        let np = createPlatform(nx, y, 'static');
        let tries = 0;
        while (platforms.some(q => Math.abs(q.y - np.y) < 18 && Math.abs(q.x - np.x) < Math.max(40, (q.w+np.w)/2)) && tries++ < 8) {
          np.x = Math.random()*(W - np.w - 16);
        }
        platforms.push(np);
        trimPlatforms();
        lastAntiSoftlockAt = nowTs;
      }
    }
  }

  // ensure we always have enough platforms above view as player climbs
  function generatePlatformsAbove() {
    if (!player) return;
    // find current highest (min y)
    let minY = Infinity;
    platforms.forEach(p => { if (p.y < minY) minY = p.y; });
    if (minY === Infinity) minY = H - 20;

    // desired "coverage" above screen: keep generating until minY < -60 (i.e. we have platforms above viewport)
    let attempts = 0;
    while (minY > -80 && platforms.length < MAX_PLATFORMS && attempts++ < 40) {
      // create a new platform a bit above the current minY
      const gap = 36 + Math.random()*48;
      const newY = Math.round(minY - gap);
      const x = Math.random() * (W - 90);
      // difficulty progression: more hazards as score increases
      let type = 'static';
      const prog = Math.min(1, score / 800); // scale 0..1
      const r = Math.random();
      if (r < 0.08 + 0.2 * prog) type = 'break';
      else if (r < 0.18 + 0.2 * prog) type = 'moving';
      else if (r < 0.28) type = 'spring';
      else if (r < 0.30 + 0.06 * prog) type = 'jet';
      const p = createPlatform(x, newY, type);
      // avoid too-close vertical overlap
      if (!platforms.some(q => Math.abs(q.y - p.y) < 18 && Math.abs(q.x - p.x) < Math.max(40, (q.w+p.w)/2))) {
        platforms.push(p);
        minY = p.y;
      } else {
        // nudge and retry a few times
        let tries = 0;
        while (tries++ < 6 && platforms.some(q => Math.abs(q.y - p.y) < 18 && Math.abs(q.x - p.x) < Math.max(40, (q.w+p.w)/2))) {
          p.x = Math.random()*(W - p.w - 16);
        }
        platforms.push(p);
        minY = p.y;
      }

      // very rare pickups and blackholes spawn on some of the new platforms
      if (Math.random() < 0.015) {
        pickups.push({ kind: Math.random() < 0.6 ? 'jetpack' : 'hat', x: Math.max(10,p.x + Math.random()*(p.w-20)), y: p.y - 34, picked:false });
      }
      if (Math.random() < 0.02 && score > 60) {
        blackholes.push({ x: Math.random()*(W-60), y: newY - 28, r: 22 });
      }
    }

    trimPlatforms();
    platforms.sort((a,b)=> a.y - b.y);
  }

  // remove platforms that are far below the screen and cap total
  function trimPlatforms() {
    // remove those far below viewport
    platforms = platforms.filter(p => p.y < H + 200);
    // cap total to avoid runaway
    if (platforms.length > MAX_PLATFORMS) {
      // prefer to keep higher platforms (small y)
      platforms.sort((a,b)=> a.y - b.y);
      platforms = platforms.slice(0, MAX_PLATFORMS);
    }
  }

  // modify the scroll logic to generate above after scrolling
  // ... in update(), after scrolling block replace/add:
  // (This patch assumes the original scrolling code is present; we call generatePlatformsAbove() after scroll)
  // generatePlatformsAbove();
}
  // --- fix: submit score should check Firebase auth.currentUser (so being logged in on index.html is recognized) ---
  async function handleSubmitScore() {
    // prefer firebase auth current user
    const fbUser = (window.firebaseAuth && window.firebaseAuth.currentUser) ? window.firebaseAuth.currentUser : null;
    const uid = fbUser ? fbUser.uid : null;
    const name = (window.userData && window.userData.username) ? window.userData.username : (fbUser && fbUser.email ? fbUser.email.split('@')[0] : 'Anonymous');
    const entry = { score, playerName: name, uid, ts: Date.now(), withinEvent: Date.now() <= GAME_END_TS };

    if (!uid) {
      pendingSaveEntry = entry;
      // show the sign-in modal from index.html (if present)
      const loginModal = document.getElementById('login-modal');
      if (loginModal) loginModal.classList.remove('hidden');
      // Also request a fresh onAuthStateChanged callback in case firebase has user persisted but hasn't populated currentUser yet
      if (window.firebaseOnAuthStateChanged && window.firebaseAuth) {
        // attempt a one-time wait for auth
        const waitForAuth = new Promise((resolve) => {
          const off = window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
            off && off(); // unsubscribe if the API returns a function
            resolve(user);
          });
          // fallback timeout
          setTimeout(() => resolve(null), 1500);
        });
        const possibleUser = await waitForAuth;
        if (possibleUser) {
          // auto-submit if auth appears
          pendingSaveEntry.uid = possibleUser.uid;
          pendingSaveEntry.playerName = (window.userData && window.userData.username) ? window.userData.username : (possibleUser.email ? possibleUser.email.split('@')[0] : 'User');
          const r = await submitScoreToFirestoreDocs(pendingSaveEntry);
          if (!r.ok) alert('Auto-save after sign in failed: ' + (r.reason || 'unknown'));
          pendingSaveEntry = null;
          return;
        }
      }

      alert('Sign in is required to save to the main leaderboard. Please sign in via the modal and the save will complete automatically.');
      return;
    }

    const res = await submitScoreToFirestoreDocs(entry);
    if (!res.ok) {
      alert('Saving score failed: ' + (res.reason || 'unknown') + '.');
    } else {
      alert('Score saved.');
    }

    if (document.fullscreenElement === playbound) {
      // keep overlays hidden in fullscreen
    } else {
      gameOverModal.classList.add('hidden');
      playOverlay.classList.remove('hidden');
    }
  }
  // --- ensure retry/play again immediately restarts and hides overlays ---
  // replace retry handler wiring:
  retryBtn && retryBtn.addEventListener('click', ()=> {
    // hide overlays unconditionally then start
    if (gameOverModal) gameOverModal.classList.add('hidden');
    if (playOverlay) playOverlay.classList.add('hidden');
    // small delay to ensure DOM state cleared
    setTimeout(() => startGame(), 30);
  });

  // Also ensure play button immediately starts (already wired) but keep overlay hidden in fullscreen
  playBtn && playBtn.addEventListener('click', () => {
    if (document.fullscreenElement === playbound) {
      playOverlay && playOverlay.classList.add('hidden');
      gameOverModal && gameOverModal.classList.add('hidden');
    }
    startGame();
  });

  // Hook into the main loop scroll to generate above when player scrolls
  // We'll wrap the existing scroll behavior inside update() to call generatePlatformsAbove();
  // Find the place where scrolling occurs (player.y < SCROLL_THRESHOLD) and after the code block append:
  // generatePlatformsAbove();
  function update(dt) {
    if (!player || !player.alive || frozen) return;

    if (flightTimer > 0) {
      player.vy -= 0.45; // much stronger thrust when flying
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

    // moving platforms
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
            const reachable = platforms.some(q => q !== p && (q.type !== 'break') && (q.y < p.y) && (p.y - q.y) < 180);
            if (!reachable) {
              p.type = 'static';
            } else {
              player.vy = -9;
              p.toRemove = true;
            }
          } else if (p.type === 'spring') {
            player.vy = -22; // stronger spring
            p.used = true;
          } else if (p.type === 'jet') {
            player.vy = -36; // jet platform huge boost
            p.used = true;
          } else {
            player.vy = JUMP_VEL + (-Math.random()*2);
          }
        }
      });
    }

    // remove broken
    platforms = platforms.filter(p => !p.toRemove);

    // pickups (jetpack/hat)
    pickups.forEach(it => {
      if (!it.picked && rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, {x:it.x,y:it.y,w:28,h:28})) {
        it.picked = true;
        if (it.kind === 'jetpack') {
          flightTimer = Math.max(flightTimer, 5.0); // very strong
          score += 50;
        } else if (it.kind === 'hat') {
          flightTimer = Math.max(flightTimer, 3.2);
          score += 35;
        }
      }
    });

    // enemies (very rare, stay in row)
    enemies.forEach(e => {
      e.x += Math.sin((Date.now() + e.seed) / 800) * 0.4;
      if (rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, {x:e.x,y:e.y,w:e.w,h:e.h})) {
        killPlayer('enemy');
      }
    });

    // blackhole collision (more visible / themed)
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

    // runtime anti-softlock (rate-limited)
    antiSoftlockRuntime();
    generatePlatformsAbove();
  }

  function antiSoftlockRuntime() {
    if (!player) return;
    const nowTs = Date.now();
    if (nowTs - lastAntiSoftlockAt < ANTI_SOFTLOCK_COOLDOWN) return;

    // If there are very few platforms near player or none above the view, generate more above
    const dangerZone = platforms.filter(p => p.y > player.y - 40 && p.y < player.y + 240);
    const hasSafe = dangerZone.some(p => p.type !== 'break');
    if (!hasSafe) {
      const y = Math.round(player.y - 140);
      if (!platforms.some(p => Math.abs(p.y - y) < 22)) {
        let nx = Math.min(Math.max(40, player.x + 40), W - 120);
        let np = createPlatform(nx, y, 'static');
        let tries = 0;
        while (platforms.some(q => Math.abs(q.y - np.y) < 18 && Math.abs(q.x - np.x) < Math.max(40, (q.w+np.w)/2)) && tries++ < 8) {
          np.x = Math.random()*(W - np.w - 16);
        }
        platforms.push(np);
        trimPlatforms();
        lastAntiSoftlockAt = nowTs;
      }
    }
  }

  // ensure we always have enough platforms above view as player climbs
  function generatePlatformsAbove() {
    if (!player) return;
    // find current highest (min y)
    let minY = Infinity;
    platforms.forEach(p => { if (p.y < minY) minY = p.y; });
    if (minY === Infinity) minY = H - 20;

    // desired "coverage" above screen: keep generating until minY < -60 (i.e. we have platforms above viewport)
    let attempts = 0;
    while (minY > -80 && platforms.length < MAX_PLATFORMS && attempts++ < 40) {
      // create a new platform a bit above the current minY
      const gap = 36 + Math.random()*48;
      const newY = Math.round(minY - gap);
      const x = Math.random() * (W - 90);
      // difficulty progression: more hazards as score increases
      let type = 'static';
      const prog = Math.min(1, score / 800); // scale 0..1
      const r = Math.random();
      if (r < 0.08 + 0.2 * prog) type = 'break';
      else if (r < 0.18 + 0.2 * prog) type = 'moving';
      else if (r < 0.28) type = 'spring';
      else if (r < 0.30 + 0.06 * prog) type = 'jet';
      const p = createPlatform(x, newY, type);
      // avoid too-close vertical overlap
      if (!platforms.some(q => Math.abs(q.y - p.y) < 18 && Math.abs(q.x - p.x) < Math.max(40, (q.w+p.w)/2))) {
        platforms.push(p);
        minY = p.y;
      } else {
        // nudge and retry a few times
        let tries = 0;
        while (tries++ < 6 && platforms.some(q => Math.abs(q.y - p.y) < 18 && Math.abs(q.x - p.x) < Math.max(40, (q.w+p.w)/2))) {
          p.x = Math.random()*(W - p.w - 16);
        }
        platforms.push(p);
        minY = p.y;
      }

      // very rare pickups and blackholes spawn on some of the new platforms
      if (Math.random() < 0.015) {
        pickups.push({ kind: Math.random() < 0.6 ? 'jetpack' : 'hat', x: Math.max(10,p.x + Math.random()*(p.w-20)), y: p.y - 34, picked:false });
      }
      if (Math.random() < 0.02 && score > 60) {
        blackholes.push({ x: Math.random()*(W-60), y: newY - 28, r: 22 });
      }
    }

    trimPlatforms();
    platforms.sort((a,b)=> a.y - b.y);
  }

  // remove platforms that are far below the screen and cap total
  function trimPlatforms() {
    // remove those far below viewport
    platforms = platforms.filter(p => p.y < H + 200);
    // cap total to avoid runaway
    if (platforms.length > MAX_PLATFORMS) {
      // prefer to keep higher platforms (small y)
      platforms.sort((a,b)=> a.y - b.y);
      platforms = platforms.slice(0, MAX_PLATFORMS);
    }
  }

  function drawBackground(nowTimeSec) {
    if (!backgroundRoot) return;
    if (!backgroundRoot.dataset.initted) {
      backgroundRoot.dataset.initted = '1';
      // falling leaves and pumpkins
      for (let i=0;i<18;i++) {
        const leaf = document.createElement('div');
        leaf.className = 'leaf';
        leaf.style.left = `${Math.random()*100}%`;
        leaf.style.top = `${-10 - Math.random()*40}%`;
        leaf.style.animationDelay = `${Math.random()*6}s`;
        leaf.style.transform = `scale(${0.6 + Math.random()*0.8}) rotate(${Math.random()*360}deg)`;
        backgroundRoot.appendChild(leaf);
      }
      for (let i=0;i<6;i++) {
        const pk = document.createElement('div');
        pk.className = 'bg-pumpkin';
        pk.style.left = `${Math.random()*100}%`;
        pk.style.top = `${-20 - Math.random()*60}%`;
        pk.style.animationDelay = `${Math.random()*12}s`;
        backgroundRoot.appendChild(pk);
      }
    }
  }

  function draw(nowTime) {
    // clear canvas
    ctx.clearRect(0,0,W,H);

    // background gradient
    const bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0, '#070306');
    bg.addColorStop(1, '#0b0305');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,W,H);

    // blackholes: more visible and pumpkin-ringed
    blackholes.forEach(b => {
      const cx = b.x + b.r, cy = b.y + b.r;
      // outer glow
      const g = ctx.createRadialGradient(cx,cy,b.r*0.6,cx,cy,b.r*2.5);
      g.addColorStop(0, 'rgba(255,120,0,0.28)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx,cy,b.r*2,0,Math.PI*2);
      ctx.fill();
      // pumpkin ring
      ctx.fillStyle = '#ff8c00';
      ctx.beginPath();
      ctx.arc(cx,cy,b.r*1.1,0,Math.PI*2);
      ctx.fill();
      // center hole
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx,cy,b.r*0.8,0,Math.PI*2);
      ctx.fill();
      // carved eyes
      ctx.fillStyle = '#200';
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 2);
      ctx.quadraticCurveTo(cx - 2, cy - 10, cx + 6, cy - 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 6);
      ctx.quadraticCurveTo(cx - 2, cy + 12, cx + 10, cy + 6);
      ctx.fill();
    });

    // platforms
    platforms.forEach(p => {
      if (p.type === 'break') ctx.fillStyle = '#5a1b1b';
      else if (p.type === 'spring') ctx.fillStyle = '#ffd86b';
      else if (p.type === 'jet') ctx.fillStyle = '#7fe0ff';
      else if (p.type === 'moving') ctx.fillStyle = '#bb7f3a';
      else ctx.fillStyle = '#884422';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      // spring visual
      if (p.type === 'spring') {
        ctx.fillStyle = '#c15a00';
        ctx.fillRect(p.x + p.w/2 - 6, p.y - 8, 12, 6);
      }
    });

    // pickups (jetpack/hat) - larger visuals
    pickups.forEach(it => {
      if (it.picked) return;
      if (it.kind === 'jetpack') {
        ctx.fillStyle = '#39d7ff';
        ctx.fillRect(it.x - 6, it.y - 6, 36, 24);
        ctx.fillStyle = '#222';
        ctx.fillRect(it.x - 2, it.y - 2, 6, 12);
        ctx.fillRect(it.x + 22, it.y - 2, 6, 12);
      } else if (it.kind === 'hat') {
        ctx.fillStyle = '#8b2a8b';
        ctx.beginPath();
        ctx.moveTo(it.x - 2, it.y + 18);
        ctx.quadraticCurveTo(it.x + 12, it.y - 10, it.x + 32, it.y + 18);
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
      if (bigScoreEl) bigScoreEl.textContent = `Score: ${score}`;
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

    // If fullscreen, do not show popups (require user to exit FS to save)
    if (document.fullscreenElement === playbound) {
      // just stop the game but don't show modals
      // show small top HUD change (optional) - here we just return
      return;
    }

    gameOverModal.classList.remove('hidden');

    if (scaryMode) { doJumpscareBig(); if (Math.random() < 0.6) glitchFreezeBrief(); }
  }

  // start / reset
  function startGame() {
    if (running) return;
    // hide overlays when starting in fullscreen
    if (document.fullscreenElement === playbound) {
      if (playOverlay) playOverlay.classList.add('hidden');
      if (gameOverModal) gameOverModal.classList.add('hidden');
    }
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

  // leaderboard persistence & submission (require firebase; do not persist locally)
  const DAY1_KEY = 'day1_local_scores_v3';
  function loadLocalScores() { try { return JSON.parse(localStorage.getItem(DAY1_KEY) || '[]'); } catch (e) { return []; } }
  function saveLocalScore(entry) { /* disabled per request - do nothing */ }

  async function submitScoreToFirestoreDocs(entry) {
    try {
      if (!window.firebaseReady || !window.firebaseDb || !window.firebaseSetDoc || !window.firebaseDoc) {
        console.warn('Firebase not available; cannot save remotely.');
        return { ok: false, reason: 'no-firebase' };
      }
      // write day score document
      const id = `${Date.now()}_${entry.uid||'anon'}`;
      const docRef = window.firebaseDoc(window.firebaseDb, 'day1_scores', id);
      await window.firebaseSetDoc(docRef, entry);

      // update user's aggregated totals
      if (entry.uid && window.firebaseGetDoc && window.firebaseSetDoc) {
        const userDocRef = window.firebaseDoc(window.firebaseDb, 'users', entry.uid);
        const snap = await window.firebaseGetDoc(userDocRef);
        let docData = {};
        if (snap && snap.exists && snap.exists()) {
          docData = snap.data();
        } else {
          docData = { username: entry.playerName, email: (window.currentUser && window.currentUser.email) || '', createdAt: new Date(), scores: { day1:0,day2:0,day3:0,day4:0,day5:0, total:0 } };
        }
        docData.scores = docData.scores || {};
        docData.scores.day1 = Math.max(docData.scores.day1 || 0, entry.score);
        const s = docData.scores;
        docData.scores.total = (s.day1||0)+(s.day2||0)+(s.day3||0)+(s.day4||0)+(s.day5||0);
        await window.firebaseSetDoc(userDocRef, docData);
      }
      return { ok: true };
    } catch (err) {
      console.error('Failed to submit score to Firestore:', err);
      return { ok: false, reason: err && err.message ? err.message : 'unknown' };
    }
  }

  // Save flow: require firebase auth; if not signed in open index sign-in modal and auto-submit on auth
  async function handleSubmitScore() {
    // prefer firebase auth current user
    const fbUser = (window.firebaseAuth && window.firebaseAuth.currentUser) ? window.firebaseAuth.currentUser : null;
    const uid = fbUser ? fbUser.uid : null;
    const name = (window.userData && window.userData.username) ? window.userData.username : (fbUser && fbUser.email ? fbUser.email.split('@')[0] : 'Anonymous');
    const entry = { score, playerName: name, uid, ts: Date.now(), withinEvent: Date.now() <= GAME_END_TS };

    if (!uid) {
      pendingSaveEntry = entry;
      // show the sign-in modal from index.html (if present)
      const loginModal = document.getElementById('login-modal');
      if (loginModal) loginModal.classList.remove('hidden');
      // Also request a fresh onAuthStateChanged callback in case firebase has user persisted but hasn't populated currentUser yet
      if (window.firebaseOnAuthStateChanged && window.firebaseAuth) {
        // attempt a one-time wait for auth
        const waitForAuth = new Promise((resolve) => {
          const off = window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
            off && off(); // unsubscribe if the API returns a function
            resolve(user);
          });
          // fallback timeout
          setTimeout(() => resolve(null), 1500);
        });
        const possibleUser = await waitForAuth;
        if (possibleUser) {
          // auto-submit if auth appears
          pendingSaveEntry.uid = possibleUser.uid;
          pendingSaveEntry.playerName = (window.userData && window.userData.username) ? window.userData.username : (possibleUser.email ? possibleUser.email.split('@')[0] : 'User');
          const r = await submitScoreToFirestoreDocs(pendingSaveEntry);
          if (!r.ok) alert('Auto-save after sign in failed: ' + (r.reason || 'unknown'));
          pendingSaveEntry = null;
          return;
        }
      }

      alert('Sign in is required to save to the main leaderboard. Please sign in via the modal and the save will complete automatically.');
      return;
    }

    const res = await submitScoreToFirestoreDocs(entry);
    if (!res.ok) {
      alert('Saving score failed: ' + (res.reason || 'unknown') + '.');
    } else {
      alert('Score saved.');
    }

    if (document.fullscreenElement === playbound) {
      // keep overlays hidden in fullscreen
    } else {
      gameOverModal.classList.add('hidden');
      playOverlay.classList.remove('hidden');
    }
  }

  // process pending save after login (index exports firebaseOnAuthStateChanged)
  if (window.firebaseOnAuthStateChanged && window.firebaseAuth) {
    window.firebaseOnAuthStateChanged(window.firebaseAuth, async (user) => {
      if (user && pendingSaveEntry) {
        pendingSaveEntry.uid = user.uid;
        pendingSaveEntry.playerName = (window.userData && window.userData.username) ? window.userData.username : (user.email ? user.email.split('@')[0] : 'User');
        const r = await submitScoreToFirestoreDocs(pendingSaveEntry);
        if (!r.ok) alert('Auto-save after sign in failed: ' + (r.reason || 'unknown'));
        pendingSaveEntry = null;
        if (document.fullscreenElement !== playbound) {
          gameOverModal.classList.add('hidden');
          playOverlay.classList.remove('hidden');
        }
      }
    });
  }

  // Day leaderboard viewing (unchanged)
  async function openDayLeaderboard() {
    dayLeaderboardBody.innerHTML = '<tr><td colspan="5">Loading…</td></tr>';
    dayLeaderboardModal.classList.remove('hidden');

    let remote = [];
    if (window.firebaseReady && window.firebaseGetDocs && window.firebaseQuery && window.firebaseCollection && window.firebaseOrderBy) {
      try {
        const q = window.firebaseQuery(window.firebaseCollection(window.firebaseDb,'day1_scores'), window.firebaseOrderBy('score','desc'));
        const snap = await window.firebaseGetDocs(q);
        snap.forEach(d => remote.push(d.data()));
      } catch (e) { console.warn('Failed to load remote day1 scores', e); }
    }
    const merged = remote.sort((a,b)=> (b.score||0)-(a.score||0));
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
  // Play again immediately restarts
  retryBtn && retryBtn.addEventListener('click', ()=> {
    // hide overlays unconditionally then start
    if (gameOverModal) gameOverModal.classList.add('hidden');
    if (playOverlay) playOverlay.classList.add('hidden');
    // small delay to ensure DOM state cleared
    setTimeout(() => startGame(), 30);
  });

  helpBtn && helpBtn.addEventListener('click', ()=> helpModal.classList.remove('hidden'));
  helpClose && helpClose.addEventListener('click', ()=> helpModal.classList.add('hidden'));
  helpStep && helpStep.addEventListener('click', ()=> { helpInteractive.innerHTML = `<div style="color:#ffd8a8">Controls: ← → to move. Tap left/right on mobile. Halloween Jetpack gives long flight, Witch Hat gives high flight. Avoid blackholes & enemies.</div>`; });

  playBtn && playBtn.addEventListener('click', () => {
    if (document.fullscreenElement === playbound) {
      playOverlay && playOverlay.classList.add('hidden');
      gameOverModal && gameOverModal.classList.add('hidden');
    }
    startGame();
  });

  // fullscreen only for playbound, update icon
  let isFull = false;
  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await playbound.requestFullscreen();
        fullscreenBtn && (fullscreenBtn.textContent = '⤡');
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

  // background init (falling leaves/pumpkins)
  function initBackgroundElements() {
    if (!backgroundRoot) return;
    if (!backgroundRoot.dataset.ready) {
      backgroundRoot.dataset.ready = '1';
      // create a few leaves/pumpkins (drawn via CSS)
      for (let i=0;i<20;i++) {
        const leaf = document.createElement('div');
        leaf.className = 'leaf';
        leaf.style.left = `${Math.random()*100}%`;
        leaf.style.top = `${-10 - Math.random()*60}%`;
        leaf.style.animationDelay = `${Math.random()*10}s`;
        backgroundRoot.appendChild(leaf);
      }
      for (let i=0;i<6;i++) {
        const pk = document.createElement('div');
        pk.className = 'bg-pumpkin';
        pk.style.left = `${Math.random()*100}%`;
        pk.style.top = `${-20 - Math.random()*60}%`;
        pk.style.animationDelay = `${Math.random()*12}s`;
        backgroundRoot.appendChild(pk);
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

  // show play overlay only if not fullscreen
  if (playOverlay && document.fullscreenElement !== playbound) playOverlay.classList.remove('hidden');
})();