// Game data
const games = [
    { day: 1, title: "Pumpkin Jump", date: "Monday", url: "https://thehumblepotato.github.io/mini-event/day_1.html" },
    { day: 2, title: "Fruitoween", date: "Tuesday", url: "https://thehumblepotato.github.io/mini-event/day_2.html" },
    { day: 3, title: "Spooky Crossy Road", date: "Wednesday", url: "https://thehumblepotato.github.io/mini-event/day_3.html" },
    { day: 4, title: "Stock Candies", date: "Thursday", url: "https://thehumblepotato.github.io/mini-event/day_4.html" },
    { day: 5, title: "Grave Digger", date: "Friday", url: "https://thehumblepotato.github.io/mini-event/day_5.html" }
];

// Scary images for jumpscares (using scary SVG images)
const scaryImages = [
    // Creepy skull
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23000'/%3E%3Cellipse cx='300' cy='250' rx='150' ry='180' fill='%23fff'/%3E%3Cellipse cx='250' cy='200' rx='40' ry='60' fill='%23000'/%3E%3Cellipse cx='350' cy='200' rx='40' ry='60' fill='%23000'/%3E%3Cpath d='M 270 280 Q 300 300 330 280' stroke='%23000' stroke-width='3' fill='none'/%3E%3Crect x='285' y='300' width='30' height='50' fill='%23000'/%3E%3Crect x='260' y='340' width='20' height='30' fill='%23000'/%3E%3Crect x='320' y='340' width='20' height='30' fill='%23000'/%3E%3Ctext x='300' y='500' font-family='Arial' font-size='40' fill='%23f00' text-anchor='middle' font-weight='bold'%3ESCREAM!%3C/text%3E%3C/svg%3E",
    
    // Bloody eye
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23000'/%3E%3Cellipse cx='300' cy='300' rx='200' ry='140' fill='%23fff' stroke='%23f00' stroke-width='5'/%3E%3Ccircle cx='300' cy='300' rx='80' fill='%23000'/%3E%3Ccircle cx='300' cy='300' rx='50' fill='%23f00'/%3E%3Ccircle cx='310' cy='290' rx='20' fill='%23fff'/%3E%3Cpath d='M 100 250 Q 300 200 500 250' stroke='%23f00' stroke-width='10' fill='none'/%3E%3Cpath d='M 100 350 Q 300 400 500 350' stroke='%23f00' stroke-width='10' fill='none'/%3E%3Ctext x='300' y='500' font-family='Arial' font-size='50' fill='%23f00' text-anchor='middle' font-weight='bold'%3EI SEE YOU%3C/text%3E%3C/svg%3E",
    
    // Demon face
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23000'/%3E%3Ccircle cx='300' cy='300' r='200' fill='%23800'/%3E%3Cpolygon points='200,150 220,200 170,200' fill='%23f00'/%3E%3Cpolygon points='400,150 380,200 430,200' fill='%23f00'/%3E%3Cellipse cx='250' cy='280' rx='30' ry='50' fill='%23ff0' stroke='%23000' stroke-width='3'/%3E%3Ccircle cx='250' cy='280' r='15' fill='%23000'/%3E%3Cellipse cx='350' cy='280' rx='30' ry='50' fill='%23ff0' stroke='%23000' stroke-width='3'/%3E%3Ccircle cx='350' cy='280' r='15' fill='%23000'/%3E%3Cpath d='M 220 370 Q 300 420 380 370' stroke='%23000' stroke-width='5' fill='%23f00'/%3E%3Crect x='240' y='380' width='15' height='30' fill='%23fff'/%3E%3Crect x='265' y='380' width='15' height='30' fill='%23fff'/%3E%3Crect x='290' y='380' width='15' height='30' fill='%23fff'/%3E%3Crect x='315' y='380' width='15' height='30' fill='%23fff'/%3E%3Crect x='340' y='380' width='15' height='30' fill='%23fff'/%3E%3C/svg%3E",
    
    // Screaming face
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23000'/%3E%3Cellipse cx='300' cy='320' rx='160' ry='200' fill='%23ccc'/%3E%3Ccircle cx='250' cy='280' r='25' fill='%23000'/%3E%3Ccircle cx='350' cy='280' r='25' fill='%23000'/%3E%3Cellipse cx='300' cy='400' rx='40' ry='80' fill='%23000'/%3E%3Cpath d='M 200 250 Q 210 220 220 250' stroke='%23000' stroke-width='8' fill='none'/%3E%3Cpath d='M 380 250 Q 390 220 400 250' stroke='%23000' stroke-width='8' fill='none'/%3E%3Ctext x='300' y='550' font-family='Arial' font-size='60' fill='%23f00' text-anchor='middle' font-weight='bold'%3EAAAHHH!%3C/text%3E%3C/svg%3E",
    
    // Glowing eyes in darkness
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23000'/%3E%3Cdefs%3E%3CradialGradient id='glow'%3E%3Cstop offset='0%25' stop-color='%23f00' stop-opacity='1'/%3E%3Cstop offset='100%25' stop-color='%23f00' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Ccircle cx='220' cy='300' r='50' fill='url(%23glow)'/%3E%3Ccircle cx='380' cy='300' r='50' fill='url(%23glow)'/%3E%3Ccircle cx='220' cy='300' r='30' fill='%23f00'/%3E%3Ccircle cx='380' cy='300' r='30' fill='%23f00'/%3E%3Ctext x='300' y='500' font-family='Arial' font-size='50' fill='%23f00' text-anchor='middle' font-weight='bold'%3EBEHIND YOU%3C/text%3E%3C/svg%3E"
];

