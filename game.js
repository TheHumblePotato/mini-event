// ===== game.js — Escape Room Engine (v2) =====
(function() {
'use strict';

// ===== CONFIG =====
const START_ROOM_NORMAL = 'study';
const START_ROOM_FOOL   = 'fool_study';

// ===== STATE =====
const S = {
  isFool: false,
  currentRoom: null,
  rooms: {},          // deep cloned room data
  inventory: [],
  unlockedDoors: {},
  solvedPuzzles: {},
  searchedCovers: {},
  openedSafes: {},
  flags: {},
  easterEggClicks: {}, // objId → count
  easterEggTriggered: {},
  wrongSafeAttempts: {},
  timer: { running: false, start: 0, elapsed: 0 },
  completed: false,
  savedTime: false,
  uid: '', codename: 'Agent',
  activePanel: null,   // only one panel open at a time
  selectedItem: null,
  tutorialActive: true,
  tutorialStep: 0,
  interactTarget: null, // current object being viewed
  introShown: false,
};

// ===== DOM =====
const $ = id => document.getElementById(id);
const canvas = $('game-canvas');
const ctx = canvas.getContext('2d');

// ===== TOAST SYSTEM =====
function toast(msg, type = 'info', duration = 3000) {
  let container = $('game-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'game-toast-container';
    container.style.cssText = 'position:fixed;bottom:120px;right:20px;z-index:9000;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  const colors = { success: 'var(--green)', error: 'var(--red)', info: 'var(--muted)', item: 'var(--amber)' };
  el.style.cssText = `background:rgba(2,14,6,0.97);border:1px solid ${colors[type]||colors.info};color:${colors[type]||colors.info};padding:10px 16px;border-radius:4px;font-family:'Share Tech Mono',monospace;font-size:0.82rem;opacity:0;transform:translateX(20px);transition:all 0.3s;max-width:260px;box-shadow:0 0 20px rgba(0,0,0,0.7);`;
  el.textContent = msg;
  container.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateX(0)'; });
  setTimeout(() => {
    el.style.opacity = '0'; el.style.transform = 'translateX(20px)';
    setTimeout(() => el.remove(), 400);
  }, duration);
}

// ===== UTILS =====
function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sc = (s % 60).toString().padStart(2, '0');
  const cs = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return `${m}:${sc}.${cs}`;
}
function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
function isAprilFools() { return sessionStorage.getItem('april_is_fool') === '1'; }

// ===== PANEL SYSTEM =====
// Only one panel open at a time
function openPanel(id) {
  if (S.activePanel && S.activePanel !== id) closePanel(S.activePanel);
  const el = $(id);
  if (!el) return;
  el.classList.remove('hidden');
  S.activePanel = id;
}
function closePanel(id) {
  const el = $(id);
  if (el) el.classList.add('hidden');
  if (S.activePanel === id) S.activePanel = null;
  S.interactTarget = null;
  S.selectedItem = null;
  renderInventory();
}
function closeActivePanel() {
  if (S.activePanel) closePanel(S.activePanel);
}
// Expose to global scope for inline onclick handlers
window._gameClosePanel = closePanel;

// ===== TUTORIAL =====
function showTutorial() {
  S.tutorialActive = true;
  S.tutorialStep = 0;
  renderTutStep();
  $('tutorial-overlay').style.display = 'flex';
}
function renderTutStep() {
  const steps = window.GAME_TUTORIAL;
  const step = steps[S.tutorialStep];
  $('tutorial-step-indicator').textContent = `STEP ${S.tutorialStep + 1} / ${steps.length}`;
  $('tutorial-content').innerHTML = step.html;
  $('tutorial-next').textContent = S.tutorialStep === steps.length - 1 ? 'Start →' : 'Next →';
}
$('tutorial-next').addEventListener('click', () => {
  const steps = window.GAME_TUTORIAL;
  if (S.tutorialStep < steps.length - 1) { S.tutorialStep++; renderTutStep(); }
  else endTutorial();
});
$('tutorial-skip').addEventListener('click', endTutorial);
function endTutorial() {
  $('tutorial-overlay').style.display = 'none';
  S.tutorialActive = false;
  startGameEngine();
}

// ===== INIT =====
function startGameEngine() {
  S.isFool = isAprilFools();
  if (S.isFool) document.body.classList.add('april-fools');
  S.uid = sessionStorage.getItem('april_uid') || '';
  S.codename = sessionStorage.getItem('april_codename') || 'Agent';
  S.rooms = deepClone(window.GAME_ROOMS);

  const startId = S.isFool ? START_ROOM_FOOL : START_ROOM_NORMAL;
  $('game-shell').classList.remove('hidden');
  resizeCanvas();
  loadRoom(startId);
  startTimer();
  requestAnimationFrame(renderLoop);

  // First-entry intro overlay
  if (!S.introShown) {
    S.introShown = true;
    showIntroOverlay();
  }
}

// ===== INTRO OVERLAY =====
function showIntroOverlay() {
  const overlay = $('intro-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.classList.add('hidden'), 800);
  }, 3000);
  overlay.addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.classList.add('hidden'), 400);
  });
}

// ===== ROOM LOADING =====
function loadRoom(roomId) {
  S.currentRoom = roomId;
  const room = S.rooms[roomId];
  if (!room) return;
  $('room-name-display').textContent = room.label;
  updateNavArrows();
  closeActivePanel();
}

function updateNavArrows() {
  const room = S.rooms[S.currentRoom];
  const c = room.connections || {};
  ['left','right','up','down'].forEach(dir => {
    const btn = $('nav-' + dir);
    if (!btn) return;
    const dest = c[dir];
    if (!dest) { btn.classList.add('hidden'); return; }
    // Check if door leading that way is unlocked
    const door = getDoorToRoom(dest);
    if (door && door.locked && !S.unlockedDoors[door.id]) {
      btn.classList.add('hidden');
    } else {
      btn.classList.remove('hidden');
    }
  });
}

function getDoorToRoom(destRoomId) {
  const room = S.rooms[S.currentRoom];
  return room.objects.find(o => o.type === 'door' && o.leadsTo === destRoomId) || null;
}

['left','right','up','down'].forEach(dir => {
  const btn = $('nav-' + dir);
  if (btn) btn.addEventListener('click', () => navigate(dir));
});

function navigate(dir) {
  const room = S.rooms[S.currentRoom];
  const dest = room.connections && room.connections[dir];
  if (!dest) return;
  const door = getDoorToRoom(dest);
  if (door && door.locked && !S.unlockedDoors[door.id]) {
    toast('That way is locked.', 'error');
    return;
  }
  closeActivePanel();
  loadRoom(dest);
}

// ===== CANVAS RENDERING =====
function resizeCanvas() {
  const vp = $('game-viewport');
  if (!vp) return;
  const rect = vp.getBoundingClientRect();
  const aspect = 16 / 9;
  let w = rect.width - 60, h = rect.height - 40;
  if (w / h > aspect) w = h * aspect; else h = w / aspect;
  canvas.width = Math.floor(w);
  canvas.height = Math.floor(h);
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
}
window.addEventListener('resize', () => { resizeCanvas(); });

