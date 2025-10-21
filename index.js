// Game data
const games = [
    { day: 1, title: "Spooky Addition", date: "Monday", url: "https://thehumblepotato.github.io/mini-event/day_1.html" },
    { day: 2, title: "Ghostly Subtraction", date: "Tuesday", url: "https://thehumblepotato.github.io/mini-event/day_2.html" },
    { day: 3, title: "Witchy Multiplication", date: "Wednesday", url: "https://thehumblepotato.github.io/mini-event/day_3.html" },
    { day: 4, title: "Zombie Division", date: "Thursday", url: "https://thehumblepotato.github.io/mini-event/day_4.html" },
    { day: 5, title: "Pumpkin Algebra", date: "Friday", url: "https://thehumblepotato.github.io/mini-event/day_5.html" }
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
let isTabFocused = true;

// Initialize scary mode toggle
scaryToggle.checked = scaryMode;

// Tab focus detection
document.addEventListener('visibilitychange', () => {
    isTabFocused = !document.hidden;
});

// Countdown to Halloween end (Oct 31, 24:00 = Nov 1, 00:00)
function updateCountdown() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const halloweenEnd = new Date(currentYear, 9, 31, 24, 0, 0); // Oct 31, 24:00
    
    // If Halloween has passed this year, target next year
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
        
        // Check if user has a username
        await checkAndSetUsername(user);
        
    } catch (error) {
        console.error('Error signing in:', error);
        alert('Failed to sign in. Please try again.');
    }
}

async function checkAndSetUsername(user) {
    const userDoc = window.firebaseDoc(window.firebaseDb, 'users', user.uid);
    const userSnapshot = await window.firebaseGetDoc(userDoc);
    
    if (userSnapshot.exists()) {
        // User exists, get their data
        userData = userSnapshot.data();
        updateUI(user, userData);
    } else {
        // New user, show username modal
        userData = {
            email: user.email,
            username: user.email.split('@')[0], // Default to email prefix
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
        showUsernameModal(user);
    }
}

async function saveUsername(user, username) {
    const userDoc = window.firebaseDoc(window.firebaseDb, 'users', user.uid);
    userData.username = username.trim();
    
    try {
        await window.firebaseSetDoc(userDoc, userData);
        updateUI(user, userData);
        usernameModal.classList.add('hidden');
    } catch (error) {
        console.error('Error saving username:', error);
        alert('Failed to save username. Please try again.');
    }
}

function updateUI(user, userData) {
    currentUser = user;
    usernameDisplay.textContent = userData.username;
    userInfo.classList.remove('hidden');
    signInBtn.classList.add('hidden');
    
    // Hide login modal if it's showing
    loginModal.classList.add('hidden');
}

function signOutUser() {
    window.firebaseSignOut(window.firebaseAuth).then(() => {
        currentUser = null;
        userData = null;
        userInfo.classList.add('hidden');
        signInBtn.classList.remove('hidden');
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}

function showLoginModal() {
    if (!askedForLogin && !currentUser) {
        setTimeout(() => {
            loginModal.classList.remove('hidden');
        }, 1000);
    }
}

function showUsernameModal(user) {
    usernameInput.value = userData.username; // Pre-fill with email prefix
    usernameModal.classList.remove('hidden');
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
        leaderboardBody.innerHTML = '<tr><td colspan="8">Error loading leaderboard</td></tr>';
    }
}

function displayLeaderboard(data) {
    leaderboardBody.innerHTML = '';
    
    if (data.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="8">No scores yet! Be the first to play!</td></tr>';
        return;
    }
    
    data.forEach((user, index) => {
        const row = document.createElement('tr');
        
        // Add ranking classes for top 3
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
signInBtn.addEventListener('click', signInWithGoogle);
signOutBtn.addEventListener('click', signOutUser);
loginAccept.addEventListener('click', signInWithGoogle);
loginDeny.addEventListener('click', () => {
    loginModal.classList.add('hidden');
    localStorage.setItem('askedForLogin', 'true');
    askedForLogin = true;
});

usernameSubmit.addEventListener('click', () => {
    if (usernameInput.value.trim()) {
        saveUsername(currentUser, usernameInput.value);
    } else {
        alert('Please enter a username');
    }
});

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        usernameSubmit.click();
    }
});

// Leaderboard Events
leaderboardBtn.addEventListener('click', () => {
    leaderboardModal.classList.remove('hidden');
    loadLeaderboard();
});

leaderboardClose.addEventListener('click', () => {
    leaderboardModal.classList.add('hidden');
});

// Initialize Firebase Auth State Observer
function initializeAuthObserver() {
    window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
        if (user) {
            checkAndSetUsername(user);
        } else {
            currentUser = null;
            userData = null;
            userInfo.classList.add('hidden');
            signInBtn.classList.remove('hidden');
            
            // Show login modal if not asked before
            if (!askedForLogin) {
                showLoginModal();
            }
        }
    });
}

// Scary Mode Functions
scaryToggle.addEventListener('change', function() {
    scaryMode = this.checked;
    localStorage.setItem('scaryMode', scaryMode);
    
    if (scaryMode) {
        startScaryMode();
    } else {
        stopScaryMode();
    }
});

function startScaryMode() {
    addMoreSpookyElements();
    startRandomJumpscares();
    startEyeAppearances();
    startSpiderCrawls();
    startLightsOut();
}

function stopScaryMode() {
    const extraElements = document.querySelectorAll('.ghost, .bat, .eye, .spider');
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
    
    // Ensure lights are back on
    lightsOut.style.opacity = '0';
}

