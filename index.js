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
const scaryToggle = document.getElementById('scary-toggle');
const jumpscare = document.getElementById('jumpscare');
const jumpscareImage = document.getElementById('jumpscare-image');

// State
let currentUser = null;
let userData = null;
let scaryMode = localStorage.getItem('scaryMode') === 'true';
let askedForLogin = localStorage.getItem('askedForLogin') === 'true';
let jumpscareInterval = null;
let eyeInterval = null;

// Initialize scary mode toggle
scaryToggle.checked = scaryMode;

// Authentication Functions
async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(window.firebaseAuth, window.googleProvider);
        const user = result.user;
        
        // Check if user has a username
        await checkAndSetUsername(user);
        
    } catch (error) {
        console.error('Error signing in:', error);
        alert('Failed to sign in. Please try again.');
    }
}

async function checkAndSetUsername(user) {
    const userDoc = doc(window.firebaseDb, 'users', user.uid);
    const userSnapshot = await getDoc(userDoc);
    
    if (userSnapshot.exists()) {
        // User exists, get their data
        userData = userSnapshot.data();
        updateUI(user, userData);
    } else {
        // New user, show username modal
        userData = {
            email: user.email,
            username: user.email.split('@')[0], // Default to email prefix
            createdAt: new Date()
        };
        showUsernameModal(user);
    }
}

async function saveUsername(user, username) {
    const userDoc = doc(window.firebaseDb, 'users', user.uid);
    userData.username = username.trim();
    
    try {
        await setDoc(userDoc, userData);
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
    signOut(window.firebaseAuth).then(() => {
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

// Auth State Observer
onAuthStateChanged(window.firebaseAuth, (user) => {
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
}

function stopScaryMode() {
    const extraElements = document.querySelectorAll('.ghost, .bat, .eye');
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

function startRandomJumpscares() {
    if (jumpscareInterval) {
        clearInterval(jumpscareInterval);
    }
    
    jumpscareInterval = setInterval(() => {
        if (Math.random() < 0.3) {
            triggerJumpscare();
        }
    }, 30000);
}

function triggerJumpscare() {
    jumpscare.classList.remove('hidden');
    jumpscareImage.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='black'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='40' fill='red' text-anchor='middle' dominant-baseline='middle'%3EBOO!%3C/text%3E%3C/svg%3E";
    
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
        audio.volume = 0.5;
        audio.play();
    } catch (e) {
        // Sound not available
    }
    
    setTimeout(() => {
        jumpscare.classList.add('hidden');
    }, 1000);
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
    
    for (let i = 0; i < 2; i++) {
        const eye = document.createElement('div');
        eye.classList.add('eye', 'scary-mode');
        eye.style.left = `${10 + i * 40 + Math.random() * 80}%`;
        eye.style.top = `${Math.random() * 90}%`;
        background.appendChild(eye);
        
        setTimeout(() => {
            if (eye.parentNode) {
                eye.parentNode.removeChild(eye);
            }
        }, 3000);
    }
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

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    addBackgroundElements();
    createGameCards();
    
    // Start scary mode if enabled
    if (scaryMode) {
        startScaryMode();
    }
    
    // Show login modal if not logged in and not asked before
    if (!currentUser && !askedForLogin) {
        showLoginModal();
    }
});