let lastTime = 0;
function renderLoop(ts) {
  updateTimer();
  const dt = ts - lastTime; lastTime = ts;
  renderRoom(dt);
  requestAnimationFrame(renderLoop);
}

const spriteCache = {};
function getSprite(path) {
  if (!path || !spriteCache[path]) {
    if (path) { const img = new Image(); img.src = path; spriteCache[path] = img; }
    return null;
  }
  return spriteCache[path];
}

let _morseTime = 0; // global animation clock for morse display
let _windowAnim = {}; // per-window animation state

function renderRoom(dt) {
  if (!S.currentRoom) return;
  const room = S.rooms[S.currentRoom];
  const W = canvas.width, H = canvas.height;
  _morseTime += (dt || 16);

  ctx.fillStyle = room.bg || '#080f08';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(0,255,65,0.025)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  room.objects.forEach(obj => {
    if (obj.type === 'window') { drawWindow(obj, W, H); return; }
    drawObject(obj, W, H);
  });

  // Hover highlight
  if (S.hoverObj && S.hoverObj.type !== 'prop') {
    const obj = S.hoverObj;
    const ox = obj.x * W, oy = obj.y * H, ow = obj.w * W, oh = obj.h * H;
    ctx.strokeStyle = 'rgba(0,255,65,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox - 1, oy - 1, ow + 2, oh + 2);
  }
}

function drawObject(obj, W, H) {
  const ox = obj.x * W, oy = obj.y * H, ow = obj.w * W, oh = obj.h * H;
  if (ow <= 0 || oh <= 0) return;

  if (obj.sprite && getSprite(obj.sprite)?.complete) {
    ctx.drawImage(getSprite(obj.sprite), ox, oy, ow, oh);
  } else {
    drawPlaceholder(obj, ox, oy, ow, oh);
  }

  // Special animation for device/morse
  if (obj.type === 'device' && obj.animationType === 'morse_display') {
    drawMorseAnim(obj, ox, oy, ow, oh);
  }

  drawObjectIndicator(obj, ox, oy, ow, oh);
}

function drawWindow(obj, W, H) {
  const wx = obj.windowX * W, wy = obj.windowY * H;
  const ww = obj.windowW * W, wh = obj.windowH * H;
  if (!ww || !wh) return;

  const scene = obj.scene && window.WINDOW_SCENES ? window.WINDOW_SCENES[obj.scene] : null;

  // Window frame
  ctx.fillStyle = '#030810';
  ctx.fillRect(wx, wy, ww, wh);
  ctx.strokeStyle = 'rgba(0,255,65,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(wx, wy, ww, wh);

  if (scene) {
    // Animated sky gradient
    const t = _morseTime / 1000;
    const grd = ctx.createLinearGradient(wx, wy, wx, wy + wh);
    const sky = scene.skyColor || ['#0a1a3a','#1a0a2a'];
    sky.forEach((c, i) => grd.addColorStop(i / (sky.length - 1), c));
    ctx.fillStyle = grd;
    ctx.fillRect(wx, wy, ww, wh);

    // Stars if applicable
    if (scene.stars) {
      ctx.fillStyle = 'rgba(255,255,220,0.6)';
      const seed = 42;
      for (let i = 0; i < 15; i++) {
        const sx = wx + ((seed * (i+1) * 37) % 100) / 100 * ww;
        const sy = wy + ((seed * (i+1) * 53) % 100) / 100 * (wh * 0.7);
        const pulse = 0.4 + 0.3 * Math.sin(t * 1.5 + i);
        ctx.globalAlpha = pulse;
        ctx.fillRect(sx, sy, 1, 1);
      }
      ctx.globalAlpha = 1;
    }

    // Clock tower silhouette
    const tw = ww * 0.15, th = wh * 0.6;
    const tx = wx + ww * 0.5 - tw / 2, ty = wy + wh - th;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(tx, ty, tw, th);
    // Tower top
    ctx.beginPath();
    ctx.moveTo(tx, ty); ctx.lineTo(tx + tw / 2, ty - wh * 0.1); ctx.lineTo(tx + tw, ty);
    ctx.fill();

    // Clock face on tower
    if (scene.clockTime) {
      const cr = tw * 0.4;
      const cx2 = tx + tw / 2, cy2 = ty + th * 0.25;
      ctx.beginPath(); ctx.arc(cx2, cy2, cr, 0, Math.PI * 2);
      ctx.fillStyle = '#ddd8b8'; ctx.fill();
      ctx.strokeStyle = '#888'; ctx.lineWidth = 1; ctx.stroke();
      // Hour hand
      const { h, m } = scene.clockTime;
      const ha = ((h % 12 + m / 60) / 12) * Math.PI * 2 - Math.PI / 2;
      const ma = (m / 60) * Math.PI * 2 - Math.PI / 2;
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(cx2 + Math.cos(ha) * cr * 0.55, cy2 + Math.sin(ha) * cr * 0.55); ctx.stroke();
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(cx2 + Math.cos(ma) * cr * 0.75, cy2 + Math.sin(ma) * cr * 0.75); ctx.stroke();
    }

    // Ground
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(wx, wy + wh * 0.75, ww, wh * 0.25);
  }

  // Crosshatch (window pane lines)
  ctx.strokeStyle = 'rgba(100,100,80,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(wx + ww/2, wy); ctx.lineTo(wx + ww/2, wy + wh); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(wx, wy + wh/2); ctx.lineTo(wx + ww, wy + wh/2); ctx.stroke();

  // Label
  if (S.hoverObj?.id === obj.id) {
    ctx.fillStyle = 'rgba(0,255,65,0.6)';
    ctx.font = '11px Share Tech Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Window', wx + ww/2, wy + wh + 14);
    ctx.textAlign = 'left';
  }
}