// Background Elements
function addBackgroundElements() {
    const background = document.getElementById('background');
    
    for (let i = 0; i < 3; i++) {
        const ghost = document.createElement('div');
        ghost.classList.add('ghost');
        ghost.style.left = `${Math.random() * 90}%`;
        ghost.style.top = `${Math.random() * 90}%`;
        ghost.style.animationDuration = `${15 + Math.random() * 10}s`;
        background.appendChild(ghost);
    }
    
    for (let i = 0; i < 2; i++) {
        const bat = document.createElement('div');
        bat.classList.add('bat');
        bat.style.left = `${Math.random() * 90}%`;
        bat.style.top = `${Math.random() * 90}%`;
        bat.style.animationDuration = `${20 + Math.random() * 10}s`;
        background.appendChild(bat);
    }
}

function addMoreSpookyElements() {
    const background = document.getElementById('background');
    
    for (let i = 0; i < 5; i++) {
        const ghost = document.createElement('div');
        ghost.classList.add('ghost', 'scary-mode');
        ghost.style.left = `${Math.random() * 90}%`;
        ghost.style.top = `${Math.random() * 90}%`;
        ghost.style.animationDuration = `${10 + Math.random() * 5}s`;
        background.appendChild(ghost);
    }
    
    for (let i = 0; i < 3; i++) {
        const bat = document.createElement('div');
        bat.classList.add('bat', 'scary-mode');
        bat.style.left = `${Math.random() * 90}%`;
        bat.style.top = `${Math.random() * 90}%`;
        bat.style.animationDuration = `${15 + Math.random() * 5}s`;
        background.appendChild(bat);
    }
}

function startSpiderCrawls() {
    if (spiderInterval) {
        clearInterval(spiderInterval);
    }
    
    // Add initial spiders
    addSpiders();
    
    spiderInterval = setInterval(() => {
        if (Math.random() < 0.3) {
            addSpiders();
        }
    }, 15000);
}

function addSpiders() {
    const background = document.getElementById('background');
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
        }, 20000);
    }
}

function startRandomJumpscares() {
    if (jumpscareInterval) {
        clearInterval(jumpscareInterval);
    }
    
    jumpscareInterval = setInterval(() => {
        if (Math.random() < 0.2 && isTabFocused) { // Reduced chance, only when tab focused
            triggerJumpscare();
        }
    }, 45000); // 45 seconds
}

function triggerJumpscare() {
    if (!isTabFocused) return;
    
    jumpscare.classList.remove('hidden');
    
    // Different jump scare images
    const scares = [
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='black'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='60' fill='red' text-anchor='middle' dominant-baseline='middle'%3E😱 BOO! 😱%3C/text%3E%3C/svg%3E",
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='black'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='50' fill='red' text-anchor='middle' dominant-baseline='middle'%3E💀 GOT YOU! 💀%3C/text%3E%3C/svg%3E",
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='black'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='45' fill='red' text-anchor='middle' dominant-baseline='middle'%3E👻 BEHIND YOU! 👻%3C/text%3E%3C/svg%3E"
    ];
    
    jumpscareImage.src = scares[Math.floor(Math.random() * scares.length)];
    
    // Play loud scary sound
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.8);
        
        gainNode.gain.setValueAtTime(0.7, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
    } catch (e) {
        // Audio not supported
    }
    
    setTimeout(() => {
        jumpscare.classList.add('hidden');
    }, 800);
}

function startEyeAppearances() {
    if (eyeInterval) {
        clearInterval(eyeInterval);
    }
    
    eyeInterval = setInterval(() => {
        if (Math.random() < 0.4) {
            showEyes();
        }
    }, 20000);
}

function showEyes() {
    const background = document.getElementById('background');
    const eyeCount = 2 + Math.floor(Math.random() * 3);
    
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
        }, 3000);
    }
}

function startLightsOut() {
    if (lightsOutInterval) {
        clearInterval(lightsOutInterval);
    }
    
    lightsOutInterval = setInterval(() => {
        if (Math.random() < 0.1 && isTabFocused) { // 10% chance when tab focused
            triggerLightsOut();
        }
    }, 60000); // Check every minute
}

function triggerLightsOut() {
    if (!isTabFocused) return;
    
    lightsOut.style.opacity = '1';
    
    setTimeout(() => {
        lightsOut.style.opacity = '0';
    }, 2000); // Lights out for 2 seconds
}

// Game Logic
function getCurrentDay() {
    const now = new Date();
    return now.getDay();
}

function isGameUnlocked(day) {
    const currentDay = getCurrentDay();
    
    if (day <= currentDay && currentDay >= 1 && currentDay <= 5) {
        return true;
    }
    
    return false;
}

function createGameCards() {
    const gamesContainer = document.querySelector('.games-container');
    
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
    addBackgroundElements();
    createGameCards();
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    // Initialize auth observer if Firebase is ready
    if (window.firebaseReady) {
        initializeAuthObserver();
    }
    
    // Start scary mode if enabled
    if (scaryMode) {
        startScaryMode();
    }
    
    // Show login modal if not logged in and not asked before
    if (!currentUser && !askedForLogin) {
        showLoginModal();
    }
}

// Make initApp available globally for the Firebase module to call
window.initApp = initApp;

// If Firebase is already ready when this script loads, initialize immediately
if (window.firebaseReady) {
    initApp();
} else {
    // Otherwise, wait for DOMContentLoaded and hope Firebase is ready by then
    document.addEventListener('DOMContentLoaded', initApp);
}