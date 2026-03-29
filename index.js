// ===== April -1st Mini Event — Hub =====

const PT_TZ = 'America/Los_Angeles';
const nowPT = () => new Date(new Date().toLocaleString('en-US', { timeZone: PT_TZ }));

// Date gates
const EVENT_START  = new Date('2025-03-30T00:00:00-07:00');
const APRIL_FOOLS_START = new Date('2025-04-01T00:00:00-07:00');
const APRIL_FOOLS_END   = new Date('2025-04-07T00:00:00-07:00');
const EVENT_END    = new Date('2025-04-30T23:59:59-07:00');

function isAprilFools() {
  const n = nowPT();
  return n >= APRIL_FOOLS_START && n < APRIL_FOOLS_END;
}
function isEventLive() {
  const n = nowPT();
  return n >= EVENT_START && n <= EVENT_END;
}

// ---- State ----
let currentUser = null;
let userData = null;
let authInitialized = false;
let currentLbTab = 'normal';

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
const countdownEl     = document.getElementById('countdown');
const startBtn        = document.getElementById('start-game-btn');

// ---- Apply April Fools theme ----
function applyTheme() {
  if (isAprilFools()) {
    document.body.classList.add('april-fools');
    document.title = '???? Mini Event';
  }
}

// ---- Countdown ----
function updateCountdown() {
  if (!countdownEl) return;
  const now = new Date();
  const diff = EVENT_END - now;
  if (diff <= 0) { countdownEl.textContent = 'ENDED'; return; }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000).toString().padStart(2,'0');
  const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2,'0');
  const s = Math.floor((diff % 60000) / 1000).toString().padStart(2,'0');
  countdownEl.textContent = d > 0 ? `${d}d ${h}:${m}:${s}` : `${h}:${m}:${s}`;
}

// ---- Auth ----
async function signInWithGoogle() {
  try {
    const result = await window.firebaseSignInWithPopup(window.firebaseAuth, window.googleProvider);
    await handleUser(result.user);
  } catch (e) { console.error(e); }
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
  });
}

function initAuthObserver() {
  window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
    if (user) { handleUser(user); }
    else {
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
    const q = window.firebaseQuery(window.firebaseCollection(window.firebaseDb, col), window.firebaseOrderBy('time', 'asc'));
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
      tr.innerHTML = `<td>${i + 1}</td><td>${r.codename || 'Agent'}</td><td>${formatTime(r.time)}</td><td>${when}</td>`;
      leaderboardBody.appendChild(tr);
    });
  } catch(e) { leaderboardBody.innerHTML = '<tr><td colspan="4" style="color:#ff4141;">Error loading.</td></tr>'; }
}

// ---- Background matrix rain ----
function initBackground() {
  const bg = document.getElementById('background');
  if (!bg) return;
  const chars = '01アイウエオカキクケコ@#$%&ABCXYZ?!<>';
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('span');
    el.className = 'term-char';
    el.textContent = chars[Math.floor(Math.random() * chars.length)];
    el.style.left = `${Math.random() * 100}%`;
    el.style.top = `${Math.random() * 100}%`;
    el.style.fontSize = `${10 + Math.random() * 14}px`;
    el.style.animationDuration = `${6 + Math.random() * 12}s`;
    el.style.animationDelay = `${Math.random() * 8}s`;
    bg.appendChild(el);
  }
}

// ---- Game launch ----
function launchGame() {
  if (!isEventLive()) {
    alert('Event not live yet! Check back March 30th.');
    return;
  }
  // Pass login state to game via sessionStorage
  sessionStorage.setItem('april_uid', currentUser ? currentUser.uid : '');
  sessionStorage.setItem('april_codename', userData ? userData.codename : 'Anonymous');
  sessionStorage.setItem('april_is_fool', isAprilFools() ? '1' : '0');
  window.location.href = 'game.html';
}

// ---- Event wiring ----
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

// ---- Init ----
function initApp() {
  applyTheme();
  initBackground();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  if (window.firebaseReady) initAuthObserver();
}

window.initApp = initApp;
if (window.firebaseReady) initApp();
else document.addEventListener('DOMContentLoaded', initApp);