// Morse animation for device objects
function drawMorseAnim(obj, ox, oy, ow, oh) {
  const puzzle = window.GAME_PUZZLES['morse_lamp'];
  if (!puzzle) return;
  // Build morse sequence
  const morse = { S:'...',U:'..-',N:'-.' };
  const msg = puzzle.message; // 'SUN'
  const morseLookup = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..'};
  const fullSeq = msg.split('').map(c => morseLookup[c] || '').join(' / ');
  // Full sequence timing (units: dot=1, dash=3, intra=1, inter=3, word=7)
  const DOT=200, DASH=600, INTRA=200, INTER=600;
  let seq = [];
  fullSeq.split('').forEach(ch => {
    if (ch === '.') seq.push({ on: true, dur: DOT }, { on: false, dur: INTRA });
    else if (ch === '-') seq.push({ on: true, dur: DASH }, { on: false, dur: INTRA });
    else if (ch === ' ') seq.push({ on: false, dur: INTER });
    else if (ch === '/') seq.push({ on: false, dur: INTER });
  });
  const totalDur = seq.reduce((a, s) => a + s.dur, 0) + 1000; // 1s pause at end
  const t = _morseTime % totalDur;
  let acc = 0, lit = false;
  for (const step of seq) {
    if (t < acc + step.dur) { lit = step.on; break; }
    acc += step.dur;
  }
  // Draw lamp glow
  const cx = ox + ow / 2, cy = oy + ow / 2;
  const r = ow * 0.4;
  const lampColor = lit ? 'rgba(255,255,0,0.95)' : 'rgba(40,40,0,0.6)';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = lampColor; ctx.fill();
  if (lit) {
    ctx.shadowColor = '#ffff00'; ctx.shadowBlur = ow;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,180,0.5)'; ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawPlaceholder(obj, ox, oy, ow, oh) {
  ctx.fillStyle = obj.colour || '#0f1a0f';
  ctx.fillRect(ox, oy, ow, oh);
  ctx.strokeStyle = 'rgba(0,255,65,0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(ox, oy, ow, oh);

  ctx.fillStyle = 'rgba(0,255,65,0.4)';
  ctx.font = `${Math.max(8, Math.min(13, ow / 8))}px Share Tech Mono, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = obj.label.split(' ');
  const lineH = 13;
  const lines = [];
  let cur = '';
  words.forEach(w => {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > ow - 6) { if (cur) lines.push(cur); cur = w; }
    else cur = test;
  });
  if (cur) lines.push(cur);
  const totalH = lines.length * lineH;
  lines.forEach((line, i) => {
    ctx.fillText(line, ox + ow / 2, oy + oh / 2 - totalH / 2 + i * lineH + lineH / 2);
  });
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

function drawObjectIndicator(obj, ox, oy, ow, oh) {
  let icon = '', col = 'rgba(0,255,65,0.8)';
  if (obj.type === 'door') {
    const unlocked = S.unlockedDoors[obj.id] || !obj.locked;
    icon = unlocked ? '✓' : '🔒'; col = unlocked ? 'rgba(0,255,65,0.9)' : 'rgba(255,179,0,0.9)';
  } else if (obj.type === 'safe') {
    const solved = S.openedSafes[obj.id];
    const hidden = obj.requiresPuzzle && !S.solvedPuzzles[obj.requiresPuzzle];
    if (hidden) return; // don't show indicator for hidden safe
    icon = solved ? '✓' : '🔐'; col = solved ? 'rgba(0,255,65,0.9)' : 'rgba(255,179,0,0.9)';
  } else if (obj.type === 'cover') {
    icon = S.searchedCovers[obj.id] ? '✓' : '🔍';
    col = S.searchedCovers[obj.id] ? 'rgba(100,100,100,0.5)' : 'rgba(0,255,65,0.8)';
  } else if (obj.type === 'puzzle') {
    const solved = S.solvedPuzzles[obj.puzzleId];
    icon = solved ? '✓' : '⚙'; col = solved ? 'rgba(0,255,65,0.9)' : 'rgba(0,200,255,0.9)';
  } else if (obj.type === 'note') {
    icon = '📝';
  } else if (obj.type === 'device') {
    icon = ''; // animated, no indicator needed
  }
  if (icon) {
    ctx.font = '11px monospace'; ctx.fillStyle = col;
    ctx.fillText(icon, ox + 3, oy + 13);
  }
}

// ===== MOUSE =====
let _hoverTipTimeout;
canvas.addEventListener('mousemove', e => {
  if (S.tutorialActive) return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / (rect.right - rect.left);
  const my = (e.clientY - rect.top) / (rect.bottom - rect.top);
  S.hoverObj = getObjectAt(mx, my);
  const tip = $('hover-tooltip');
  if (S.hoverObj && S.hoverObj.type !== 'prop') {
    tip.textContent = S.hoverObj.label;
    tip.classList.remove('hidden');
    canvas.style.cursor = 'pointer';
  } else {
    tip.classList.add('hidden');
    canvas.style.cursor = 'crosshair';
  }
});
canvas.addEventListener('mouseleave', () => {
  S.hoverObj = null;
  const tip = $('hover-tooltip');
  if (tip) tip.classList.add('hidden');
});
canvas.addEventListener('click', e => {
  if (S.tutorialActive) return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / (rect.right - rect.left);
  const my = (e.clientY - rect.top) / (rect.bottom - rect.top);
  const obj = getObjectAt(mx, my);
  if (obj) interactWith(obj);
});

function getObjectAt(mx, my) {
  const room = S.rooms[S.currentRoom];
  if (!room) return null;
  for (let i = room.objects.length - 1; i >= 0; i--) {
    const obj = room.objects[i];
    // Window type uses different coords
    if (obj.type === 'window') {
      if (mx >= obj.windowX && mx <= obj.windowX + obj.windowW &&
          my >= obj.windowY && my <= obj.windowY + obj.windowH) return obj;
      continue;
    }
    if (!obj.x && obj.x !== 0) continue;
    if (mx >= obj.x && mx <= obj.x + obj.w && my >= obj.y && my <= obj.y + obj.h) return obj;
  }
  return null;
}

// ===== INTERACTION DISPATCH =====
function interactWith(obj) {
  S.interactTarget = obj;

  // Easter egg: multi-click props
  if (obj.easterEggClicks) {
    S.easterEggClicks[obj.id] = (S.easterEggClicks[obj.id] || 0) + 1;
    if (S.easterEggClicks[obj.id] >= obj.easterEggClicks && !S.easterEggTriggered[obj.easterEggId]) {
      S.easterEggTriggered[obj.easterEggId] = true;
      const egg = window.GAME_EASTER_EGGS[obj.easterEggId];
      if (egg) {
        const msg = (S.isFool && egg.foolMessage) ? egg.foolMessage : egg.message;
        showNotice(obj.label, msg);
        return;
      }
    }
  }

  switch (obj.type) {
    case 'cover':   interactCover(obj); break;
    case 'safe':    interactSafe(obj); break;
    case 'door':    interactDoor(obj); break;
    case 'puzzle':  interactPuzzle(obj); break;
    case 'note':    interactNote(obj); break;
    case 'pickup':  interactPickup(obj); break;
    case 'device':  interactDevice(obj); break;
    case 'window':  interactWindow(obj); break;
    case 'prop':    showNotice(obj.label, obj.description || 'Nothing of interest.'); break;
    default:        showNotice(obj.label, obj.description || '...'); break;
  }
}

// ===== INTERACTION HANDLERS =====
function interactCover(obj) {
  if (S.searchedCovers[obj.id]) {
    showNotice(obj.label, obj.description + '\n\n[Already searched — nothing more here.]');
    return;
  }
  showNotice(obj.label, obj.description, [{ label: '🔍 Search', cb: () => doSearch(obj) }]);
}

function doSearch(obj) {
  S.searchedCovers[obj.id] = true;
  if (!obj.contains || obj.contains.length === 0) {
    showNotice(obj.label, 'You search carefully. Nothing here.');
    // Easter egg for desk
    if (obj.easterEggId && !S.easterEggTriggered['desk_searched']) {
      S.easterEggTriggered['desk_searched'] = true;
      const egg = window.GAME_EASTER_EGGS[obj.easterEggId];
      if (egg) {
        const msg = (S.isFool && egg.foolMessage) ? egg.foolMessage : egg.message;
        setTimeout(() => showNotice(obj.label + ' — Hidden Detail', msg), 1500);
      }
    }
    return;
  }
  const found = obj.contains.filter(e => !S.flags['found_' + e.item]);
  if (!found.length) { showNotice(obj.label, 'Nothing more here.'); return; }

  const names = [];
  found.forEach(e => {
    addItem(e.item, true);
    S.flags['found_' + e.item] = true;
    names.push(window.GAME_ITEMS[e.item]?.name || e.item);
  });

  // Desk easter egg after search
  if (obj.easterEggId === 'desk_secret') {
    setTimeout(() => {
      if (!S.easterEggTriggered['desk_searched']) {
        S.easterEggTriggered['desk_searched'] = true;
        const egg = window.GAME_EASTER_EGGS['desk_secret'];
        if (egg) {
          const msg = (S.isFool && egg.foolMessage) ? egg.foolMessage : egg.message;
          showNotice(obj.label + ' — Hidden Detail', msg);
        }
      }
    }, 1200);
  }

  // Show item popup for each found item
  found.forEach((e, i) => {
    setTimeout(() => showItemPopup(e.item), i === 0 ? 200 : 0);
  });
}

function interactSafe(obj) {
  // Check if hidden behind puzzle requirement
  if (obj.requiresPuzzle && !S.solvedPuzzles[obj.requiresPuzzle]) {
    showNotice(obj.label, obj.lockedDescription || 'A blank panel. Nothing here yet.');
    return;
  }
  if (S.openedSafes[obj.id]) {
    showNotice(obj.label, 'Already opened. Empty.');
    return;
  }
  showNotice(obj.label, obj.description, [
    { label: '🔢 Enter Code', cb: () => openCodePopup(obj) }
  ]);
}

function interactDoor(obj) {
  const unlocked = S.unlockedDoors[obj.id] || !obj.locked;
  if (unlocked) {
    if (obj.leadsTo === '__EXIT__') { triggerWin(); return; }
    const dir = directionOf(obj.leadsTo);
    if (dir) navigate(dir);
    return;
  }
  // Check if puzzle unlocks it
  if (obj.unlockedBy && S.solvedPuzzles[obj.unlockedBy]) {
    S.unlockedDoors[obj.id] = true;
    toast(obj.unlockedMessage || 'Unlocked!', 'success');
    updateNavArrows();
    if (obj.leadsTo === '__EXIT__') triggerWin();
    closeActivePanel();
    return;
  }
  // Key item
  if (obj.keyItem && S.inventory.includes(obj.keyItem)) {
    const item = window.GAME_ITEMS[obj.keyItem];
    showNotice(obj.label, obj.description, [
      { label: `🗝️ Use ${item?.name || obj.keyItem}`, cb: () => { unlockDoorWithKey(obj); closeActivePanel(); } }
    ]);
    return;
  }
  // Locked — no key
  showNotice(obj.label, obj.lockedMessage || 'Locked.');
}

function unlockDoorWithKey(obj) {
  S.unlockedDoors[obj.id] = true;
  toast(obj.unlockedMessage || 'Unlocked!', 'success');
  updateNavArrows();
  if (obj.leadsTo === '__EXIT__') triggerWin();
}

function directionOf(roomId) {
  const room = S.rooms[S.currentRoom];
  const c = room.connections || {};
  for (const [dir, id] of Object.entries(c)) { if (id === roomId) return dir; }
  return null;
}

function interactNote(obj) {
  const hasUV = S.inventory.includes('uv_light');
  let text = obj.description || '';
  if (obj.uvText && hasUV) {
    text += '\n\n🔦 ' + obj.uvText;
    if (obj.uvEasterEgg) S.easterEggTriggered['painting_uv'] = true;
  } else if (obj.uvText && !hasUV) {
    text += '\n\n[Some markings are too faint to read.]';
  }
  showNotice(obj.label, text);
}

function interactPickup(obj) {
  if (S.flags['picked_' + obj.id]) { showNotice(obj.label, 'Already taken.'); return; }
  addItem(obj.itemId, true);
  S.flags['picked_' + obj.id] = true;
  showItemPopup(obj.itemId);
}

function interactDevice(obj) {
  // Device is a visual-only animation linked to a puzzle elsewhere
  showNotice(obj.label, obj.description || 'An active device. The input for this might be elsewhere.');
}

function interactWindow(obj) {
  showNotice(obj.label, obj.description || 'A window. You can see outside but cannot interact.');
}

// ===== NOTICE POPUP =====
function showNotice(title, body, actions) {
  $('notice-title').textContent = title;
  const bodyEl = $('notice-body');
  bodyEl.innerHTML = '';
  const p = document.createElement('p');
  p.innerHTML = (body || '').replace(/\n/g, '<br>');
  bodyEl.appendChild(p);

  // Item use sidebar
  const actEl = $('notice-actions');
  actEl.innerHTML = '';

  if (actions && actions.length) {
    actions.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'interact-btn';
      btn.textContent = a.label;
      btn.onclick = () => { a.cb(); };
      actEl.appendChild(btn);
    });
  }

  // Close btn
  const closeBtn = document.createElement('button');
  closeBtn.className = 'interact-btn close-btn';
  closeBtn.textContent = 'Close';
  closeBtn.onclick = () => closePanel('notice-popup');
  actEl.appendChild(closeBtn);

  openPanel('notice-popup');
  renderItemSidebar();
}

// Render item sidebar in notice popup
function renderItemSidebar() {
  const sidebar = $('item-use-sidebar');
  if (!sidebar) return;
  sidebar.innerHTML = '';
  if (!S.inventory.length) {
    sidebar.innerHTML = '<div class="sidebar-empty">No items</div>';
    return;
  }
  const label = document.createElement('div');
  label.className = 'sidebar-label';
  label.textContent = 'USE ITEM:';
  sidebar.appendChild(label);

  S.inventory.forEach(id => {
    const item = window.GAME_ITEMS[id];
    if (!item) return;
    const btn = document.createElement('button');
    btn.className = 'item-use-btn';
    btn.innerHTML = `<span class="item-use-icon">${item.icon}</span><span class="item-use-name">${item.name}</span>`;
    btn.title = item.description;
    btn.onclick = () => tryUseItemOnTarget(id);
    sidebar.appendChild(btn);
  });
}

function tryUseItemOnTarget(itemId) {
  const obj = S.interactTarget;
  const item = window.GAME_ITEMS[itemId];
  if (!item) return;

  // UV flashlight — special: reveals uvText on notes
  if (itemId === 'uv_light' && obj) {
    if (obj.uvText) {
      const bodyEl = $('notice-body');
      if (bodyEl) {
        bodyEl.innerHTML = '';
        const p = document.createElement('p');
        const fullText = obj.description + '\n\n🔦 ' + obj.uvText;
        p.innerHTML = fullText.replace(/\n/g, '<br>');
        bodyEl.appendChild(p);
      }
      toast('UV light reveals hidden text!', 'item');
      return;
    } else {
      toast('Nothing hidden here.', 'info');
      return;
    }
  }

  // Wire fragment on fusebox
  if (itemId === 'wire_fragment' && obj?.id === 'fusebox_obj') {
    toast('The wire is compatible. Open the fuse box to connect it.', 'info');
    return;
  }

  // Key items on doors
  if (obj?.type === 'door' && obj.keyItem === itemId) {
    unlockDoorWithKey(obj);
    closeActivePanel();
    return;
  }

  // Keycard on exit
  if (obj?.type === 'door' && obj.keyItem === itemId) {
    unlockDoorWithKey(obj);
    closeActivePanel();
    return;
  }

  // Check useWith
  if (item.useWith && item.useWith.includes(obj?.id)) {
    if (obj.type === 'door') { unlockDoorWithKey(obj); closeActivePanel(); return; }
  }

  toast(`Can't use ${item.name} here.`, 'info');
}

