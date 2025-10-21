// Game data
const games = [
    { day: 1, title: "Spooky Addition", date: "Monday", url: "https://thehumblepotato.github.io/mini-event/day_1.html" },
    { day: 2, title: "Ghostly Subtraction", date: "Tuesday", url: "https://thehumblepotato.github.io/mini-event/day_2.html" },
    { day: 3, title: "Witchy Multiplication", date: "Wednesday", url: "https://thehumblepotato.github.io/mini-event/day_3.html" },
    { day: 4, title: "Zombie Division", date: "Thursday", url: "https://thehumblepotato.github.io/mini-event/day_4.html" },
    { day: 5, title: "Pumpkin Algebra", date: "Friday", url: "https://thehumblepotato.github.io/mini-event/day_5.html" }
];

// Scary mode toggle
const scaryToggle = document.getElementById('scary-toggle');
const jumpscare = document.getElementById('jumpscare');
const jumpscareImage = document.getElementById('jumpscare-image');

// Initialize scary mode from localStorage
let scaryMode = localStorage.getItem('scaryMode') === 'true';
scaryToggle.checked = scaryMode;

// Set up scary mode toggle
scaryToggle.addEventListener('change', function() {
    scaryMode = this.checked;
    localStorage.setItem('scaryMode', scaryMode);
    
    if (scaryMode) {
        startScaryMode();
    } else {
        stopScaryMode();
    }
});

// Function to start scary mode effects
function startScaryMode() {
    // Add more background elements
    addMoreSpookyElements();
    
    // Start random jump scares
    startRandomJumpscares();
    
    // Start eye appearances
    startEyeAppearances();
}

// Function to stop scary mode effects
function stopScaryMode() {
    // Remove extra background elements
    const extraElements = document.querySelectorAll('.ghost, .bat, .eye');
    extraElements.forEach(el => {
        if (el.classList.contains('scary-mode')) {
            el.remove();
        }
    });
    
    // Clear jump scare intervals
    if (jumpscareInterval) {
        clearInterval(jumpscareInterval);
        jumpscareInterval = null;
    }
    
    // Clear eye appearance intervals
    if (eyeInterval) {
        clearInterval(eyeInterval);
        eyeInterval = null;
    }
}

// Add initial background elements
function addBackgroundElements() {
    const background = document.getElementById('background');
    
    // Add some ghosts
    for (let i = 0; i < 3; i++) {
        const ghost = document.createElement('div');
        ghost.classList.add('ghost');
        ghost.style.left = `${Math.random() * 90}%`;
        ghost.style.top = `${Math.random() * 90}%`;
        ghost.style.animationDuration = `${15 + Math.random() * 10}s`;
        background.appendChild(ghost);
    }
    
    // Add some bats
    for (let i = 0; i < 2; i++) {
        const bat = document.createElement('div');
        bat.classList.add('bat');
        bat.style.left = `${Math.random() * 90}%`;
        bat.style.top = `${Math.random() * 90}%`;
        bat.style.animationDuration = `${20 + Math.random() * 10}s`;
        background.appendChild(bat);
    }
}

// Add more spooky elements for scary mode
function addMoreSpookyElements() {
    const background = document.getElementById('background');
    
    // Add more ghosts
    for (let i = 0; i < 5; i++) {
        const ghost = document.createElement('div');
        ghost.classList.add('ghost', 'scary-mode');
        ghost.style.left = `${Math.random() * 90}%`;
        ghost.style.top = `${Math.random() * 90}%`;
        ghost.style.animationDuration = `${10 + Math.random() * 5}s`;
        background.appendChild(ghost);
    }
    
    // Add more bats
    for (let i = 0; i < 3; i++) {
        const bat = document.createElement('div');
        bat.classList.add('bat', 'scary-mode');
        bat.style.left = `${Math.random() * 90}%`;
        bat.style.top = `${Math.random() * 90}%`;
        bat.style.animationDuration = `${15 + Math.random() * 5}s`;
        background.appendChild(bat);
    }
}

// Random jump scares
let jumpscareInterval;

function startRandomJumpscares() {
    // Clear any existing interval
    if (jumpscareInterval) {
        clearInterval(jumpscareInterval);
    }
    
    // Set up random jump scares (between 30 seconds and 2 minutes)
    jumpscareInterval = setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance to trigger
            triggerJumpscare();
        }
    }, 30000); // Check every 30 seconds
}

function triggerJumpscare() {
    // Show jump scare
    jumpscare.classList.remove('hidden');
    
    // Use a placeholder image (in a real implementation, you'd use actual scary images)
    jumpscareImage.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='black'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='40' fill='red' text-anchor='middle' dominant-baseline='middle'%3EBOO!%3C/text%3E%3C/svg%3E";
    
    // Play scary sound (if available)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
        audio.volume = 0.5;
        audio.play();
    } catch (e) {
        // Sound not available, continue silently
    }
    
    // Hide after a short time
    setTimeout(() => {
        jumpscare.classList.add('hidden');
    }, 1000);
}

// Eye appearances
let eyeInterval;

function startEyeAppearances() {
    // Clear any existing interval
    if (eyeInterval) {
        clearInterval(eyeInterval);
    }
    
    // Set up random eye appearances
    eyeInterval = setInterval(() => {
        if (Math.random() < 0.4) { // 40% chance to trigger
            showEyes();
        }
    }, 20000); // Check every 20 seconds
}

function showEyes() {
    const background = document.getElementById('background');
    
    // Create a pair of eyes
    for (let i = 0; i < 2; i++) {
        const eye = document.createElement('div');
        eye.classList.add('eye', 'scary-mode');
        eye.style.left = `${10 + i * 40 + Math.random() * 80}%`;
        eye.style.top = `${Math.random() * 90}%`;
        background.appendChild(eye);
        
        // Remove after a while
        setTimeout(() => {
            if (eye.parentNode) {
                eye.parentNode.removeChild(eye);
            }
        }, 3000);
    }
}

// Game logic
function getCurrentDay() {
    const now = new Date();
    return now.getDay(); // 0 = Sunday, 1 = Monday, etc.
}

function isGameUnlocked(day) {
    const currentDay = getCurrentDay();
    
    // Mathoween runs Monday to Friday (days 1-5)
    // Games unlock at midnight
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
});