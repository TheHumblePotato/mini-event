// ===== April -1st Mini Event — Hub =====
'use strict';

const PT_TZ = 'America/Los_Angeles';
const nowPT = () => new Date(new Date().toLocaleString('en-US', { timeZone: PT_TZ }));

const APRIL_FOOLS_START = new Date('2025-04-01T00:00:00-07:00');
const APRIL_FOOLS_END   = new Date('2025-04-07T00:00:00-07:00');
const ADMIN_CODE = 'drfoolery42';

// ---- State ----
let currentUser = null;
let userData = null;
let authInitialized = false;
let currentLbTab = 'normal';
let adminFoolOverride = sessionStorage.getItem('admin_fool') === '1';

// ---- DOM refs ----
const userInfo        = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');
const signOutBtn      = document.getElementById('sign-out-btn');
const signInBtn       = document.getElementById('sign-in-btn');
const loginModal      = document.getElementById('login-modal');
const loginAccept     = document.getElementById('login-accept');
const loginDeny       = document.getElementById('login-deny');
const usernameModal   = document.getElementById('username-modal');
const usernameInput   = document.getElementById('username-input');
const usernameSubmit  = document.getElementById('username-submit');
const leaderboardBtn  = document.getElementById('leaderboard-btn');
const leaderboardModal= document.getElementById('leaderboard-modal');
const leaderboardBody = document.getElementById('leaderboard-body');
const leaderboardClose= document.getElementById('leaderboard-close');
const startBtn        = document.getElementById('start-game-btn');
const adminBtn        = document.getElementById('admin-btn');
const adminModal      = document.getElementById('admin-modal');
const adminInput      = document.getElementById('admin-input');
const adminSubmit     = document.getElementById('admin-submit');
const adminClose      = document.getElementById('admin-close');
const foolStatusText  = document.getElementById('fool-status-text');
const mainTitle       = document.getElementById('main-title');

// ---- Toast System ----
function toast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast-show'));
  setTimeout(() => {
    el.classList.remove('toast-show');
    setTimeout(() => el.remove(), 400);
  }, duration);
}

// ---- Title Logic ----
function getDatePhase() {
  if (adminFoolOverride) return 'april1';
  const n = nowPT();
  const m = n.getMonth(); // 0-indexed: 3 = April
  const d = n.getDate();
  if (m === 2 && d === 31) return 'march31'; // technically march has 31 days
  if (m === 2 || (m === 3 && d < 1)) return 'before';
  if (m === 3 && d === 1 && n < APRIL_FOOLS_END) return 'april1';
  if (m === 3 && d >= 2 && n >= APRIL_FOOLS_END) return 'after';
  if (m === 3 && d >= 2) return 'after';
  return 'before';
}

function isAprilFools() {
  if (adminFoolOverride) return true;
  const n = nowPT();
  return n >= APRIL_FOOLS_START && n < APRIL_FOOLS_END;
}

function applyTitleAndTheme() {
  const phase = getDatePhase();
  adminFoolOverride = sessionStorage.getItem('admin_fool') === '1';

  if (phase === 'march31') {
    // April 0th — no red, no special styling
    mainTitle.innerHTML = 'APRIL 0th';
    mainTitle.dataset.text = 'APRIL 0th';
    document.title = 'April 0th';
  } else if (phase === 'april1') {
    // Remove -, make "1st" red
    mainTitle.innerHTML = 'APRIL <span style="color:#ff4141;text-shadow:0 0 20px #ff4141,0 0 40px #ff414180;">1</span>st';
    mainTitle.dataset.text = 'APRIL 1st';
    document.body.classList.add('april-fools');
    document.title = '???? Mini Event';
  } else if (phase === 'after') {
    // April -1st but "1st" bold red
    mainTitle.innerHTML = 'APRIL <span style="color:#ff4141;text-shadow:0 0 20px #ff4141;">-1</span>st';
    mainTitle.dataset.text = 'APRIL -1st';
    document.title = 'April -1st';
  } else {
    // Normal: make the minus red
    mainTitle.innerHTML = 'APRIL <span style="color:#ff4141;text-shadow:0 0 14px #ff414199;">-1</span>st';
    mainTitle.dataset.text = 'APRIL -1st';
    document.title = 'April -1st';
  }

  foolStatusText && (foolStatusText.textContent = isAprilFools() ? 'ON' : 'OFF');
  foolStatusText && (foolStatusText.style.color = isAprilFools() ? 'var(--green)' : 'var(--muted)');
}