// ===== PUZZLE ENGINE =====
function interactPuzzle(obj) {
  const puzzleId = obj.puzzleId;
  if (!puzzleId) { showNotice(obj.label, obj.description); return; }
  if (S.solvedPuzzles[puzzleId]) {
    showNotice(obj.label, obj.solvedDescription || obj.description + '\n\n[Already solved ✓]');
    return;
  }
  const puzzle = window.GAME_PUZZLES[puzzleId];
  if (!puzzle) return;
  closeActivePanel();

  switch (puzzle.type) {
    case 'morse':    openMorsePuzzle(puzzle, obj); break;
    case 'sequence': openSequencePuzzle(puzzle, obj); break;
    case 'wires':    openWiresPuzzle(puzzle, obj); break;
    case 'slider':   openSliderPuzzle(puzzle, obj); break;
    case 'clock':    openClockPuzzle(puzzle, obj); break;
    default:         showNotice(obj.label, obj.description); break;
  }
}

// ---- MORSE PUZZLE ----
function openMorsePuzzle(puzzle, obj) {
  $('puzzle-title').textContent = puzzle.label;
  const body = $('puzzle-body');
  const morseLookup = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..'};
  const msg = puzzle.message;
  const sequence = msg.split('').map(c => morseLookup[c] || '').join(' / ');

  body.innerHTML = `
    <div style="padding:16px;text-align:center;">
      <p style="font-size:0.82rem;color:var(--muted);margin-bottom:12px;">The signal lamp in another room is sending a message.<br>Decode it here.</p>
      <div style="font-size:0.75rem;color:var(--muted);margin-bottom:6px;">· = short dot &nbsp;&nbsp; — = long dash</div>
      <div id="morse-preview" style="font-family:'VT323',monospace;font-size:1.2rem;color:var(--muted);letter-spacing:4px;margin-bottom:16px;min-height:24px;border:1px dashed var(--border);padding:8px;border-radius:4px;">${sequence}</div>
      <div style="display:flex;gap:8px;justify-content:center;align-items:center;margin-bottom:12px;">
        <input id="morse-answer" placeholder="Type decoded word" style="background:rgba(0,255,65,0.05);border:1px solid var(--border);color:var(--accent);font-family:monospace;padding:8px 12px;width:180px;text-transform:uppercase;text-align:center;border-radius:4px;font-size:1rem;"/>
        <button id="morse-submit" class="btn-primary">Check</button>
      </div>
      <div id="morse-feedback" style="font-size:0.82rem;min-height:16px;"></div>
    </div>`;
  openPanel('puzzle-popup');

  document.getElementById('morse-submit').onclick = checkMorse;
  document.getElementById('morse-answer').addEventListener('keypress', e => { if (e.key === 'Enter') checkMorse(); });

  function checkMorse() {
    const ans = document.getElementById('morse-answer').value.trim().toUpperCase();
    const fb = document.getElementById('morse-feedback');
    if (ans === puzzle.message.toUpperCase()) {
      fb.style.color = 'var(--green)'; fb.textContent = '✓ Correct!';
      solvePuzzle(puzzle, obj);
      // Reward: wire fragment drops from compartment
      if (!S.inventory.includes('wire_fragment')) {
        setTimeout(() => { addItem('wire_fragment'); showItemPopup('wire_fragment'); }, 800);
      }
      setTimeout(() => closePanel('puzzle-popup'), 1200);
    } else {
      fb.style.color = 'var(--red)'; fb.textContent = '✗ Not right. Try again.';
    }
  }
}