// DOM Elements
const authContainer = document.getElementById('auth-container');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');
const signOutBtn = document.getElementById('sign-out-btn');
const signInBtn = document.getElementById('sign-in-btn');
const loginModal = document.getElementById('login-modal');
const loginAccept = document.getElementById('login-accept');
const loginDeny = document.getElementById('login-deny');
const usernameModal = document.getElementById('username-modal');
const usernameInput = document.getElementById('username-input');
const usernameSubmit = document.getElementById('username-submit');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const leaderboardModal = document.getElementById('leaderboard-modal');
const leaderboardBody = document.getElementById('leaderboard-body');
const leaderboardClose = document.getElementById('leaderboard-close');
const countdownElement = document.getElementById('countdown');
const scaryToggle = document.getElementById('scary-toggle');
const jumpscare = document.getElementById('jumpscare');
const jumpscareImage = document.getElementById('jumpscare-image');
const lightsOut = document.getElementById('lights-out');

// State
let currentUser = null;
let userData = null;
let scaryMode = localStorage.getItem('scaryMode') === 'true';
let askedForLogin = localStorage.getItem('askedForLogin') === 'true';
let jumpscareInterval = null;
let eyeInterval = null;
let spiderInterval = null;
let lightsOutInterval = null;
let screamInterval = null;
let isTabFocused = true;
// Add an authInitialized flag to avoid showing the login modal before Firebase reports the auth state
let authInitialized = false;

// Keep track of unlocked days (persisted)
let unlockedDays = {}; // keys: 1..5 -> boolean

// load unlockedDays from localStorage
function loadUnlockedDays() {
    try {
        const raw = localStorage.getItem('unlockedDays');
        if (raw) {
            unlockedDays = JSON.parse(raw);
        } else {
            unlockedDays = {};
        }
    } catch (e) {
        unlockedDays = {};
    }
}

function saveUnlockedDays() {
    try {
        localStorage.setItem('unlockedDays', JSON.stringify(unlockedDays));
    } catch (e) {
        // ignore
    }
}

// check and set unlocks based on calendar dates Oct 27..31 inclusive
function updateUnlocksByDate() {
    const now = new Date();
    const year = now.getFullYear();

    for (let day = 1; day <= 5; day++) {
        // mapping: day 1 -> Oct 27 ... day 5 -> Oct 31
        const unlockDate = new Date(year, 9, 26 + day, 0, 0, 0); // month index 9 = October
        // If now is on/after the unlockDate, mark unlocked
        if (now >= unlockDate) {
            if (!unlockedDays[day]) {
                unlockedDays[day] = true;
            }
        }
        // keep any previously saved unlocks (persisted)
    }

    saveUnlockedDays();
}

// Replace previous isGameUnlocked behavior: use persisted calendar unlocks only
function isGameUnlocked(day) {
    // if persisted/unlocked previously, keep unlocked
    if (unlockedDays[day]) return true;
    // otherwise, check date now (in case the page loaded before updateUnlocksByDate)
    const now = new Date();
    const year = now.getFullYear();
    const unlockDate = new Date(year, 9, 26 + day, 0, 0, 0);
    return now >= unlockDate;
}