// ---- Favicon ----
function setFavicon() {
  const link = document.createElement('link');
  link.rel = 'icon';
  const emoji = isAprilFools() ? '🃏' : '🔒';
  link.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${emoji}</text></svg>`;
  document.head.appendChild(link);
}

// ---- Auth ----
async function signInWithGoogle() {
  try {
    const result = await window.firebaseSignInWithPopup(window.firebaseAuth, window.googleProvider);
    await handleUser(result.user);
  } catch (e) {
    console.error(e);
    toast('Sign-in failed. Try again.', 'error');
  }
}

async function handleUser(user) {
  currentUser = user;
  const ref = window.firebaseDoc(window.firebaseDb, 'april_users', user.uid);
  const snap = await window.firebaseGetDoc(ref);
  if (snap.exists()) {
    userData = snap.data();
    renderLoggedIn();
  } else {
    userData = { email: user.email, codename: user.email.split('@')[0], createdAt: Date.now() };
    showUsernameModal();
  }
}

async function saveCodename(name) {
  if (!currentUser) return;
  userData.codename = name.trim() || userData.codename;
  const ref = window.firebaseDoc(window.firebaseDb, 'april_users', currentUser.uid);
  await window.firebaseSetDoc(ref, userData);
  renderLoggedIn();
  usernameModal.classList.add('hidden');
  toast('Codename saved!', 'success');
}

function renderLoggedIn() {
  usernameDisplay.textContent = userData.codename;
  userInfo.classList.remove('hidden');
  signInBtn.classList.add('hidden');
  loginModal.classList.add('hidden');
}

function signOutUser() {
  window.firebaseSignOut(window.firebaseAuth).then(() => {
    currentUser = null; userData = null;
    userInfo.classList.add('hidden');
    signInBtn.classList.remove('hidden');
    toast('Signed out.', 'info');
  });
}

function initAuthObserver() {
  window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
    if (user) {
      handleUser(user);
    } else {
      currentUser = null; userData = null;
      userInfo.classList.add('hidden');
      signInBtn.classList.remove('hidden');
      if (authInitialized && !localStorage.getItem('aprilNoLogin')) {
        setTimeout(() => loginModal.classList.remove('hidden'), 800);
      }
    }
    authInitialized = true;
  });
}

// ---- Leaderboard ----
function formatTime(ms) {
  if (!ms) return '--';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = (s % 60).toString().padStart(2,'0');
  const cs = Math.floor((ms % 1000) / 10).toString().padStart(2,'0');
  return `${m}:${sec}.${cs}`;
}

async function loadLeaderboard(tab) {
  leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#4d8f5f;">Loading...</td></tr>';
  const col = tab === 'april' ? 'april_times_fool' : 'april_times_normal';
  try {
    const q = window.firebaseQuery(
      window.firebaseCollection(window.firebaseDb, col),
      window.firebaseOrderBy('time', 'asc')
    );
    const snap = await window.firebaseGetDocs(q);
    const rows = [];
    snap.forEach(d => rows.push(d.data()));
    leaderboardBody.innerHTML = '';
    if (!rows.length) {
      leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#4d8f5f;">No completions yet.</td></tr>';
      return;
    }
    rows.slice(0, 50).forEach((r, i) => {
      const tr = document.createElement('tr');
      if (i === 0) tr.className = 'rank-1';
      else if (i === 1) tr.className = 'rank-2';
      else if (i === 2) tr.className = 'rank-3';
      const when = r.ts ? new Date(r.ts).toLocaleDateString() : '';
      tr.innerHTML = `<td>${i+1}</td><td>${r.codename || 'Agent'}</td><td>${formatTime(r.time)}</td><td>${when}</td>`;
      leaderboardBody.appendChild(tr);
    });
  } catch(e) {
    leaderboardBody.innerHTML = '<tr><td colspan="4" style="color:#ff4141;">Error loading.</td></tr>';
  }
}

// ---- Animated BG Canvas ----
function initBgCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], time = 0;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const fool = isAprilFools();
  const baseColor = fool ? '255,65,65' : '0,255,65';

  // Particles: glitch chars falling
  const chars = '01アイウエオ@#$%ABXYZぁぃぅ?!><{}[]';
  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * (W || 800);
      this.y = init ? Math.random() * (H || 600) : -20;
      this.speed = 0.3 + Math.random() * 0.8;
      this.char = chars[Math.floor(Math.random() * chars.length)];
      this.opacity = 0.04 + Math.random() * 0.1;
      this.size = 10 + Math.random() * 12;
      this.drift = (Math.random() - 0.5) * 0.2;
      this.glitchTimer = Math.random() * 200;
    }
    update() {
      this.y += this.speed;
      this.x += this.drift;
      this.glitchTimer--;
      if (this.glitchTimer <= 0) {
        this.char = chars[Math.floor(Math.random() * chars.length)];
        this.glitchTimer = 60 + Math.random() * 200;
      }
      if (this.y > (H || 600) + 20) this.reset(false);
    }
    draw() {
      ctx.save();
      ctx.font = `${this.size}px 'VT323', monospace`;
      ctx.fillStyle = `rgba(${baseColor},${this.opacity})`;
      ctx.fillText(this.char, this.x, this.y);
      ctx.restore();
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  // Horizontal scan lines that slowly move
  let scanY = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = `rgba(${baseColor},0.03)`;
    ctx.lineWidth = 1;
    const grid = 60;
    for (let x = 0; x < W; x += grid) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += grid) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Corner accent lines
    const accent = `rgba(${baseColor},0.15)`;
    ctx.strokeStyle = accent; ctx.lineWidth = 1;
    // top-left
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(120,0); ctx.moveTo(0,0); ctx.lineTo(0,80); ctx.stroke();
    // top-right
    ctx.beginPath(); ctx.moveTo(W,0); ctx.lineTo(W-120,0); ctx.moveTo(W,0); ctx.lineTo(W,80); ctx.stroke();
    // bottom-left
    ctx.beginPath(); ctx.moveTo(0,H); ctx.lineTo(120,H); ctx.moveTo(0,H); ctx.lineTo(0,H-80); ctx.stroke();
    // bottom-right
    ctx.beginPath(); ctx.moveTo(W,H); ctx.lineTo(W-120,H); ctx.moveTo(W,H); ctx.lineTo(W,H-80); ctx.stroke();

    // Moving scan highlight
    scanY = (scanY + 0.4) % H;
    const scanGrad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
    scanGrad.addColorStop(0, `rgba(${baseColor},0)`);
    scanGrad.addColorStop(0.5, `rgba(${baseColor},0.04)`);
    scanGrad.addColorStop(1, `rgba(${baseColor},0)`);
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 60, W, 120);

    // Particles
    particles.forEach(p => { p.update(); p.draw(); });

    // Occasional glitch bar
    time++;
    if (time % 180 < 3) {
      const gy = Math.random() * H;
      const gh = 2 + Math.random() * 4;
      ctx.fillStyle = `rgba(${baseColor},0.08)`;
      ctx.fillRect(0, gy, W, gh);
    }

    requestAnimationFrame(draw);
  }
  draw();
}

// ---- Game launch ----
function launchGame() {
  sessionStorage.setItem('april_uid', currentUser ? currentUser.uid : '');
  sessionStorage.setItem('april_codename', userData ? userData.codename : 'Anonymous');
  sessionStorage.setItem('april_is_fool', isAprilFools() ? '1' : '0');
  window.location.href = 'game.html';
}

// ---- Admin ----
function handleAdmin() {
  const code = adminInput.value.trim();
  if (code === ADMIN_CODE) {
    adminFoolOverride = !adminFoolOverride;
    sessionStorage.setItem('admin_fool', adminFoolOverride ? '1' : '0');
    applyTitleAndTheme();
    toast(`April Fools mode ${adminFoolOverride ? 'ENABLED' : 'DISABLED'}`, 'success');
  } else {
    toast('Invalid code.', 'error');
  }
  adminInput.value = '';
}

// ---- Wiring ----
signInBtn && signInBtn.addEventListener('click', signInWithGoogle);
signOutBtn && signOutBtn.addEventListener('click', signOutUser);
loginAccept && loginAccept.addEventListener('click', signInWithGoogle);
loginDeny && loginDeny.addEventListener('click', () => {
  loginModal.classList.add('hidden');
  localStorage.setItem('aprilNoLogin', '1');
});
usernameSubmit && usernameSubmit.addEventListener('click', () => {
  if (usernameInput.value.trim()) saveCodename(usernameInput.value);
});
usernameInput && usernameInput.addEventListener('keypress', e => {
  if (e.key === 'Enter' && usernameInput.value.trim()) saveCodename(usernameInput.value);
});
leaderboardBtn && leaderboardBtn.addEventListener('click', () => {
  leaderboardModal.classList.remove('hidden');
  loadLeaderboard(currentLbTab);
});
leaderboardClose && leaderboardClose.addEventListener('click', () => leaderboardModal.classList.add('hidden'));
startBtn && startBtn.addEventListener('click', launchGame);
adminBtn && adminBtn.addEventListener('click', () => {
  applyTitleAndTheme();
  adminModal.classList.remove('hidden');
});
adminClose && adminClose.addEventListener('click', () => adminModal.classList.add('hidden'));
adminSubmit && adminSubmit.addEventListener('click', handleAdmin);
adminInput && adminInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleAdmin(); });

document.querySelectorAll('.lb-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentLbTab = tab.dataset.tab;
    loadLeaderboard(currentLbTab);
  });
});

function showUsernameModal() {
  usernameInput.value = userData.codename || '';
  usernameModal.classList.remove('hidden');
}

// Close modals clicking outside
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden');
  });
});

// ---- Init ----
function initApp() {
  applyTitleAndTheme();
  setFavicon();
  initBgCanvas();
  if (window.firebaseReady) initAuthObserver();
}

window.initApp = initApp;
if (window.firebaseReady) initApp();
else document.addEventListener('DOMContentLoaded', initApp);