// ---- SEQUENCE PUZZLE ----
function openSequencePuzzle(puzzle, obj) {
  $('puzzle-title').textContent = puzzle.label;
  const body = $('puzzle-body');
  const entered = [];

  body.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'padding:16px;';

  const display = document.createElement('div');
  display.style.cssText = 'font-size:2rem;letter-spacing:8px;min-height:52px;text-align:center;margin-bottom:16px;border:1px solid var(--border);padding:8px;border-radius:4px;background:rgba(0,0,0,0.3);';
  display.textContent = '—';

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;';
  puzzle.symbols.forEach((sym, idx) => {
    const btn = document.createElement('button');
    btn.textContent = sym;
    btn.style.cssText = 'font-size:1.8rem;background:rgba(0,255,65,0.05);border:1px solid var(--border);padding:12px;cursor:pointer;border-radius:4px;transition:all 0.1s;';
    btn.onmouseenter = () => btn.style.background = 'rgba(0,255,65,0.15)';
    btn.onmouseleave = () => btn.style.background = 'rgba(0,255,65,0.05)';
    btn.onclick = () => {
      if (entered.length >= puzzle.solution.length) return;
      entered.push(idx);
      display.textContent = entered.map(i => puzzle.symbols[i]).join(' ');
    };
    grid.appendChild(btn);
  });

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;';
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear'; clearBtn.className = 'btn-secondary'; clearBtn.style.flex = '1';
  clearBtn.onclick = () => { entered.length = 0; display.textContent = '—'; fb.textContent = ''; };
  const submitBtn = document.createElement('button');
  submitBtn.textContent = 'Confirm'; submitBtn.className = 'btn-primary'; submitBtn.style.flex = '1';
  submitBtn.onclick = () => {
    const correct = puzzle.solution.every((v, i) => entered[i] === v) && entered.length === puzzle.solution.length;
    if (correct) {
      fb.style.color = 'var(--green)'; fb.textContent = '✓ Correct!';
      solvePuzzle(puzzle, obj);
      setTimeout(() => closePanel('puzzle-popup'), 1000);
    } else {
      fb.style.color = 'var(--red)'; fb.textContent = '✗ Wrong sequence.';
      entered.length = 0; display.textContent = '—';
    }
  };
  row.appendChild(clearBtn); row.appendChild(submitBtn);

  const fb = document.createElement('div');
  fb.style.cssText = 'margin-top:10px;font-size:0.82rem;min-height:16px;text-align:center;';

  wrap.appendChild(display); wrap.appendChild(grid); wrap.appendChild(row); wrap.appendChild(fb);
  body.appendChild(wrap);
  openPanel('puzzle-popup');
}