// Initialize scary mode toggle
if (scaryToggle) {
    scaryToggle.checked = scaryMode;
}

// Tab focus detection
document.addEventListener('visibilitychange', () => {
    isTabFocused = !document.hidden;
});

// Audio Context for scary sounds
let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Play scream sound
function playScream() {
    try {
        const ctx = getAudioContext();
        const oscillator1 = ctx.createOscillator();
        const oscillator2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        oscillator1.connect(filter);
        oscillator2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 5;
        
        oscillator1.type = 'sawtooth';
        oscillator2.type = 'square';
        
        // Create scream effect
        oscillator1.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.5);
        oscillator1.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 1);
        oscillator1.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 1.5);
        
        oscillator2.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.5);
        oscillator2.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 1);
        oscillator2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.5);
        
        gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        
        oscillator1.start(ctx.currentTime);
        oscillator2.start(ctx.currentTime);
        oscillator1.stop(ctx.currentTime + 1.5);
        oscillator2.stop(ctx.currentTime + 1.5);
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Play whisper sound
function playWhisper() {
    try {
        const ctx = getAudioContext();
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + 2);
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Play heartbeat sound
function playHeartbeat() {
    try {
        const ctx = getAudioContext();
        
        for (let i = 0; i < 3; i++) {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 60;
            
            const startTime = ctx.currentTime + (i * 0.8);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, startTime + 0.15);
            gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.25);
            gainNode.gain.linearRampToValueAtTime(0, startTime + 0.35);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.4);
        }
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Countdown to Halloween end (Oct 31, 24:00 = Nov 1, 00:00)
function updateCountdown() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const halloweenEnd = new Date(currentYear, 9, 31, 24, 0, 0);
    
    if (now > halloweenEnd) {
        halloweenEnd.setFullYear(currentYear + 1);
    }
    
    const diff = halloweenEnd - now;
    
    if (diff <= 0) {
        countdownElement.textContent = "Event Ended!";
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) {
        countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
        countdownElement.textContent = `${hours}h ${minutes}m ${seconds}s`;
    }
}

// Authentication Functions
async function signInWithGoogle() {
    try {
        const result = await window.firebaseSignInWithPopup(window.firebaseAuth, window.googleProvider);
        const user = result.user;
        await checkAndSetUsername(user);
    } catch (error) {
        console.error('Error signing in:', error);
        alert('Failed to sign in. Please try again.');
    }
}

async function checkAndSetUsername(user) {
    currentUser = user;
    
    const userDoc = window.firebaseDoc(window.firebaseDb, 'users', user.uid);
    const userSnapshot = await window.firebaseGetDoc(userDoc);
    
    if (userSnapshot.exists()) {
        userData = userSnapshot.data();
        updateUI(user, userData);
    } else {
        userData = {
            email: user.email,
            username: user.email.split('@')[0],
            createdAt: new Date(),
            scores: {
                day1: 0,
                day2: 0,
                day3: 0,
                day4: 0,
                day5: 0,
                total: 0
            }
        };
        showUsernameModal();
    }
}

async function saveUsername(username) {
    if (!currentUser || !currentUser.uid) {
        console.error('No currentUser found when trying to save username');
        alert('Error: No user session. Please try signing in again.');
        return;
    }
    
    const userDoc = window.firebaseDoc(window.firebaseDb, 'users', currentUser.uid);
    userData.username = username.trim();
    
    try {
        await window.firebaseSetDoc(userDoc, userData);
        updateUI(currentUser, userData);
        if (usernameModal) usernameModal.classList.add('hidden');
    } catch (error) {
        console.error('Error saving username:', error);
        alert('Failed to save username. Please try again.');
    }
}

function updateUI(user, userData) {
    currentUser = user;
    if (usernameDisplay) {
        usernameDisplay.textContent = userData.username;
    }
    if (userInfo) userInfo.classList.remove('hidden');
    if (signInBtn) signInBtn.classList.add('hidden');
    if (loginModal) loginModal.classList.add('hidden');
}

