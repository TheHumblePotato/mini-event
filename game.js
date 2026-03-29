// ===== game.js — Escape Room Engine =====
// Handles: tutorial, rendering, interaction, puzzles, inventory, timer, win, save.

(function() {
'use strict';

// ===== CONFIGURATION =====
const APRIL_FOOLS_START = new Date('2025-04-01T00:00:00-07:00');
const APRIL_FOOLS_END   = new Date('2025-04-07T00:00:00-07:00');
const START_ROOM_NORMAL = 'study';
const START_ROOM_FOOL   = 'fool_study';

// ===== STATE =====
const S = {
  isFool: false,
  currentRoom: null,
  inventory: [],        // array of item ids
  unlockedDoors: {},    // doorId → true
  solvedPuzzles: {},    // puzzleId → true
  searchedCovers: {},   // objId → true
  openedSafes: {},      // safeId → true
  flags: {},            // general purpose flags
  timer: { running: false, start: 0, elapsed: 0 },
  completed: false,
  savedTime: false,
  uid: '',
  codename: 'Agent',
  hintIndex: {},        // roomId → hint index
  hoverObj: null,
  selectedItem: null,
  tutorialActive: true,
  tutorialStep: 0,
  // Bulletin board
  bulletin: { notes: [], strings: [], tool: 'note' },
  notes: '',
  // Code entry
  codeEntry: { current: '', target: null, maxLen: 4, callback: null },
};

// ===== DOM =====
const $ = id => document.getElementById(id);
const tutOverlay  = $('tutorial-overlay');
const tutContent  = $('tutorial-content');
const tutStepInd  = $('tutorial-step-indicator');
const tutNext     = $('tutorial-next');
const tutSkip     = $('tutorial-skip');
const gameShell   = $('game-shell');
const canvas      = $('game-canvas');
const ctx         = canvas.getContext('2d');
const roomLabel   = $('room-name-display');
const timerText   = $('timer-text');
const logEntries  = $('log-entries');
const objectiveEl = $('objective-text');
const hoverTip    = $('hover-tooltip');
const navLeft     = $('nav-left');
const navRight    = $('nav-right');
const navUp       = $('nav-up');
const navDown     = $('nav-down');
const winScreen   = $('win-screen');
const winTimeDisp = $('win-time-display');
const winMsg      = $('win-message');
const bulletinCanvas = $('bulletin-canvas');
const bctx        = bulletinCanvas ? bulletinCanvas.getContext('2d') : null;
const notesTa     = $('notes-textarea');
const itemSlots   = $('item-slots');
const bulletinNotes=$('bulletin-notes');

// ===== UTILS =====
function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sc = (s % 60).toString().padStart(2, '0');
  const cs = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return `${m}:${sc}.${cs}`;
}

function log(msg, important) {
  const div = document.createElement('div');
  div.className = 'log-entry' + (important ? ' important' : '');
  div.textContent = '> ' + msg;
  logEntries.prepend(div);
  while (logEntries.children.length > 40) logEntries.lastChild.remove();
}

function isAprilFools() {
  const now = new Date();
  return now >= APRIL_FOOLS_START && now < APRIL_FOOLS_END;
}

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

// ===== PANEL SYSTEM =====
const openPanels = new Set();

function openPanel(id) {
  const el = $(id);
  if (!el) return;
  el.classList.remove('hidden');
  openPanels.add(id);
  bringToFront(el);
}
function closePanel(id) {
  const el = $(id);
  if (!el) return;
  el.classList.add('hidden');
  openPanels.delete(id);
}
function bringToFront(el) {
  let max = 500;
  document.querySelectorAll('.panel').forEach(p => {
    const z = parseInt(p.style.zIndex) || 500;
    if (z > max) max = z;
  });
  el.style.zIndex = max + 1;
}

// Make panels draggable
function makeDraggable(panel) {
  const header = panel.querySelector('.panel-header');
  if (!header) return;
  let ox, oy, dragging = false;
  header.addEventListener('mousedown', e => {
    if (e.target.classList.contains('panel-close')) return;
    dragging = true;
    const rect = panel.getBoundingClientRect();
    ox = e.clientX - rect.left;
    oy = e.clientY - rect.top;
    bringToFront(panel);
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    panel.style.left = (e.clientX - ox) + 'px';
    panel.style.top  = (e.clientY - oy) + 'px';
    panel.style.right = 'auto';
  });
  document.addEventListener('mouseup', () => { dragging = false; });
}

document.querySelectorAll('.panel').forEach(p => {
  makeDraggable(p);
  p.querySelector('.panel-close') && p.querySelector('.panel-close').addEventListener('click', function() {
    closePanel(this.dataset.panel);
  });
});

// Close all .panel-close buttons
document.querySelectorAll('.panel-close').forEach(btn => {
  btn.addEventListener('click', () => closePanel(btn.dataset.panel));
});

// ===== TUTORIAL =====
function showTutorial() {
  S.tutorialActive = true;
  S.tutorialStep = 0;
  renderTutStep();
  tutOverlay.style.display = 'flex';
}

function renderTutStep() {
  const steps = window.GAME_TUTORIAL;
  const step = steps[S.tutorialStep];
  tutStepInd.textContent = `STEP ${S.tutorialStep + 1} / ${steps.length}`;
  tutContent.innerHTML = step.html;
  tutNext.textContent = S.tutorialStep === steps.length - 1 ? 'Start Game →' : 'Next →';
}

tutNext && tutNext.addEventListener('click', () => {
  const steps = window.GAME_TUTORIAL;
  if (S.tutorialStep < steps.length - 1) {
    S.tutorialStep++;
    renderTutStep();
  } else {
    endTutorial();
  }
});
tutSkip && tutSkip.addEventListener('click', endTutorial);

function endTutorial() {
  tutOverlay.style.display = 'none';
  S.tutorialActive = false;
  startGameEngine();
}

// ===== GAME INIT =====
function startGameEngine() {
  S.isFool = isAprilFools();
  if (S.isFool) document.body.classList.add('april-fools');

  S.uid = sessionStorage.getItem('april_uid') || '';
  S.codename = sessionStorage.getItem('april_codename') || 'Agent';

  // Init hint indices
  Object.keys(window.GAME_HINTS).forEach(r => { S.hintIndex[r] = 0; });

  // Deep clone rooms so state mutations are local
  S.rooms = deepClone(window.GAME_ROOMS);

  const startId = S.isFool ? START_ROOM_FOOL : START_ROOM_NORMAL;
  loadRoom(startId);

  gameShell.classList.remove('hidden');
  resizeCanvas();
  startTimer();
  requestAnimationFrame(renderLoop);

  log('You find yourself locked in a room.', true);
}

// ===== ROOM LOADING =====
function loadRoom(roomId) {
  S.currentRoom = roomId;
  const room = S.rooms[roomId];
  if (!room) { console.error('Room not found:', roomId); return; }

  roomLabel.textContent = room.label;
  objectiveEl.textContent = room.objective || 'Look around.';

  updateNavArrows();
  renderRoom();
  log(`Entered: ${room.label}`);
}

function updateNavArrows() {
  const room = S.rooms[S.currentRoom];
  const c = room.connections || {};
  navLeft.classList.toggle('hidden', !c.left);
  navRight.classList.toggle('hidden', !c.right);
  navUp.classList.toggle('hidden', !c.up);
  navDown.classList.toggle('hidden', !c.down);
}

navLeft.addEventListener('click',  () => navigate('left'));
navRight.addEventListener('click', () => navigate('right'));
navUp.addEventListener('click',    () => navigate('up'));
navDown.addEventListener('click',  () => navigate('down'));

function navigate(dir) {
  const room = S.rooms[S.currentRoom];
  const dest = room.connections && room.connections[dir];
  if (dest) loadRoom(dest);
}

// ===== CANVAS RENDERING =====
function resizeCanvas() {
  const vp = $('game-viewport');
  if (!vp) return;
  const rect = vp.getBoundingClientRect();
  const aspect = 16 / 9;
  let w = rect.width - 60, h = rect.height - 40;
  if (w / h > aspect) w = h * aspect;
  else h = w / aspect;
  canvas.width = Math.floor(w);
  canvas.height = Math.floor(h);
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
}

window.addEventListener('resize', () => { resizeCanvas(); renderRoom(); });

function renderLoop() {
  updateTimer();
  renderRoom();
  requestAnimationFrame(renderLoop);
}

function renderRoom() {
  if (!S.currentRoom) return;
  const room = S.rooms[S.currentRoom];
  const W = canvas.width, H = canvas.height;

  // Background
  ctx.fillStyle = room.bg || '#0b1a0b';
  ctx.fillRect(0, 0, W, H);

  if (room.bgSprite) {
    // Draw background sprite if provided
    const img = getSprite(room.bgSprite);
    if (img && img.complete) ctx.drawImage(img, 0, 0, W, H);
  }

  // Draw grid texture (subtle)
  ctx.strokeStyle = 'rgba(0,255,65,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Draw each object
  room.objects.forEach(obj => {
    drawObject(obj, W, H);
  });

  // Hover highlight
  if (S.hoverObj) {
    const obj = S.hoverObj;
    const ox = obj.x * W, oy = obj.y * H, ow = obj.w * W, oh = obj.h * H;
    ctx.strokeStyle = 'rgba(0,255,65,0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox - 1, oy - 1, ow + 2, oh + 2);
  }
}

const spriteCache = {};
function getSprite(path) {
  if (!path) return null;
  if (!spriteCache[path]) {
    const img = new Image();
    img.src = path;
    img.onload = () => renderRoom();
    spriteCache[path] = img;
  }
  return spriteCache[path];
}

function drawObject(obj, W, H) {
  const ox = obj.x * W, oy = obj.y * H, ow = obj.w * W, oh = obj.h * H;

  if (obj.sprite) {
    const img = getSprite(obj.sprite);
    if (img && img.complete) {
      ctx.drawImage(img, ox, oy, ow, oh);
    } else {
      drawPlaceholder(obj, ox, oy, ow, oh);
    }
  } else {
    drawPlaceholder(obj, ox, oy, ow, oh);
  }

  // Overlay indicators
  drawObjectIndicator(obj, ox, oy, ow, oh);
}

function drawPlaceholder(obj, ox, oy, ow, oh) {
  const col = obj.colour || '#1a3320';
  ctx.fillStyle = col;
  ctx.fillRect(ox, oy, ow, oh);
  ctx.strokeStyle = 'rgba(0,255,65,0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(ox, oy, ow, oh);

  // Label in placeholder
  ctx.fillStyle = 'rgba(0,255,65,0.5)';
  ctx.font = `${Math.max(9, Math.min(14, ow / 8))}px 'Share Tech Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Word-wrap the label
  const words = obj.label.split(' ');
  const lineH = 14;
  const lines = [];
  let cur = '';
  words.forEach(w => {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > ow - 8) { lines.push(cur); cur = w; }
    else cur = test;
  });
  if (cur) lines.push(cur);
  const totalH = lines.length * lineH;
  lines.forEach((line, i) => {
    ctx.fillText(line, ox + ow / 2, oy + oh / 2 - totalH / 2 + i * lineH + lineH / 2);
  });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawObjectIndicator(obj, ox, oy, ow, oh) {
  const now = Date.now();
  // Pulse indicator based on type
  let icon = '';
  let col = 'rgba(0,255,65,0.8)';

  if (obj.type === 'door') {
    const solved = S.unlockedDoors[obj.id];
    icon = solved ? '✓' : '🔒';
    col = solved ? 'rgba(0,255,65,0.9)' : 'rgba(255,179,0,0.9)';
  } else if (obj.type === 'safe') {
    icon = S.openedSafes[obj.id] ? '✓' : '🔐';
    col = S.openedSafes[obj.id] ? 'rgba(0,255,65,0.9)' : 'rgba(255,179,0,0.9)';
  } else if (obj.type === 'cover') {
    icon = S.searchedCovers[obj.id] ? '✓' : '🔍';
    col = S.searchedCovers[obj.id] ? 'rgba(100,100,100,0.5)' : 'rgba(0,255,65,0.8)';
  } else if (obj.type === 'puzzle') {
    icon = S.solvedPuzzles[obj.puzzleId] ? '✓' : '⚙';
    col = S.solvedPuzzles[obj.puzzleId] ? 'rgba(0,255,65,0.9)' : 'rgba(0,200,255,0.9)';
  } else if (obj.type === 'note') {
    icon = '📝';
  } else if (obj.type === 'pickup') {
    icon = '◈';
    // pulsing glow
    const pulse = 0.5 + 0.5 * Math.sin(now / 400);
    col = `rgba(255,179,0,${0.6 + 0.4 * pulse})`;
  }

  if (icon) {
    ctx.font = '12px monospace';
    ctx.fillStyle = col;
    ctx.fillText(icon, ox + 3, oy + 13);
  }
}

// ===== MOUSE INTERACTION =====
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / (rect.right - rect.left);
  const my = (e.clientY - rect.top) / (rect.bottom - rect.top);
  const obj = getObjectAt(mx, my);
  S.hoverObj = obj;
  if (obj && obj.type !== 'prop') {
    hoverTip.textContent = obj.label + (obj.type === 'cover' && S.searchedCovers[obj.id] ? ' (searched)' : '');
    hoverTip.classList.remove('hidden');
    canvas.style.cursor = 'pointer';
  } else {
    hoverTip.classList.add('hidden');
    canvas.style.cursor = 'crosshair';
  }
});

canvas.addEventListener('mouseleave', () => {
  S.hoverObj = null;
  hoverTip.classList.add('hidden');
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
  // Iterate in reverse to hit top-drawn objects first
  for (let i = room.objects.length - 1; i >= 0; i--) {
    const obj = room.objects[i];
    if (mx >= obj.x && mx <= obj.x + obj.w && my >= obj.y && my <= obj.y + obj.h) {
      return obj;
    }
  }
  return null;
}

// ===== INTERACTION DISPATCH =====
function interactWith(obj) {
  switch (obj.type) {
    case 'cover':   interactCover(obj); break;
    case 'safe':    interactSafe(obj); break;
    case 'door':    interactDoor(obj); break;
    case 'puzzle':  interactPuzzle(obj); break;
    case 'note':    interactNote(obj); break;
    case 'pickup':  interactPickup(obj); break;
    case 'device':  interactDevice(obj); break;
    default:        showNotice(obj.label, obj.description || 'Nothing interesting.', []); break;
  }
}

// ---- COVER ----
function interactCover(obj) {
  if (S.searchedCovers[obj.id]) {
    showNotice(obj.label, obj.description + '\n\n[Already searched — nothing more here.]', []);
    return;
  }
  const actions = [
    { label: '🔍 Search', cb: () => doSearch(obj) },
  ];
  // Use item if compatible
  if (S.selectedItem) {
    const item = window.GAME_ITEMS[S.selectedItem];
    if (item && item.useWith && item.useWith.includes(obj.id)) {
      actions.push({ label: `Use ${item.name}`, cb: () => useItemOn(S.selectedItem, obj), cls: 'pickup-btn' });
    }
  }
  showNotice(obj.label, obj.description, actions);
}

function doSearch(obj) {
  closePanel('notice-popup');
  S.searchedCovers[obj.id] = true;
  if (!obj.contains || obj.contains.length === 0) {
    log(`Searched ${obj.label} — nothing found.`);
    showNotice(obj.label, 'You search thoroughly. Nothing here.', []);
    return;
  }
  const found = obj.contains.filter(entry => !S.flags['found_' + entry.item]);
  if (found.length === 0) {
    showNotice(obj.label, 'Already taken everything from here.', []);
    return;
  }
  let msg = 'You find: ';
  const names = [];
  found.forEach(entry => {
    addItem(entry.item);
    S.flags['found_' + entry.item] = true;
    names.push(window.GAME_ITEMS[entry.item]?.name || entry.item);
  });
  msg += names.join(', ') + '.';
  log(`Found: ${names.join(', ')}`, true);
  showNotice(obj.label, msg, []);
}

// ---- SAFE ----
function interactSafe(obj) {
  if (S.openedSafes[obj.id]) {
    showNotice(obj.label, 'Already open. You already took what was inside.', []);
    return;
  }
  const actions = [
    { label: '🔢 Enter Code', cb: () => { closePanel('notice-popup'); openCodePopup(obj); } },
  ];
  if (S.selectedItem) {
    const item = window.GAME_ITEMS[S.selectedItem];
    if (item && item.useWith && item.useWith.includes(obj.id)) {
      actions.push({ label: `Use ${item.name}`, cb: () => useItemOn(S.selectedItem, obj), cls: 'pickup-btn' });
    }
  }
  showNotice(obj.label, obj.description, actions);
}

// ---- DOOR ----
function interactDoor(obj) {
  if (S.unlockedDoors[obj.id] || !obj.locked) {
    navigate(directionOf(obj.leadsTo));
    if (obj.leadsTo === '__EXIT__') triggerWin();
    return;
  }
  // Check if unlocked by puzzle
  if (obj.unlockedBy && S.solvedPuzzles[obj.unlockedBy]) {
    S.unlockedDoors[obj.id] = true;
    log(obj.unlockedMessage || 'Door opened.', true);
    if (obj.leadsTo === '__EXIT__') { triggerWin(); return; }
    if (obj.leadsTo) loadRoom(obj.leadsTo);
    return;
  }
  // Check key item
  if (obj.keyItem && S.inventory.includes(obj.keyItem)) {
    const actions = [
      { label: `🗝️ Use ${window.GAME_ITEMS[obj.keyItem]?.name || obj.keyItem}`, cb: () => { unlockDoorWithKey(obj); closePanel('notice-popup'); }, cls: 'pickup-btn' },
    ];
    showNotice(obj.label, obj.description, actions);
    return;
  }
  // Check code
  if (obj.code) {
    const actions = [
      { label: '🔢 Enter Code', cb: () => { closePanel('notice-popup'); openCodePopup(obj); } },
    ];
    showNotice(obj.label, obj.lockedMessage || 'Locked.', actions);
    return;
  }
  showNotice(obj.label, obj.lockedMessage || 'Locked.', []);
}

function directionOf(roomId) {
  if (roomId === '__EXIT__') return null;
  const room = S.rooms[S.currentRoom];
  const c = room.connections || {};
  for (const [dir, id] of Object.entries(c)) {
    if (id === roomId) return dir;
  }
  return null;
}

function unlockDoorWithKey(obj) {
  S.unlockedDoors[obj.id] = true;
  // Consume key? (optional — for this design we keep it)
  log(obj.unlockedMessage || 'Door unlocked with key.', true);
  if (obj.leadsTo === '__EXIT__') { triggerWin(); return; }
  if (obj.leadsTo) loadRoom(obj.leadsTo);
}

// ---- NOTE ----
function interactNote(obj) {
  const hasUV = S.inventory.includes('uv_light');
  let text = obj.description || '';
  if (obj.uvText && hasUV) text += '\n\n🔦 [UV Light reveals]: ' + obj.uvText;
  const actions = [];
  if (obj.uvText && !hasUV) text += '\n\n[Some writing is faint — maybe you need something to see it better.]';
  showNotice(obj.label, text, actions);
}

// ---- PICKUP ----
function interactPickup(obj) {
  if (S.flags['picked_' + obj.id]) {
    showNotice(obj.label, 'Already taken.', []);
    return;
  }
  addItem(obj.itemId);
  S.flags['picked_' + obj.id] = true;
  log(`Picked up: ${window.GAME_ITEMS[obj.itemId]?.name || obj.itemId}`, true);
  showNotice(obj.label, `You pick up the ${window.GAME_ITEMS[obj.itemId]?.name || obj.itemId}.`, []);
}

// ---- DEVICE ----
function interactDevice(obj) {
  // Extensible — forward to puzzle or custom handler
  if (obj.puzzleId) interactPuzzle(obj);
  else showNotice(obj.label, obj.description || 'A device.', []);
}

// ===== PUZZLE ENGINE =====
function interactPuzzle(obj) {
  const puzzleId = obj.puzzleId;
  if (!puzzleId) { showNotice(obj.label, obj.description || '...', []); return; }
  if (S.solvedPuzzles[puzzleId]) {
    showNotice(obj.label, (obj.description || '') + '\n\n[Already solved ✓]', []);
    return;
  }
  const puzzle = window.GAME_PUZZLES[puzzleId];
  if (!puzzle) { showNotice(obj.label, obj.description || '...', []); return; }

  switch (puzzle.type) {
    case 'morse':    openMorsePuzzle(puzzle, obj); break;
    case 'sequence': openSequencePuzzle(puzzle, obj); break;
    case 'wires':    openWiresPuzzle(puzzle, obj); break;
    case 'slider':   openSliderPuzzle(puzzle, obj); break;
    case 'clock':    openClockPuzzle(puzzle, obj); break;
    default:         showNotice(obj.label, obj.description + '\n[Puzzle type: ' + puzzle.type + ']', []); break;
  }
}

// ---- MORSE PUZZLE ----
function openMorsePuzzle(puzzle, obj) {
  $('puzzle-title').textContent = puzzle.label;
  const body = $('puzzle-body');
  body.innerHTML = '';

  const msg = puzzle.message; // e.g. 'SUN'
  const morse = { A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..' };
  const sequence = msg.split('').map(c => morse[c] || '').join(' / ');

  const lampDiv = document.createElement('div');
  lampDiv.style.cssText = 'text-align:center;padding:16px;';
  lampDiv.innerHTML = `
    <div id="morse-lamp" style="width:60px;height:60px;border-radius:50%;background:#222;border:2px solid var(--border);margin:0 auto 16px;transition:background 0.05s;"></div>
    <div style="font-size:0.82rem;color:var(--muted);margin-bottom:16px;">Watch the lamp and decode the message.</div>
    <div style="font-size:0.8rem;color:var(--muted);margin-bottom:16px;">· = short &nbsp;&nbsp; — = long &nbsp;&nbsp; / = new letter</div>
    <button id="morse-play" class="btn-primary" style="margin-bottom:12px;">▶ Play Signal</button>
    <div style="margin-top:12px;">
      <input id="morse-answer" placeholder="Type decoded word" style="background:rgba(0,255,65,0.05);border:1px solid var(--border);color:var(--accent);font-family:monospace;padding:8px 12px;width:180px;text-transform:uppercase;text-align:center;" />
      <button id="morse-submit" class="btn-secondary" style="margin-left:8px;">Check</button>
    </div>
    <div id="morse-feedback" style="margin-top:10px;font-size:0.82rem;min-height:16px;"></div>
    <div style="margin-top:8px;font-size:0.75rem;color:var(--muted);">Hint: ${puzzle.hint}</div>
  `;
  body.appendChild(lampDiv);
  openPanel('puzzle-popup');

  const lamp = document.getElementById('morse-lamp');
  let animId = null;

  function flashMorse(seq, done) {
    let i = 0;
    const parts = seq.split('');
    function step() {
      if (i >= parts.length) { lamp.style.background = '#222'; done && done(); return; }
      const ch = parts[i++];
      if (ch === '.') {
        lamp.style.background = '#ffff00';
        animId = setTimeout(() => { lamp.style.background = '#222'; animId = setTimeout(step, 120); }, 160);
      } else if (ch === '-') {
        lamp.style.background = '#ffff00';
        animId = setTimeout(() => { lamp.style.background = '#222'; animId = setTimeout(step, 120); }, 480);
      } else if (ch === ' ') {
        lamp.style.background = '#222';
        animId = setTimeout(step, 300);
      } else if (ch === '/') {
        lamp.style.background = '#222';
        animId = setTimeout(step, 500);
      } else {
        step();
      }
    }
    step();
  }

  document.getElementById('morse-play').onclick = () => {
    if (animId) { clearTimeout(animId); lamp.style.background = '#222'; }
    flashMorse(sequence, null);
  };

  document.getElementById('morse-submit').onclick = () => {
    const ans = document.getElementById('morse-answer').value.trim().toUpperCase();
    const fb = document.getElementById('morse-feedback');
    if (ans === puzzle.message.toUpperCase()) {
      fb.style.color = 'var(--green)';
      fb.textContent = '✓ Correct! ' + puzzle.message;
      solvePuzzle(puzzle, obj);
      setTimeout(() => closePanel('puzzle-popup'), 1200);
    } else {
      fb.style.color = 'var(--red)';
      fb.textContent = '✗ Not quite. Try again.';
    }
  };
}

// ---- SEQUENCE PUZZLE ----
function openSequencePuzzle(puzzle, obj) {
  $('puzzle-title').textContent = puzzle.label;
  const body = $('puzzle-body');
  body.innerHTML = '';
  const entered = [];

  const container = document.createElement('div');
  container.style.cssText = 'padding:16px;';

  const display = document.createElement('div');
  display.style.cssText = 'font-size:2rem;letter-spacing:8px;min-height:48px;text-align:center;margin-bottom:16px;border:1px solid var(--border);padding:8px;border-radius:4px;background:rgba(0,0,0,0.3);';
  display.textContent = '—';

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;';
  puzzle.symbols.forEach((sym, idx) => {
    const btn = document.createElement('button');
    btn.textContent = sym;
    btn.style.cssText = 'font-size:1.8rem;background:rgba(0,255,65,0.05);border:1px solid var(--border);padding:10px;cursor:pointer;border-radius:4px;transition:all 0.1s;';
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
  clearBtn.textContent = 'Clear';
  clearBtn.className = 'btn-secondary';
  clearBtn.style.flex = '1';
  clearBtn.onclick = () => { entered.length = 0; display.textContent = '—'; };

  const submitBtn = document.createElement('button');
  submitBtn.textContent = 'Confirm';
  submitBtn.className = 'btn-primary';
  submitBtn.style.flex = '1';
  submitBtn.onclick = () => {
    const correct = puzzle.solution.every((v, i) => entered[i] === v) && entered.length === puzzle.solution.length;
    if (correct) {
      fb.style.color = 'var(--green)'; fb.textContent = '✓ Correct!';
      solvePuzzle(puzzle, obj);
      setTimeout(() => closePanel('puzzle-popup'), 1000);
    } else {
      fb.style.color = 'var(--red)'; fb.textContent = '✗ Wrong order. Try again.';
      entered.length = 0; display.textContent = '—';
    }
  };
  row.appendChild(clearBtn); row.appendChild(submitBtn);

  const fb = document.createElement('div');
  fb.style.cssText = 'margin-top:10px;font-size:0.82rem;min-height:16px;text-align:center;';
  const hint = document.createElement('div');
  hint.style.cssText = 'margin-top:8px;font-size:0.75rem;color:var(--muted);text-align:center;';
  hint.textContent = puzzle.hint;

  container.appendChild(display); container.appendChild(grid); container.appendChild(row);
  container.appendChild(fb); container.appendChild(hint);
  body.appendChild(container);
  openPanel('puzzle-popup');
}

// ---- WIRES PUZZLE ----
function openWiresPuzzle(puzzle, obj) {
  $('puzzle-title').textContent = puzzle.label;
  const body = $('puzzle-body');
  body.innerHTML = `<div style="padding:16px;">
    <div style="font-size:0.85rem;color:var(--text);margin-bottom:12px;">${puzzle.pairs.map(p=>`<span style="color:${p.colour}">■ ${p.label}</span>`).join(' &nbsp; ')}</div>
    <canvas id="wire-canvas" width="420" height="200" style="border:1px solid var(--border);border-radius:4px;display:block;margin:0 auto;cursor:crosshair;background:rgba(0,0,0,0.3);"></canvas>
    <div style="display:flex;justify-content:space-between;padding:8px 16px;font-size:0.75rem;color:var(--muted);">
      <span>LEFT (connect from)</span><span>RIGHT (connect to)</span>
    </div>
    <div style="text-align:center;margin-top:8px;">
      <button id="wire-submit" class="btn-primary">Confirm Connections</button>
      <button id="wire-clear" class="btn-secondary" style="margin-left:8px;">Reset</button>
    </div>
    <div id="wire-fb" style="text-align:center;margin-top:8px;font-size:0.82rem;min-height:16px;"></div>
    <div style="color:var(--muted);font-size:0.75rem;text-align:center;margin-top:6px;">${puzzle.hint}</div>
  </div>`;
  openPanel('puzzle-popup');

  const wc = document.getElementById('wire-canvas');
  const wctx = wc.getContext('2d');
  const W = wc.width, H = wc.height;
  const pairs = puzzle.pairs;
  const connections = {}; // leftIdx → rightIdx
  let dragging = null; // { fromIdx, currentX, currentY }

  const leftX = 60, rightX = W - 60;
  const spacing = H / (pairs.length + 1);

  function termY(idx) { return spacing * (idx + 1); }

  function drawWires() {
    wctx.clearRect(0, 0, W, H);
    // Draw terminals
    pairs.forEach((p, i) => {
      [leftX, rightX].forEach(tx => {
        wctx.beginPath(); wctx.arc(tx, termY(i), 10, 0, Math.PI*2);
        wctx.fillStyle = p.colour; wctx.fill();
        wctx.strokeStyle = 'rgba(255,255,255,0.3)'; wctx.lineWidth = 2; wctx.stroke();
      });
      wctx.fillStyle = p.colour; wctx.font = '12px monospace';
      wctx.fillText(p.label, leftX + 15, termY(i) + 4);
      wctx.fillText(p.label, rightX - 60, termY(i) + 4);
    });
    // Draw connections
    Object.entries(connections).forEach(([li, ri]) => {
      const p = pairs[li];
      wctx.beginPath(); wctx.moveTo(leftX, termY(li)); wctx.lineTo(rightX, termY(ri));
      wctx.strokeStyle = p.colour; wctx.lineWidth = 3; wctx.stroke();
    });
    // Draw dragging wire
    if (dragging) {
      const p = pairs[dragging.fromIdx];
      wctx.beginPath(); wctx.moveTo(leftX, termY(dragging.fromIdx));
      wctx.lineTo(dragging.x, dragging.y);
      wctx.strokeStyle = p.colour; wctx.lineWidth = 3; wctx.setLineDash([6,4]); wctx.stroke(); wctx.setLineDash([]);
    }
  }

  wc.addEventListener('mousedown', e => {
    const rect = wc.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    pairs.forEach((p, i) => {
      if (Math.hypot(mx - leftX, my - termY(i)) < 14) {
        delete connections[i]; // remove old connection
        dragging = { fromIdx: i, x: mx, y: my };
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
      if (Math.hypot(mx - rightX, my - termY(i)) < 14) {
        connections[dragging.fromIdx] = i;
      }
    });
    dragging = null; drawWires();
  });

  document.getElementById('wire-clear').onclick = () => { Object.keys(connections).forEach(k => delete connections[k]); drawWires(); };
  document.getElementById('wire-submit').onclick = () => {
    const fb = document.getElementById('wire-fb');
    const sol = puzzle.solution;
    let correct = pairs.every((p, i) => connections[i] !== undefined && pairs[connections[i]].label === sol[p.label]);
    if (correct) {
      fb.style.color = 'var(--green)'; fb.textContent = '✓ All wires connected correctly!';
      solvePuzzle(puzzle, obj);
      setTimeout(() => closePanel('puzzle-popup'), 1000);
    } else {
      fb.style.color = 'var(--red)'; fb.textContent = '✗ Something is wrong. Check your connections.';
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

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  shuffle(cells);

  function render() {
    body.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;';
    const grid = document.createElement('div');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${size},1fr);gap:4px;width:${size*70}px;`;

    cells.forEach((val, idx) => {
      const cell = document.createElement('div');
      cell.style.cssText = `width:70px;height:70px;display:flex;align-items:center;justify-content:center;
        font-family:'VT323',monospace;font-size:2rem;border-radius:4px;cursor:pointer;transition:all 0.1s;
        ${val === 0 ? 'background:rgba(0,0,0,0.3);border:1px dashed rgba(0,255,65,0.15);' : 'background:rgba(0,255,65,0.08);border:1px solid rgba(0,255,65,0.3);color:var(--accent);'}`;
      cell.textContent = val === 0 ? '' : val;
      if (val !== 0) cell.onclick = () => trySlide(idx);
      grid.appendChild(cell);
    });

    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:0.75rem;color:var(--muted);text-align:center;';
    hint.textContent = puzzle.hint;
    const fb = document.createElement('div');
    fb.id = 'slider-fb'; fb.style.cssText = 'font-size:0.82rem;min-height:16px;text-align:center;';

    wrap.appendChild(grid); wrap.appendChild(hint); wrap.appendChild(fb);
    body.appendChild(wrap);
  }

  function trySlide(idx) {
    const emptyIdx = cells.indexOf(0);
    const row = Math.floor(idx / size), col = idx % size;
    const eRow = Math.floor(emptyIdx / size), eCol = emptyIdx % size;
    if ((Math.abs(row - eRow) === 1 && col === eCol) || (Math.abs(col - eCol) === 1 && row === eRow)) {
      [cells[idx], cells[emptyIdx]] = [cells[emptyIdx], cells[idx]];
      render();
      checkSliderWin();
    }
  }

  function checkSliderWin() {
    const sol = puzzle.solution;
    if (cells.every((v, i) => v === sol[i])) {
      const fb = document.getElementById('slider-fb');
      if (fb) { fb.style.color = 'var(--green)'; fb.textContent = '✓ Solved!'; }
      solvePuzzle(puzzle, obj);
      setTimeout(() => closePanel('puzzle-popup'), 1200);
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
    <canvas id="clock-canvas" width="200" height="200" style="border:1px solid var(--border);border-radius:50%;cursor:crosshair;"></canvas>
    <div style="display:flex;gap:12px;align-items:center;">
      <div><div style="font-size:0.75rem;color:var(--muted);margin-bottom:4px;">HOURS</div>
        <div style="display:flex;gap:4px;">
          <button class="btn-secondary" id="h-dec" style="padding:4px 10px;">◄</button>
          <span id="h-val" style="font-family:'VT323',monospace;font-size:1.8rem;color:var(--accent);min-width:32px;text-align:center;">12</span>
          <button class="btn-secondary" id="h-inc" style="padding:4px 10px;">►</button>
        </div>
      </div>
      <div style="font-size:2rem;color:var(--muted);">:</div>
      <div><div style="font-size:0.75rem;color:var(--muted);margin-bottom:4px;">MINUTES</div>
        <div style="display:flex;gap:4px;">
          <button class="btn-secondary" id="m-dec" style="padding:4px 10px;">◄</button>
          <span id="m-val" style="font-family:'VT323',monospace;font-size:1.8rem;color:var(--accent);min-width:32px;text-align:center;">00</span>
          <button class="btn-secondary" id="m-inc" style="padding:4px 10px;">►</button>
        </div>
      </div>
    </div>
    <button id="clock-submit" class="btn-primary">Set Time</button>
    <div id="clock-fb" style="font-size:0.82rem;min-height:16px;"></div>
    <div style="font-size:0.75rem;color:var(--muted);">${puzzle.hint}</div>
  </div>`;
  openPanel('puzzle-popup');

  const cc = document.getElementById('clock-canvas');
  const cctx = cc.getContext('2d');

  function drawClock() {
    const cx = 100, cy = 100, r = 90;
    cctx.clearRect(0, 0, 200, 200);
    cctx.fillStyle = '#000'; cctx.beginPath(); cctx.arc(cx, cy, r, 0, Math.PI*2); cctx.fill();
    cctx.strokeStyle = 'var(--border)'; cctx.lineWidth = 2;
    cctx.beginPath(); cctx.arc(cx, cy, r, 0, Math.PI*2); cctx.stroke();
    // Tick marks
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      cctx.beginPath(); cctx.moveTo(cx + Math.cos(a) * 80, cy + Math.sin(a) * 80);
      cctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      cctx.strokeStyle = 'rgba(0,255,65,0.4)'; cctx.lineWidth = 2; cctx.stroke();
    }
    // Hour hand
    const ha = ((selH % 12 + selM / 60) / 12) * Math.PI * 2 - Math.PI / 2;
    cctx.beginPath(); cctx.moveTo(cx, cy); cctx.lineTo(cx + Math.cos(ha) * 52, cy + Math.sin(ha) * 52);
    cctx.strokeStyle = 'var(--accent)'; cctx.lineWidth = 4; cctx.stroke();
    // Minute hand
    const ma = (selM / 60) * Math.PI * 2 - Math.PI / 2;
    cctx.beginPath(); cctx.moveTo(cx, cy); cctx.lineTo(cx + Math.cos(ma) * 76, cy + Math.sin(ma) * 76);
    cctx.strokeStyle = '#fff'; cctx.lineWidth = 2; cctx.stroke();
    // Centre
    cctx.beginPath(); cctx.arc(cx, cy, 4, 0, Math.PI*2); cctx.fillStyle = 'var(--accent)'; cctx.fill();
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
      fb.style.color = 'var(--green)'; fb.textContent = '✓ Correct time set!';
      solvePuzzle(puzzle, obj);
      setTimeout(() => closePanel('puzzle-popup'), 1000);
    } else {
      fb.style.color = 'var(--red)'; fb.textContent = `✗ Not right. The clock reads ${selH}:${selM.toString().padStart(2,'0')}.`;
    }
  };
}

// ===== SOLVE PUZZLE =====
function solvePuzzle(puzzle, obj) {
  S.solvedPuzzles[puzzle.id] = true;
  log(`Solved: ${puzzle.label}`, true);
  if (puzzle.reward) {
    addItem(puzzle.reward);
    log(`Received: ${window.GAME_ITEMS[puzzle.reward]?.name || puzzle.reward}`, true);
  }
  if (puzzle.unlocks) {
    S.unlockedDoors[puzzle.unlocks] = true;
    log(`Unlocked: ${puzzle.unlocks}`);
  }
  // Check if any door in current room is now unlockable by this puzzle
  const room = S.rooms[S.currentRoom];
  room.objects.forEach(o => {
    if (o.type === 'door' && o.unlockedBy === puzzle.id) {
      S.unlockedDoors[o.id] = true;
    }
  });
}

// ===== CODE POPUP =====
function openCodePopup(obj) {
  S.codeEntry.current = '';
  S.codeEntry.target = obj;
  S.codeEntry.maxLen = (obj.code || '0000').length;
  $('code-popup-title').textContent = obj.label;
  $('code-display').textContent = '_'.repeat(S.codeEntry.maxLen);
  $('code-feedback').textContent = '';
  $('code-feedback').className = '';

  const keypad = $('code-keypad');
  keypad.innerHTML = '';
  ['1','2','3','4','5','6','7','8','9','DEL','0','CLR'].forEach(k => {
    const btn = document.createElement('button');
    btn.className = 'keypad-btn' + (k === 'DEL' ? ' del' : k === 'CLR' ? ' clear' : '');
    btn.textContent = k;
    btn.onclick = () => handleKeypad(k);
    keypad.appendChild(btn);
  });
  $('code-submit').onclick = () => submitCode();
  openPanel('code-popup');
}

function handleKeypad(k) {
  if (k === 'DEL') { S.codeEntry.current = S.codeEntry.current.slice(0,-1); }
  else if (k === 'CLR') { S.codeEntry.current = ''; }
  else if (S.codeEntry.current.length < S.codeEntry.maxLen) { S.codeEntry.current += k; }
  const disp = $('code-display');
  disp.textContent = S.codeEntry.current + '_'.repeat(S.codeEntry.maxLen - S.codeEntry.current.length);
  $('code-feedback').textContent = '';
}

function submitCode() {
  const obj = S.codeEntry.target;
  if (!obj) return;
  const entered = S.codeEntry.current;
  const correct = obj.code === entered;
  const fb = $('code-feedback');

  if (correct) {
    fb.className = 'ok'; fb.textContent = '✓ Correct!';
    if (obj.type === 'safe') {
      openSafe(obj);
    } else if (obj.type === 'door') {
      S.unlockedDoors[obj.id] = true;
      log(obj.unlockedMessage || 'Door unlocked.', true);
      setTimeout(() => {
        closePanel('code-popup');
        if (obj.leadsTo === '__EXIT__') triggerWin();
        else if (obj.leadsTo) loadRoom(obj.leadsTo);
      }, 600);
    }
    setTimeout(() => closePanel('code-popup'), 600);
  } else {
    fb.className = ''; fb.textContent = '✗ Wrong code.';
    $('code-display').style.color = 'var(--red)';
    setTimeout(() => { $('code-display').style.color = ''; }, 400);
  }
}

function openSafe(obj) {
  if (S.openedSafes[obj.id]) return;
  S.openedSafes[obj.id] = true;
  log(`Safe opened: ${obj.label}`, true);
  if (obj.contains) {
    const names = [];
    obj.contains.forEach(entry => {
      if (!S.flags['found_' + entry.item]) {
        addItem(entry.item);
        S.flags['found_' + entry.item] = true;
        names.push(window.GAME_ITEMS[entry.item]?.name || entry.item);
      }
    });
    if (names.length) log(`Found inside: ${names.join(', ')}`, true);
  }
}

// ===== ITEM SYSTEM =====
function addItem(itemId) {
  if (!itemId || S.inventory.includes(itemId)) return;
  S.inventory.push(itemId);
  renderInventory();
}

function renderInventory() {
  if (!itemSlots) return;
  itemSlots.innerHTML = '';
  if (S.inventory.length === 0) {
    itemSlots.innerHTML = '<div style="font-size:0.78rem;color:var(--muted);padding:8px;">Empty</div>';
    return;
  }
  S.inventory.forEach(id => {
    const item = window.GAME_ITEMS[id];
    if (!item) return;
    const slot = document.createElement('div');
    slot.className = 'item-slot' + (S.selectedItem === id ? ' selected' : '');
    slot.innerHTML = `<span class="item-icon">${item.icon}</span><span class="item-name">${item.name}</span>`;
    slot.title = item.description;
    slot.onclick = () => {
      S.selectedItem = (S.selectedItem === id) ? null : id;
      renderInventory();
      if (S.selectedItem) log(`Selected: ${item.name}`);
    };
    itemSlots.appendChild(slot);
    // New item animation
    slot.classList.add('new');
    setTimeout(() => slot.classList.remove('new'), 3000);
  });
}

function useItemOn(itemId, obj) {
  const item = window.GAME_ITEMS[itemId];
  closePanel('notice-popup');
  if (!item) return;
  // If it's a key for a door/safe
  if (obj.type === 'door' && obj.keyItem === itemId) { unlockDoorWithKey(obj); return; }
  // Generic "use" message
  log(`Used ${item.name} on ${obj.label}.`);
  showNotice('Used', `You use the ${item.name} on the ${obj.label}. Nothing happened yet.`, []);
}

// ===== NOTICE POPUP =====
function showNotice(title, body, actions) {
  $('notice-title').textContent = title;
  $('notice-body').innerHTML = `<div class="notice-label">${title}</div><p>${body.replace(/\n/g, '<br>')}</p>`;
  const actEl = $('notice-actions');
  actEl.innerHTML = '';
  if (actions && actions.length) {
    actions.forEach(a => {
      const btn = document.createElement('button');
      btn.className = `interact-btn ${a.cls || ''}`;
      btn.textContent = a.label;
      btn.onclick = a.cb;
      actEl.appendChild(btn);
    });
  }
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn-secondary';
  closeBtn.textContent = 'Close';
  closeBtn.style.marginTop = '4px';
  closeBtn.onclick = () => closePanel('notice-popup');
  actEl.appendChild(closeBtn);
  openPanel('notice-popup');
}

// ===== TIMER =====
function startTimer() {
  S.timer.start = Date.now();
  S.timer.running = true;
}

function updateTimer() {
  if (!S.timer.running) return;
  S.timer.elapsed = Date.now() - S.timer.start;
  timerText.textContent = formatTime(S.timer.elapsed);
}

// ===== HUD BUTTONS =====
$('hud-inventory-btn').onclick = () => {
  if (openPanels.has('inventory-panel')) closePanel('inventory-panel');
  else { openPanel('inventory-panel'); renderInventory(); initBulletin(); }
};
$('hud-notes-btn').onclick = () => {
  if (openPanels.has('notes-panel')) closePanel('notes-panel');
  else { openPanel('notes-panel'); notesTa.value = S.notes; }
};
notesTa && notesTa.addEventListener('input', () => { S.notes = notesTa.value; });
$('back-to-hub').onclick = () => {
  if (confirm('Return to hub? Your progress will be lost.')) window.location.href = 'index.html';
};
$('hud-hint-btn').onclick = showHint;

function showHint() {
  const room = S.currentRoom;
  const hints = window.GAME_HINTS[room];
  if (!hints) { showNotice('Hint', 'No hints for this room.', []); return; }
  const idx = S.hintIndex[room] || 0;
  const hint = hints[idx] || hints[hints.length - 1];
  S.hintIndex[room] = Math.min(idx + 1, hints.length - 1);
  showNotice('💡 Hint', hint, []);
  log('Hint used.', false);
}

// ===== BULLETIN BOARD =====
function initBulletin() {
  if (!bulletinCanvas) return;
  const wrap = $('bulletin-canvas-wrap');
  bulletinCanvas.width = wrap.clientWidth || 400;
  bulletinCanvas.height = wrap.clientHeight || 200;
  drawBulletin();
}

function drawBulletin() {
  if (!bctx) return;
  const W = bulletinCanvas.width, H = bulletinCanvas.height;
  bctx.clearRect(0, 0, W, H);
  // Draw strings
  S.bulletin.strings.forEach(s => {
    bctx.beginPath(); bctx.moveTo(s.x1, s.y1); bctx.lineTo(s.x2, s.y2);
    bctx.strokeStyle = 'rgba(255,100,100,0.7)'; bctx.lineWidth = 2; bctx.stroke();
    // Pins
    [{ x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }].forEach(p => {
      bctx.beginPath(); bctx.arc(p.x, p.y, 4, 0, Math.PI*2);
      bctx.fillStyle = '#ff4141'; bctx.fill();
    });
  });
}

let bulletinDrag = null;
bulletinCanvas && bulletinCanvas.addEventListener('mousedown', e => {
  const rect = bulletinCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  if (S.bulletin.tool === 'string') {
    bulletinDrag = { x1: mx, y1: my };
  } else if (S.bulletin.tool === 'erase') {
    S.bulletin.strings = S.bulletin.strings.filter(s =>
      Math.hypot(mx - s.x1, my - s.y1) > 10 && Math.hypot(mx - s.x2, my - s.y2) > 10
    );
    drawBulletin();
  }
});
bulletinCanvas && bulletinCanvas.addEventListener('mouseup', e => {
  if (!bulletinDrag || S.bulletin.tool !== 'string') { bulletinDrag = null; return; }
  const rect = bulletinCanvas.getBoundingClientRect();
  S.bulletin.strings.push({ x1: bulletinDrag.x1, y1: bulletinDrag.y1, x2: e.clientX - rect.left, y2: e.clientY - rect.top });
  bulletinDrag = null;
  drawBulletin();
});

// Bulletin note adding
$('bulletin-toolbar') && $('bulletin-toolbar').addEventListener('click', e => {
  const btn = e.target.closest('.tool-btn');
  if (!btn) return;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  S.bulletin.tool = btn.dataset.tool;
  if (btn.dataset.tool === 'note') {
    const text = prompt('Note text:');
    if (text) {
      const noteEl = document.createElement('div');
      noteEl.className = 'bulletin-note';
      noteEl.textContent = text;
      const del = document.createElement('span');
      del.className = 'note-del'; del.textContent = '✕';
      del.onclick = () => noteEl.remove();
      noteEl.appendChild(del);
      bulletinNotes && bulletinNotes.appendChild(noteEl);
      S.bulletin.notes.push(text);
    }
  }
});

// ===== WIN =====
function triggerWin() {
  if (S.completed) return;
  S.completed = true;
  S.timer.running = false;
  const elapsed = S.timer.elapsed;

  const ascii = `
  +---------+
  | ESCAPED |
  +---------+`;
  $('win-ascii').textContent = ascii;
  $('win-time-display').textContent = formatTime(elapsed);
  $('win-message').textContent = S.isFool
    ? "You escaped the April Fools version. Something was definitely off."
    : "You found the way out. Time recorded.";

  winScreen.classList.remove('hidden');
  log('ESCAPED!', true);

  // Auto-offer save if logged in
  if (S.uid) {
    $('win-save').style.display = '';
  } else {
    $('win-save').style.display = 'none';
  }

  $('win-save').onclick = () => saveTime(elapsed);
  $('win-replay').onclick = () => {
    winScreen.classList.add('hidden');
    // Reset state but don't save
    resetGame(false);
  };
  $('win-hub').onclick = () => { window.location.href = 'index.html'; };
}

async function saveTime(elapsed) {
  if (S.savedTime) { alert('Already saved!'); return; }
  if (!S.uid) { alert('Sign in to save.'); return; }

  const col = S.isFool ? 'april_times_fool' : 'april_times_normal';
  try {
    const ref = window.firebaseDoc(window.firebaseDb, col, S.uid);
    const existing = await window.firebaseGetDoc(ref);
    if (existing.exists()) {
      alert('You already have a saved time! Only first completion counts.');
      return;
    }
    await window.firebaseSetDoc(ref, {
      uid: S.uid, codename: S.codename,
      time: elapsed, ts: Date.now(),
      isFool: S.isFool
    });
    S.savedTime = true;
    $('win-save').textContent = '✓ Saved!';
    $('win-save').disabled = true;
    log('Time saved to leaderboard.', true);
  } catch(e) {
    console.error(e);
    alert('Failed to save. Check your connection.');
  }
}

function resetGame(saveOk) {
  // Reset mutable state
  S.inventory = [];
  S.unlockedDoors = {};
  S.solvedPuzzles = {};
  S.searchedCovers = {};
  S.openedSafes = {};
  S.flags = {};
  S.completed = false;
  S.savedTime = !saveOk; // block saving on replay
  S.hintIndex = {};
  S.rooms = deepClone(window.GAME_ROOMS);
  S.timer = { running: true, start: Date.now(), elapsed: 0 };
  Object.keys(window.GAME_HINTS).forEach(r => { S.hintIndex[r] = 0; });
  const startId = S.isFool ? START_ROOM_FOOL : START_ROOM_NORMAL;
  loadRoom(startId);
  renderInventory();
  logEntries.innerHTML = '';
  log('New run started.', true);
}

// ===== INIT =====
showTutorial();

})();