// ---- WIRES PUZZLE ----
function openWiresPuzzle(puzzle, obj) {
  $('puzzle-title').textContent = puzzle.label;
  const body = $('puzzle-body');
  body.innerHTML = `<div style="padding:16px;">
    <p style="font-size:0.82rem;color:var(--muted);margin-bottom:10px;">Connect each wire to its matching terminal.</p>
    <canvas id="wire-canvas" width="420" height="200" style="border:1px solid var(--border);border-radius:4px;display:block;margin:0 auto;cursor:crosshair;background:rgba(0,0,0,0.3);"></canvas>
    <div style="display:flex;justify-content:space-between;padding:6px 16px;font-size:0.72rem;color:var(--muted);">
      <span>FROM</span><span>TO</span>
    </div>
    <div style="text-align:center;margin-top:8px;">
      <button id="wire-submit" class="btn-primary">Confirm</button>
      <button id="wire-clear" class="btn-secondary" style="margin-left:8px;">Reset</button>
    </div>
    <div id="wire-fb" style="text-align:center;margin-top:8px;font-size:0.82rem;min-height:16px;"></div>
  </div>`;
  openPanel('puzzle-popup');

  const wc = document.getElementById('wire-canvas');
  const wctx = wc.getContext('2d');
  const W = wc.width, H = wc.height;
  const pairs = puzzle.pairs;
  const connections = {};
  let dragging = null;
  const leftX = 60, rightX = W - 60;
  const spacing = H / (pairs.length + 1);
  const termY = idx => spacing * (idx + 1);

  function drawWires() {
    wctx.clearRect(0, 0, W, H);
    pairs.forEach((p, i) => {
      [leftX, rightX].forEach(tx => {
        wctx.beginPath(); wctx.arc(tx, termY(i), 10, 0, Math.PI * 2);
        wctx.fillStyle = p.colour; wctx.fill();
        wctx.strokeStyle = 'rgba(255,255,255,0.2)'; wctx.lineWidth = 2; wctx.stroke();
      });
      wctx.fillStyle = p.colour; wctx.font = '11px monospace';
      wctx.fillText(p.label, leftX + 14, termY(i) + 4);
      wctx.fillText(p.label, rightX - 55, termY(i) + 4);
    });
    Object.entries(connections).forEach(([li, ri]) => {
      const p = pairs[li];
      wctx.beginPath(); wctx.moveTo(leftX, termY(li)); wctx.lineTo(rightX, termY(ri));
      wctx.strokeStyle = p.colour; wctx.lineWidth = 3; wctx.stroke();
    });
    if (dragging) {
      const p = pairs[dragging.fromIdx];
      wctx.beginPath(); wctx.moveTo(leftX, termY(dragging.fromIdx));
      wctx.lineTo(dragging.x, dragging.y);
      wctx.strokeStyle = p.colour; wctx.lineWidth = 3;
      wctx.setLineDash([6, 4]); wctx.stroke(); wctx.setLineDash([]);
    }
  }

  wc.addEventListener('mousedown', e => {
    const rect = wc.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    pairs.forEach((p, i) => {
      if (Math.hypot(mx - leftX, my - termY(i)) < 14) {
        delete connections[i]; dragging = { fromIdx: i, x: mx, y: my };
      }
    });
  });
  wc.addEventListener('mousemove', e => {
    if (!dragging) return;
    const rect = wc.getBoundingClientRect();
    dragging.x = e.clientX - rect.left; dragging.y = e.clientY - rect.top;
    drawWires();
  });
  wc.addEventListener('mouseup', e => {
    if (!dragging) return;
    const rect = wc.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    pairs.forEach((p, i) => {
      if (Math.hypot(mx - rightX, my - termY(i)) < 14) connections[dragging.fromIdx] = i;
    });
    dragging = null; drawWires();
  });

  document.getElementById('wire-clear').onclick = () => { Object.keys(connections).forEach(k => delete connections[k]); drawWires(); };
  document.getElementById('wire-submit').onclick = () => {
    const fb = document.getElementById('wire-fb');
    const correct = pairs.every((p, i) => connections[i] !== undefined && pairs[connections[i]].label === puzzle.solution[p.label]);
    if (correct) {
      fb.style.color = 'var(--green)'; fb.textContent = '✓ All wires connected!';
      solvePuzzle(puzzle, obj);
      setTimeout(() => closePanel('puzzle-popup'), 1000);
    } else {
      fb.style.color = 'var(--red)'; fb.textContent = '✗ Something is wrong.';
    }
  };
  drawWires();
}