function signOutUser() {
    window.firebaseSignOut(window.firebaseAuth).then(() => {
        currentUser = null;
        userData = null;
        if (userInfo) userInfo.classList.add('hidden');
        if (signInBtn) signInBtn.classList.remove('hidden');
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}

function showLoginModal() {
    if (!askedForLogin && !currentUser && loginModal) {
        setTimeout(() => {
            loginModal.classList.remove('hidden');
        }, 1000);
    }
}

function showUsernameModal() {
    if (usernameInput && usernameModal) {
        usernameInput.value = userData.username;
        usernameModal.classList.remove('hidden');
    }
}

// Leaderboard Functions
async function loadLeaderboard() {
    try {
        const usersQuery = window.firebaseQuery(window.firebaseCollection(window.firebaseDb, 'users'), window.firebaseOrderBy('scores.total', 'desc'));
        const querySnapshot = await window.firebaseGetDocs(usersQuery);
        
        const leaderboardData = [];
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.username && userData.scores) {
                leaderboardData.push({
                    username: userData.username,
                    ...userData.scores
                });
            }
        });
        
        displayLeaderboard(leaderboardData);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        if (leaderboardBody) {
            leaderboardBody.innerHTML = '<tr><td colspan="8">Error loading leaderboard</td></tr>';
        }
    }
}