// ---- SLIDER PUZZLE ----
function openSliderPuzzle(puzzle, obj) {
  $('puzzle-title').textContent = puzzle.label;
  const body = $('puzzle-body');
  const size = puzzle.size || 3;
  const cells = Array.from({ length: size * size }, (_, i) => (i + 1) % (size * size));

  // Shuffle with solvability check (simple: just shuffle)
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  function render() {
    body.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;';
    const grid = document.createElement('div');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${size},1fr);gap:4px;width:${size * 72}px;`;

    cells.forEach((val, idx) => {
      const cell = document.createElement('div');
      cell.style.cssText = `width:72px;height:72px;display:flex;align-items:center;justify-content:center;font-family:'VT323',monospace;font-size:2rem;border-radius:4px;cursor:${val === 0 ? 'default' : 'pointer'};transition:all 0.1s;${val === 0 ? 'background:rgba(0,0,0,0.2);border:1px dashed rgba(0,255,65,0.1);' : 'background:rgba(0,255,65,0.08);border:1px solid rgba(0,255,65,0.25);color:var(--accent);'}`;
      cell.textContent = val === 0 ? '' : val;
      if (val !== 0) cell.onclick = () => trySlide(idx);
      grid.appendChild(cell);
    });

    const fb = document.createElement('div');
    fb.id = 'slider-fb'; fb.style.cssText = 'font-size:0.82rem;min-height:16px;text-align:center;';
    wrap.appendChild(grid); wrap.appendChild(fb);
    body.appendChild(wrap);
  }

  function trySlide(idx) {
    const emptyIdx = cells.indexOf(0);
    const row = Math.floor(idx / size), col = idx % size;
    const eRow = Math.floor(emptyIdx / size), eCol = emptyIdx % size;
    if ((Math.abs(row - eRow) === 1 && col === eCol) || (Math.abs(col - eCol) === 1 && row === eRow)) {
      [cells[idx], cells[emptyIdx]] = [cells[emptyIdx], cells[idx]];
      render();
      if (cells.every((v, i) => v === puzzle.solution[i])) {
        const fb = document.getElementById('slider-fb');
        if (fb) { fb.style.color = 'var(--green)'; fb.textContent = '✓ Solved!'; }
        solvePuzzle(puzzle, obj);
        if (puzzle.reward) {
          setTimeout(() => { addItem(puzzle.reward); showItemPopup(puzzle.reward); }, 600);
        }
        setTimeout(() => closePanel('puzzle-popup'), 1200);
      }
    }
  }
  render();
  openPanel('puzzle-popup');
}

// ---- CLOCK PUZZLE ----
function openClockPuzzle(puzzle, obj) {
  $('puzzle-title').textContent = puzzle.label;
  const body = $('puzzle-body');
  let selH = 12, selM = 0;
  const sol = puzzle.solution;

  body.innerHTML = `<div style="padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;">
    <canvas id="clock-canvas" width="200" height="200" style="border:1px solid var(--border);border-radius:50%;"></canvas>
    <div style="display:flex;gap:12px;align-items:center;">
      <div style="text-align:center;">
        <div style="font-size:0.7rem;color:var(--muted);margin-bottom:4px;">HRS</div>
        <div style="display:flex;gap:4px;align-items:center;">
          <button class="btn-secondary" id="h-dec" style="padding:4px 8px;">◄</button>
          <span id="h-val" style="font-family:'VT323',monospace;font-size:1.8rem;color:var(--accent);min-width:30px;text-align:center;">12</span>
          <button class="btn-secondary" id="h-inc" style="padding:4px 8px;">►</button>
        </div>
      </div>
      <div style="font-size:1.8rem;color:var(--muted);">:</div>
      <div style="text-align:center;">
        <div style="font-size:0.7rem;color:var(--muted);margin-bottom:4px;">MIN</div>
        <div style="display:flex;gap:4px;align-items:center;">
          <button class="btn-secondary" id="m-dec" style="padding:4px 8px;">◄</button>
          <span id="m-val" style="font-family:'VT323',monospace;font-size:1.8rem;color:var(--accent);min-width:30px;text-align:center;">00</span>
          <button class="btn-secondary" id="m-inc" style="padding:4px 8px;">►</button>
        </div>
      </div>
    </div>
    <button id="clock-submit" class="btn-primary">Set Time</button>
    <div id="clock-fb" style="font-size:0.82rem;min-height:16px;text-align:center;"></div>
  </div>`;
  openPanel('puzzle-popup');

  const cc = document.getElementById('clock-canvas');
  const cctx = cc.getContext('2d');

  function drawClock() {
    const cx = 100, cy = 100, r = 90;
    cctx.clearRect(0, 0, 200, 200);
    cctx.fillStyle = '#000'; cctx.beginPath(); cctx.arc(cx, cy, r, 0, Math.PI*2); cctx.fill();
    cctx.strokeStyle = 'rgba(0,255,65,0.3)'; cctx.lineWidth = 2;
    cctx.beginPath(); cctx.arc(cx, cy, r, 0, Math.PI*2); cctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      cctx.beginPath(); cctx.moveTo(cx + Math.cos(a)*78, cy + Math.sin(a)*78);
      cctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
      cctx.strokeStyle = 'rgba(0,255,65,0.35)'; cctx.lineWidth = 2; cctx.stroke();
    }
    const ha = ((selH % 12 + selM / 60) / 12) * Math.PI * 2 - Math.PI / 2;
    const ma = (selM / 60) * Math.PI * 2 - Math.PI / 2;
    cctx.beginPath(); cctx.moveTo(cx, cy); cctx.lineTo(cx + Math.cos(ha)*52, cy + Math.sin(ha)*52);
    cctx.strokeStyle = 'var(--accent)'; cctx.lineWidth = 4; cctx.stroke();
    cctx.beginPath(); cctx.moveTo(cx, cy); cctx.lineTo(cx + Math.cos(ma)*74, cy + Math.sin(ma)*74);
    cctx.strokeStyle = '#fff'; cctx.lineWidth = 2; cctx.stroke();
    cctx.beginPath(); cctx.arc(cx, cy, 4, 0, Math.PI*2);
    cctx.fillStyle = 'var(--accent)'; cctx.fill();
  }
  drawClock();

  function updDisplay() {
    document.getElementById('h-val').textContent = selH.toString().padStart(2,'0');
    document.getElementById('m-val').textContent = selM.toString().padStart(2,'0');
    drawClock();
  }
  document.getElementById('h-inc').onclick = () => { selH = (selH % 12) + 1; updDisplay(); };
  document.getElementById('h-dec').onclick = () => { selH = selH <= 1 ? 12 : selH - 1; updDisplay(); };
  document.getElementById('m-inc').onclick = () => { selM = (selM + 5) % 60; updDisplay(); };
  document.getElementById('m-dec').onclick = () => { selM = (selM + 55) % 60; updDisplay(); };

  document.getElementById('clock-submit').onclick = () => {
    const fb = document.getElementById('clock-fb');
    if (selH === sol.h && selM === sol.m) {
      fb.style.color = 'var(--green)'; fb.textContent = '✓ Correct time set.';
      solvePuzzle(puzzle, obj);
      // Reveal the safe in lab
      toast('Something clicked in the room.', 'success');
      setTimeout(() => closePanel('puzzle-popup'), 1000);
    } else {
      fb.style.color = 'var(--red)'; fb.textContent = `✗ ${selH.toString().padStart(2,'0')}:${selM.toString().padStart(2,'0')} — not right.`;
    }
  };
}

// ===== SOLVE PUZZLE =====
function solvePuzzle(puzzle, obj) {
  S.solvedPuzzles[puzzle.id] = true;
  toast(`${puzzle.label} solved!`, 'success');

  if (puzzle.unlocks) {
    S.unlockedDoors[puzzle.unlocks] = true;
    updateNavArrows();
  }
  // Check all doors in current room
  const room = S.rooms[S.currentRoom];
  if (room) {
    room.objects.forEach(o => {
      if (o.type === 'door' && o.unlockedBy === puzzle.id) {
        S.unlockedDoors[o.id] = true;
        updateNavArrows();
      }
    });
  }
  // Also check all rooms for cross-room door unlocks
  Object.values(S.rooms).forEach(r => {
    (r.objects || []).forEach(o => {
      if (o.type === 'door' && o.unlockedBy === puzzle.id) {
        S.unlockedDoors[o.id] = true;
      }
    });
  });
}

// ===== CODE POPUP =====
function openCodePopup(obj) {
  S.codeEntry = { current: '', target: obj, maxLen: (obj.code || '0000').length };
  $('code-popup-title').textContent = obj.label;
  $('code-display').textContent = '_'.repeat(S.codeEntry.maxLen);
  $('code-feedback').textContent = '';

  const keypad = $('code-keypad');
  keypad.innerHTML = '';
  ['1','2','3','4','5','6','7','8','9','DEL','0','CLR'].forEach(k => {
    const btn = document.createElement('button');
    btn.className = 'keypad-btn' + (k === 'DEL' ? ' del' : k === 'CLR' ? ' clear' : '');
    btn.textContent = k;
    btn.onclick = () => handleKeypad(k);
    keypad.appendChild(btn);
  });
  $('code-submit').onclick = submitCode;
  openPanel('code-popup');
}

let S_codeEntry = { current: '', target: null, maxLen: 4 };
Object.defineProperty(S, 'codeEntry', {
  get() { return S_codeEntry; },
  set(v) { S_codeEntry = v; }
});

function handleKeypad(k) {
  const ce = S.codeEntry;
  if (k === 'DEL') ce.current = ce.current.slice(0, -1);
  else if (k === 'CLR') ce.current = '';
  else if (ce.current.length < ce.maxLen) ce.current += k;
  $('code-display').textContent = ce.current + '_'.repeat(ce.maxLen - ce.current.length);
  $('code-feedback').textContent = '';
}

function submitCode() {
  const obj = S.codeEntry.target;
  if (!obj) return;
  const entered = S.codeEntry.current;
  const correct = obj.code === entered;
  const fb = $('code-feedback');

  if (correct) {
    fb.className = 'ok'; fb.textContent = '✓ Code accepted.';
    openSafe(obj);
    setTimeout(() => closePanel('code-popup'), 800);
  } else {
    fb.className = ''; fb.textContent = '✗ Wrong code.';
    // Easter egg: wrong safe attempts
    S.wrongSafeAttempts[obj.id] = (S.wrongSafeAttempts[obj.id] || 0) + 1;
    if (S.wrongSafeAttempts[obj.id] === 3 && obj.easterEggId === 'safe_wrong_code') {
      const egg = window.GAME_EASTER_EGGS?.safe_wrong_code;
      if (egg) {
        const msg = (S.isFool && egg.foolMessage) ? egg.foolMessage : egg.message;
        setTimeout(() => toast(msg.replace(/"/g, ''), 'item', 5000), 500);
      }
    }
    $('code-display').style.color = 'var(--red)';
    setTimeout(() => { $('code-display').style.color = ''; }, 400);
  }
}

function openSafe(obj) {
  if (S.openedSafes[obj.id]) return;
  S.openedSafes[obj.id] = true;
  toast('Safe opened!', 'success');
  if (obj.contains && obj.contains.length) {
    const names = [];
    obj.contains.forEach(e => {
      if (!S.flags['found_' + e.item]) {
        addItem(e.item);
        S.flags['found_' + e.item] = true;
        names.push(window.GAME_ITEMS[e.item]?.name || e.item);
        showItemPopup(e.item);
      }
    });
  }
  // Mark puzzle solved if this safe has a puzzle ID
  const puzzleId = obj.puzzleId || obj.id + '_combo';
  if (window.GAME_PUZZLES[puzzleId]) S.solvedPuzzles[puzzleId] = true;
}

// ===== ITEM SYSTEM =====
function addItem(itemId, showToast) {
  if (!itemId || S.inventory.includes(itemId)) return;
  S.inventory.push(itemId);
  if (showToast) {
    const item = window.GAME_ITEMS[itemId];
    if (item) toast(`+ ${item.name}`, 'item');
  }
  renderInventory();
}

function renderInventory() {
  const grid = $('inventory-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!S.inventory.length) {
    grid.innerHTML = '<div class="inv-empty">— empty —</div>';
    return;
  }
  S.inventory.forEach(id => {
    const item = window.GAME_ITEMS[id];
    if (!item) return;
    const slot = document.createElement('div');
    slot.className = 'inv-slot' + (S.selectedItem === id ? ' selected' : '');
    slot.innerHTML = `<span class="inv-icon">${item.icon}</span><span class="inv-name">${item.name}</span>`;
    slot.title = item.description;
    slot.onclick = () => {
      if (S.interactTarget) {
        // Try using item on current target
        tryUseItemOnTarget(id);
      } else {
        // Show item info
        S.selectedItem = id;
        showItemInfo(id);
        renderInventory();
      }
    };
    grid.appendChild(slot);
  });
}

function showItemInfo(itemId) {
  const item = window.GAME_ITEMS[itemId];
  if (!item) return;
  showNotice(item.name, item.description);
}

// Item received popup
function showItemPopup(itemId) {
  const item = window.GAME_ITEMS[itemId];
  if (!item) return;
  const popup = $('item-popup');
  if (!popup) return;
  $('item-popup-icon').textContent = item.icon;
  $('item-popup-name').textContent = item.name;
  $('item-popup-desc').innerHTML = item.description.replace(/\n/g, '<br>');
  popup.classList.remove('hidden');
  popup.style.opacity = '1';

  // Auto-close after 4s or on click
  clearTimeout(popup._timeout);
  popup._timeout = setTimeout(() => {
    popup.style.opacity = '0';
    setTimeout(() => popup.classList.add('hidden'), 400);
  }, 4000);
}

$('item-popup-close') && $('item-popup-close').addEventListener('click', () => {
  const popup = $('item-popup');
  popup.style.opacity = '0';
  setTimeout(() => popup.classList.add('hidden'), 400);
});

// ===== TIMER =====
function startTimer() { S.timer.start = Date.now(); S.timer.running = true; }
function updateTimer() {
  if (!S.timer.running) return;
  S.timer.elapsed = Date.now() - S.timer.start;
  const el = $('timer-text');
  if (el) el.textContent = formatTime(S.timer.elapsed);
}

// ===== HUD =====
$('back-to-hub') && $('back-to-hub').addEventListener('click', () => {
  showConfirm('Return to hub? Your progress will be lost.', () => {
    window.location.href = 'index.html';
  });
});

function showConfirm(msg, onYes) {
  $('confirm-message').textContent = msg;
  $('confirm-yes').onclick = () => { closePanel('confirm-popup'); onYes(); };
  $('confirm-no').onclick = () => closePanel('confirm-popup');
  openPanel('confirm-popup');
}

// ===== WIN =====
function triggerWin() {
  if (S.completed) return;
  S.completed = true;
  S.timer.running = false;
  const elapsed = S.timer.elapsed;

  $('win-ascii').textContent = `
  +---------+
  | ESCAPED |
  +---------+`;
  $('win-time-display').textContent = formatTime(elapsed);
  $('win-message').textContent = S.isFool
    ? "You escaped the April Fools version. Something was definitely off."
    : "You escaped. Time recorded.";

  $('win-screen').classList.remove('hidden');
  if (!S.uid) $('win-save').style.display = 'none';
  else $('win-save').style.display = '';

  $('win-save').onclick = () => saveTime(elapsed);
  $('win-replay').onclick = () => { $('win-screen').classList.add('hidden'); resetGame(); };
  $('win-hub').onclick = () => window.location.href = 'index.html';
}

async function saveTime(elapsed) {
  if (S.savedTime) { toast('Already saved!', 'info'); return; }
  if (!S.uid) { toast('Sign in to save.', 'error'); return; }
  const col = S.isFool ? 'april_times_fool' : 'april_times_normal';
  try {
    const ref = window.firebaseDoc(window.firebaseDb, col, S.uid);
    const existing = await window.firebaseGetDoc(ref);
    if (existing.exists()) { toast('Already have a saved time — only first counts!', 'info'); return; }
    await window.firebaseSetDoc(ref, {
      uid: S.uid, codename: S.codename, time: elapsed, ts: Date.now(), isFool: S.isFool
    });
    S.savedTime = true;
    $('win-save').textContent = '✓ Saved!';
    $('win-save').disabled = true;
    toast('Time saved to leaderboard!', 'success');
  } catch(e) {
    toast('Failed to save. Check your connection.', 'error');
  }
}

function resetGame() {
  S.inventory = []; S.unlockedDoors = {}; S.solvedPuzzles = {};
  S.searchedCovers = {}; S.openedSafes = {}; S.flags = {};
  S.easterEggClicks = {}; S.easterEggTriggered = {}; S.wrongSafeAttempts = {};
  S.completed = false; S.savedTime = true; // block save on replay
  S.rooms = deepClone(window.GAME_ROOMS);
  S.timer = { running: true, start: Date.now(), elapsed: 0 };
  const startId = S.isFool ? START_ROOM_FOOL : START_ROOM_NORMAL;
  loadRoom(startId);
  renderInventory();
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeActivePanel();
  if (e.key === 'ArrowLeft') navigate('left');
  if (e.key === 'ArrowRight') navigate('right');
});

// ===== INIT =====
showTutorial();

})();