function displayLeaderboard(data) {
    if (!leaderboardBody) return;
    
    leaderboardBody.innerHTML = '';
    
    if (data.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="8">No scores yet! Be the first to play!</td></tr>';
        return;
    }
    
    data.forEach((user, index) => {
        const row = document.createElement('tr');
        
        if (index === 0) row.classList.add('rank-1');
        if (index === 1) row.classList.add('rank-2');
        if (index === 2) row.classList.add('rank-3');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${user.username}</td>
            <td>${user.day1 || 0}</td>
            <td>${user.day2 || 0}</td>
            <td>${user.day3 || 0}</td>
            <td>${user.day4 || 0}</td>
            <td>${user.day5 || 0}</td>
            <td><strong>${user.total || 0}</strong></td>
        `;
        
        leaderboardBody.appendChild(row);
    });
}

// Event Listeners for Auth
if (signInBtn) signInBtn.addEventListener('click', signInWithGoogle);
if (signOutBtn) signOutBtn.addEventListener('click', signOutUser);
if (loginAccept) loginAccept.addEventListener('click', signInWithGoogle);
if (loginDeny) {
    loginDeny.addEventListener('click', () => {
        if (loginModal) loginModal.classList.add('hidden');
        localStorage.setItem('askedForLogin', 'true');
        askedForLogin = true;
    });
}

if (usernameSubmit) {
    usernameSubmit.addEventListener('click', () => {
        if (usernameInput && usernameInput.value.trim()) {
            saveUsername(usernameInput.value);
        } else {
            alert('Please enter a username');
        }
    });
}

if (usernameInput) {
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && usernameInput.value.trim()) {
            saveUsername(usernameInput.value);
        }
    });
}

// Leaderboard Events
if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', () => {
        if (leaderboardModal) {
            leaderboardModal.classList.remove('hidden');
            loadLeaderboard();
        }
    });
}
if (leaderboardClose) {
    leaderboardClose.addEventListener('click', () => {
        if (leaderboardModal) leaderboardModal.classList.add('hidden');
    });
}

// Initialize Firebase Auth State Observer
function initializeAuthObserver() {
    // track first callback invocation
    let firstCall = true;

    window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
        if (user) {
            checkAndSetUsername(user);
        } else {
            currentUser = null;
            userData = null;
            if (userInfo) userInfo.classList.add('hidden');
            if (signInBtn) signInBtn.classList.remove('hidden');
            // Only show login modal after we know auth has been initialized (so we don't flash it on page load)
            if (!askedForLogin && authInitialized) {
                showLoginModal();
            }
        }

        if (firstCall) {
            authInitialized = true;
            firstCall = false;
        }
    });
}

// Scary Mode Functions
if (scaryToggle) {
    scaryToggle.addEventListener('change', function() {
        scaryMode = this.checked;
        localStorage.setItem('scaryMode', scaryMode);
        
        if (scaryMode) {
            startScaryMode();
        } else {
            stopScaryMode();
        }
    });
}

function startScaryMode() {
    addMoreSpookyElements();
    startRandomJumpscares();
    startEyeAppearances();
    startSpiderCrawls();
    startLightsOut();
    startRandomScreams();
}

function stopScaryMode() {
    const extraElements = document.querySelectorAll('.ghost, .bat, .eye, .spider, .fog');
    extraElements.forEach(el => {
        if (el.classList.contains('scary-mode')) {
            el.remove();
        }
    });
    
    if (jumpscareInterval) {
        clearInterval(jumpscareInterval);
        jumpscareInterval = null;
    }
    
    if (eyeInterval) {
        clearInterval(eyeInterval);
        eyeInterval = null;
    }
    
    if (spiderInterval) {
        clearInterval(spiderInterval);
        spiderInterval = null;
    }
    
    if (lightsOutInterval) {
        clearInterval(lightsOutInterval);
        lightsOutInterval = null;
    }
    
    if (screamInterval) {
        clearInterval(screamInterval);
        screamInterval = null;
    }
    
    if (lightsOut) lightsOut.style.opacity = '0';
}

// Background Elements
function addBackgroundElements() {
    const background = document.getElementById('background');
    if (!background) return;
    
    // Add fog layers
    for (let i = 0; i < 3; i++) {
        const fog = document.createElement('div');
        fog.classList.add('fog');
        fog.style.top = `${20 + i * 30}%`;
        fog.style.left = `${-100}px`;
        fog.style.animationDelay = `${i * 10}s`;
        background.appendChild(fog);
    }
    
    for (let i = 0; i < 5; i++) {
        const ghost = document.createElement('div');
        ghost.classList.add('ghost');
        // add variety by occasional size class
        if (Math.random() < 0.25) ghost.classList.add('small');
        else if (Math.random() < 0.15) ghost.classList.add('large');

        ghost.style.left = `${Math.random() * 90}%`;
        ghost.style.top = `${Math.random() * 90}%`;
        ghost.style.animationDuration = `${15 + Math.random() * 10}s`;
        ghost.style.animationDelay = `${Math.random() * 5}s`;
        background.appendChild(ghost);
    }
    
    for (let i = 0; i < 4; i++) {
        const bat = document.createElement('div');
        bat.classList.add('bat');
        bat.style.left = `${Math.random() * 90}%`;
        bat.style.top = `${Math.random() * 90}%`;
        bat.style.animationDuration = `${20 + Math.random() * 10}s`;
        bat.style.animationDelay = `${Math.random() * 5}s`;
        background.appendChild(bat);
    }
}

function addMoreSpookyElements() {
    const background = document.getElementById('background');
    if (!background) return;
    
    // More fog
    for (let i = 0; i < 2; i++) {
        const fog = document.createElement('div');
        fog.classList.add('fog', 'scary-mode');
        fog.style.top = `${40 + i * 20}%`;
        fog.style.left = `${-100}px`;
        fog.style.animationDelay = `${i * 15}s`;
        background.appendChild(fog);
    }
    
    for (let i = 0; i < 8; i++) {
        const ghost = document.createElement('div');
        ghost.classList.add('ghost', 'scary-mode');
        ghost.style.left = `${Math.random() * 90}%`;
        ghost.style.top = `${Math.random() * 90}%`;
        ghost.style.animationDuration = `${10 + Math.random() * 5}s`;
        ghost.style.animationDelay = `${Math.random() * 3}s`;
        background.appendChild(ghost);
    }
    
    for (let i = 0; i < 6; i++) {
        const bat = document.createElement('div');
        bat.classList.add('bat', 'scary-mode');
        bat.style.left = `${Math.random() * 90}%`;
        bat.style.top = `${Math.random() * 90}%`;
        bat.style.animationDuration = `${15 + Math.random() * 5}s`;
        bat.style.animationDelay = `${Math.random() * 3}s`;
        background.appendChild(bat);
    }
}

function startSpiderCrawls() {
    if (spiderInterval) clearInterval(spiderInterval);
    
    addSpiders();
    
    spiderInterval = setInterval(() => {
        if (Math.random() < 0.4) {
            addSpiders();
        }
    }, 12000);
}

function addSpiders() {
    const background = document.getElementById('background');
    if (!background) return;
    
    const spiderCount = 2 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < spiderCount; i++) {
        const spider = document.createElement('div');
        spider.classList.add('spider', 'scary-mode');
        spider.style.left = `${Math.random() * 90}%`;
        spider.style.top = `${Math.random() * 90}%`;
        spider.style.animationDuration = `${20 + Math.random() * 10}s`;
        background.appendChild(spider);
        
        setTimeout(() => {
            if (spider.parentNode) {
                spider.parentNode.removeChild(spider);
            }
        }, 25000);
    }
}

function startRandomJumpscares() {
    if (jumpscareInterval) clearInterval(jumpscareInterval);
    
    jumpscareInterval = setInterval(() => {
        if (Math.random() < 0.3 && isTabFocused) {
            triggerJumpscare();
        }
    }, 40000);
}

function triggerJumpscare() {
    if (!isTabFocused || !jumpscare || !jumpscareImage) return;
    
    jumpscare.classList.remove('hidden');
    jumpscareImage.src = scaryImages[Math.floor(Math.random() * scaryImages.length)];
    
    playScream();
    
    setTimeout(() => {
        if (jumpscare) jumpscare.classList.add('hidden');
    }, 1200);
}

function startEyeAppearances() {
    if (eyeInterval) clearInterval(eyeInterval);
    
    eyeInterval = setInterval(() => {
        if (Math.random() < 0.5) {
            showEyes();
        }
    }, 18000);
}

function showEyes() {
    const background = document.getElementById('background');
    if (!background) return;
    
    const eyeCount = 3 + Math.floor(Math.random() * 4);
    
    playWhisper();
    
    for (let i = 0; i < eyeCount; i++) {
        const eye = document.createElement('div');
        eye.classList.add('eye', 'scary-mode');
        eye.style.left = `${Math.random() * 90}%`;
        eye.style.top = `${Math.random() * 90}%`;
        background.appendChild(eye);
        
        setTimeout(() => {
            if (eye.parentNode) {
                eye.parentNode.removeChild(eye);
            }
        }, 4000);
    }
}

function startLightsOut() {
    if (lightsOutInterval) clearInterval(lightsOutInterval);
    
    lightsOutInterval = setInterval(() => {
        if (Math.random() < 0.15 && isTabFocused) {
            triggerLightsOut();
        }
    }, 50000);
}

function triggerLightsOut() {
    if (!isTabFocused || !lightsOut) return;
    
    lightsOut.style.opacity = '0.95';
    playHeartbeat();
    
    setTimeout(() => {
        if (lightsOut) lightsOut.style.opacity = '0';
    }, 3000);
}

function startRandomScreams() {
    if (screamInterval) clearInterval(screamInterval);
    
    screamInterval = setInterval(() => {
        if (Math.random() < 0.2 && isTabFocused) {
            playScream();
        }
    }, 70000);
}

// Game Logic
function getCurrentDay() {
    const now = new Date();
    return now.getDay();
}

function isGameUnlocked(day) {
    // if persisted/unlocked previously, keep unlocked
    if (unlockedDays[day]) return true;
    // otherwise, check date now (in case the page loaded before updateUnlocksByDate)
    const now = new Date();
    const year = now.getFullYear();
    const unlockDate = new Date(year, 9, 26 + day, 0, 0, 0);
    return now >= unlockDate;
}

function createGameCards() {
    const gamesContainer = document.querySelector('.games-container');
    if (!gamesContainer) return;
    
    gamesContainer.innerHTML = '';
    
    games.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.classList.add('game-card');
        
        const unlocked = isGameUnlocked(game.day);
        
        if (!unlocked) {
            gameCard.classList.add('locked');
            
            const lockIcon = document.createElement('div');
            lockIcon.classList.add('lock-icon');
            lockIcon.innerHTML = '🔒';
            gameCard.appendChild(lockIcon);
        } else {
            // ensure persisted state is saved
            if (!unlockedDays[game.day]) {
                unlockedDays[game.day] = true;
                saveUnlockedDays();
            }
            gameCard.addEventListener('click', () => {
                window.location.href = game.url;
            });
        }
        
        const gameTitle = document.createElement('h2');
        gameTitle.classList.add('game-title');
        gameTitle.textContent = game.title;
        
        const gameDate = document.createElement('p');
        gameDate.classList.add('game-date');
        gameDate.textContent = game.date;
        
        gameCard.appendChild(gameTitle);
        gameCard.appendChild(gameDate);
        
        gamesContainer.appendChild(gameCard);
    });
}

// Main initialization function
function initApp() {
    // load persisted unlocks and update based on today's date
    loadUnlockedDays();
    updateUnlocksByDate();

    addBackgroundElements();
    createGameCards();
    
    if (countdownElement) {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }
    
    if (window.firebaseReady) {
        initializeAuthObserver();
    }
    
    if (scaryMode) {
        startScaryMode();
    }
}

window.initApp = initApp;

if (window.firebaseReady) {
    initApp();
} else {
    document.addEventListener('DOMContentLoaded', initApp);
}