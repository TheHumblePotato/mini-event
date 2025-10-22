
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 720;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;
const PLATFORM_WIDTH = 80;
const PLATFORM_HEIGHT = 15;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -15;
const MOVE_SPEED = 8;
const GAME_END_DATE = new Date(2024, 9, 28, 0, 0, 0); // Oct 28, 2024, 12:00 AM PDT

// Scary images
const scaryImages = [
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23000'/%3E%3Cellipse cx='300' cy='250' rx='150' ry='180' fill='%23fff'/%3E%3Cellipse cx='250' cy='200' rx='40' ry='60' fill='%23000'/%3E%3Cellipse cx='350' cy='200' rx='40' ry='60' fill='%23000'/%3E%3Cpath d='M 270 280 Q 300 300 330 280' stroke='%23000' stroke-width='3' fill='none'/%3E%3Crect x='285' y='300' width='30' height='50' fill='%23000'/%3E%3Ctext x='300' y='500' font-family='Arial' font-size='40' fill='%23f00' text-anchor='middle' font-weight='bold'%3EGAME OVER!%3C/text%3E%3C/svg%3E",
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23000'/%3E%3Cellipse cx='300' cy='300' rx='200' ry='140' fill='%23fff' stroke='%23f00' stroke-width='5'/%3E%3Ccircle cx='300' cy='300' r='80' fill='%23000'/%3E%3Ccircle cx='300' cy='300' r='50' fill='%23f00'/%3E%3Ctext x='300' y='500' font-family='Arial' font-size='50' fill='%23f00' text-anchor='middle' font-weight='bold'%3EYOU DIED%3C/text%3E%3C/svg%3E"
];

// DOM Elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const startScreen = document.getElementById('start-screen');
const startGameBtn = document.getElementById('start-game');
const gameOverScreen = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const nameInput = document.getElementById('name-input');
const submitScoreBtn = document.getElementById('submit-score');
const playAgainBtn = document.getElementById('play-again');
const backBtn = document.getElementById('back-btn');
const helpBtn = document.getElementById('help-btn');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const helpModal = document.getElementById('help-modal');
const helpClose = document.getElementById('help-close');
const leaderboardModal = document.getElementById('leaderboard-modal');
const leaderboardClose = document.getElementById('leaderboard-close');
const leaderboardBody = document.getElementById('leaderboard-body');
const timerElement = document.getElementById('timer');
const scaryToggle = document.getElementById('scary-toggle');
const jumpscare = document.getElementById('jumpscare');
const jumpscareImage = document.getElementById('jumpscare-image');
const lightsOut = document.getElementById('lights-out');
const background = document.getElementById('background');

// Game state
let player;
let platforms = [];
let powerups = [];
let enemies = [];
let blackholes = [];
let score = 0;
let highestY = CANVAS_HEIGHT;
let gameRunning = false;
let keys = {};
let cameraY = 0;
let scaryMode = localStorage.getItem('day1ScaryMode') === 'true';
let audioContext = null;
let bgMusicInterval = null;
let jumpscareInterval = null;
let blackoutInterval = null;
let scaryJumpInterval = null;

// Initialize scary mode toggle
if (scaryToggle) {
    scaryToggle.checked = scaryMode;
}

// Set canvas size
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Player class
class Player {
    constructor() {
        this.x = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
        this.y = CANVAS_HEIGHT - 200;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.velocityY = 0;
        this.velocityX = 0;
        this.hasJetpack = false;
        this.jetpackFuel = 0;
    }

    draw() {
        if (scaryMode && this.hasJetpack) {
            // Scary jetpack character
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x + 10, this.y + 10, 10, 10);
            ctx.fillRect(this.x + 30, this.y + 10, 10, 10);
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x + 15, this.y + 30, 20, 5);
        } else if (scaryMode) {
            // Scary pumpkin
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x + 12, this.y + 15, 8, 10);
            ctx.fillRect(this.x + 30, this.y + 15, 8, 10);
            ctx.beginPath();
            ctx.moveTo(this.x + 15, this.y + 35);
            ctx.lineTo(this.x + 25, this.y + 40);
            ctx.lineTo(this.x + 35, this.y + 35);
            ctx.stroke();
        } else {
            // Normal pumpkin
            ctx.fillStyle = '#ff9900';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x + 12, this.y + 15, 8, 10);
            ctx.fillRect(this.x + 30, this.y + 15, 8, 10);
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(this.x + 22, this.y - 5, 6, 10);
        }

        // Jetpack flames
        if (this.hasJetpack && this.jetpackFuel > 0) {
            ctx.fillStyle = scaryMode ? '#8b0000' : '#ff6600';
            ctx.fillRect(this.x + 10, this.y + this.height, 10, 15);
            ctx.fillRect(this.x + 30, this.y + this.height, 10, 15);
        }
    }

    update() {
        // Horizontal movement
        if (keys['ArrowLeft'] || keys['a']) {
            this.velocityX = -MOVE_SPEED;
        } else if (keys['ArrowRight'] || keys['d']) {
            this.velocityX = MOVE_SPEED;
        } else {
            this.velocityX = 0;
        }

        this.x += this.velocityX;

        // Wrap around screen
        if (this.x < -this.width) this.x = CANVAS_WIDTH;
        if (this.x > CANVAS_WIDTH) this.x = -this.width;

        // Jetpack
        if (this.hasJetpack && this.jetpackFuel > 0) {
            this.velocityY = -8;
            this.jetpackFuel--;
            if (this.jetpackFuel <= 0) {
                this.hasJetpack = false;
            }
        } else {
            this.velocityY += GRAVITY;
        }

        this.y += this.velocityY;

        // Update highest position and score
        if (this.y < highestY) {
            score += Math.floor((highestY - this.y) / 10);
            highestY = this.y;
        }

        // Camera follows player
        if (this.y < CANVAS_HEIGHT / 2) {
            cameraY = this.y - CANVAS_HEIGHT / 2;
        }
    }
}

// Platform class
class Platform {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = PLATFORM_WIDTH;
        this.height = PLATFORM_HEIGHT;
        this.type = type; // normal, breaking, moving
        this.broken = false;
        this.moveDirection = Math.random() > 0.5 ? 1 : -1;
        this.moveSpeed = 2;
    }

    draw() {
        const screenY = this.y - cameraY;
        
        if (this.broken) return;

        if (this.type === 'breaking') {
            ctx.fillStyle = scaryMode ? '#4a2511' : '#8b4513';
            ctx.fillRect(this.x, screenY, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(this.x, screenY, this.width, this.height);
        } else if (this.type === 'moving') {
            ctx.fillStyle = scaryMode ? '#1a4d1a' : '#4CAF50';
            ctx.fillRect(this.x, screenY, this.width, this.height);
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + 5, screenY + 5, this.width - 10, this.height - 10);
        } else {
            ctx.fillStyle = scaryMode ? '#2d5016' : '#4CAF50';
            ctx.fillRect(this.x, screenY, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(this.x, screenY, this.width, this.height);
        }
    }

    update() {
        if (this.type === 'moving') {
            this.x += this.moveSpeed * this.moveDirection;
            if (this.x <= 0 || this.x + this.width >= CANVAS_WIDTH) {
                this.moveDirection *= -1;
            }
        }
    }
}

// Powerup class
class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type; // spring, jetpack
        this.used = false;
    }

    draw() {
        const screenY = this.y - cameraY;
        
        if (this.used) return;

        if (this.type === 'spring') {
            ctx.fillStyle = scaryMode ? '#8b008b' : '#9c27b0';
            ctx.fillRect(this.x, screenY, this.width, 5);
            ctx.fillRect(this.x + 5, screenY + 5, this.width - 10, 5);
            ctx.fillRect(this.x + 10, screenY + 10, this.width - 20, 20);
        } else if (this.type === 'jetpack') {
            ctx.fillStyle = scaryMode ? '#8b0000' : '#ff5722';
            ctx.fillRect(this.x, screenY, 12, 25);
            ctx.fillRect(this.x + 18, screenY, 12, 25);
            ctx.fillStyle = scaryMode ? '#000' : '#ff9800';
            ctx.fillRect(this.x + 5, screenY + 5, 20, 15);
        }
    }
}

// Enemy class
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.moveDirection = Math.random() > 0.5 ? 1 : -1;
        this.moveSpeed = 1;
    }

    draw() {
        const screenY = this.y - cameraY;
        
        if (scaryMode) {
            // Scary demon face
            ctx.fillStyle = '#8b0000';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, screenY + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x + 10, screenY + 12, 8, 8);
            ctx.fillRect(this.x + 22, screenY + 12, 8, 8);
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, screenY + 28, 8, 0, Math.PI);
            ctx.fill();
        } else {
            // Cute ghost
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x, screenY, this.width, this.height - 10);
            ctx.fillRect(this.x + 5, screenY + this.height - 10, 10, 10);
            ctx.fillRect(this.x + 25, screenY + this.height - 10, 10, 10);
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x + 10, screenY + 15, 6, 6);
            ctx.fillRect(this.x + 24, screenY + 15, 6, 6);
        }
    }

    update() {
        this.x += this.moveSpeed * this.moveDirection;
        if (this.x <= 0 || this.x + this.width >= CANVAS_WIDTH) {
            this.moveDirection *= -1;
        }
    }
}

// Blackhole class
class Blackhole {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 30;
        this.pullRadius = 100;
    }

    draw() {
        const screenY = this.y - cameraY;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(
            this.x, screenY, this.radius/2,
            this.x, screenY, this.radius
        );
        gradient.addColorStop(0, scaryMode ? '#8b0000' : '#9c27b0');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, screenY, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Black hole
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    pullPlayer(player) {
        const screenY = this.y - cameraY;
        const dx = this.x - (player.x + player.width/2);
        const dy = screenY - (player.y + player.height/2);
        const distance = Math.sqrt(dx*dx + dy*dy);

        if (distance < this.pullRadius) {
            const pullStrength = (this.pullRadius - distance) / this.pullRadius * 0.5;
            player.x += dx * pullStrength * 0.1;
            player.velocityY += dy * pullStrength * 0.1;
        }
    }
}

// Audio functions
function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function playJumpSound() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = 400;
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
        gain.gain.value = 0.1;
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
}

function playDeathSound() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = 200;
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.8);
        gain.gain.value = 0.3;
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
    } catch (e) {}
}

function playScaryMusic() {
    if (!scaryMode) return;
    
    try {
        const ctx = getAudioContext();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.value = 110;
        osc2.frequency.value = 116;
        
        gain.gain.value = 0.02;
        
        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 2);
        osc2.stop(ctx.currentTime + 2);
    } catch (e) {}
}

function triggerJumpscare() {
    if (!jumpscare || !jumpscareImage) return;
    
    jumpscare.classList.remove('hidden');
    jumpscareImage.src = scaryImages[Math.floor(Math.random() * scaryImages.length)];
    
    playDeathSound();
    
    setTimeout(() => {
        jumpscare.classList.add('hidden');
    }, 1000);
}

function triggerBlackout() {
    if (!lightsOut) return;
    
    lightsOut.style.opacity = '0.9';
    setTimeout(() => {
        lightsOut.style.opacity = '0';
    }, 2000);
}

// Initialize game
function initGame() {
    player = new Player();
    platforms = [];
    powerups = [];
    enemies = [];
    blackholes = [];
    score = 0;
    highestY = CANVAS_HEIGHT;
    cameraY = 0;
    gameRunning = true;

    // Create initial platforms
    for (let i = 0; i < 12; i++) {
        const x = Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH);
        const y = CANVAS_HEIGHT - 100 - i * 70;
        const rand = Math.random();
        let type = 'normal';
        if (rand > 0.85) type = 'breaking';
        else if (rand > 0.75) type = 'moving';
        platforms.push(new Platform(x, y, type));
    }

    gameOverScreen.classList.add('hidden');
    
    if (scaryMode) {
        startScaryMode();
    }
    
    gameLoop();
}

function startScaryMode() {
    // Add background elements
    for (let i = 0; i < 3; i++) {
        const ghost = document.createElement('div');
        ghost.classList.add('ghost', 'scary-element');
        ghost.style.left = `${Math.random() * 90}%`;
        ghost.style.top = `${Math.random() * 90}%`;
        background.appendChild(ghost);
    }

    for (let i = 0; i < 2; i++) {
        const fog = document.createElement('div');
        fog.classList.add('fog', 'scary-element');
        fog.style.top = `${30 + i * 30}%`;
        background.appendChild(fog);
    }

    // Start scary intervals
    if (bgMusicInterval) clearInterval(bgMusicInterval);
    bgMusicInterval = setInterval(() => {
        if (gameRunning) playScaryMusic();
    }, 5000);

    if (jumpscareInterval) clearInterval(jumpscareInterval);
    jumpscareInterval = setInterval(() => {
        if (gameRunning && Math.random() < 0.3) {
            triggerJumpscare();
        }
    }, 45000);

    if (blackoutInterval) clearInterval(blackoutInterval);
    blackoutInterval = setInterval(() => {
        if (gameRunning && Math.random() < 0.4) {
            triggerBlackout();
        }
    }, 30000);
    
    // Make background elements jump out randomly
    setInterval(() => {
        const bgElements = background.querySelectorAll('.bg-pumpkin, .bg-bat, .bg-skull');
        if (bgElements.length > 0 && Math.random() < 0.2) {
            const element = bgElements[Math.floor(Math.random() * bgElements.length)];
            element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            element.style.transform = 'scale(2) rotate(360deg)';
            element.style.opacity = '0.8';
            setTimeout(() => {
                element.style.transition = 'transform 2s ease, opacity 2s ease';
                element.style.transform = '';
                element.style.opacity = '';
            }, 300);
        }
    }, 10000);
}

function stopScaryMode() {
    const elements = background.querySelectorAll('.ghost, .fog, .scary-element');
    elements.forEach(el => el.remove());
    
    if (bgMusicInterval) {
        clearInterval(bgMusicInterval);
        bgMusicInterval = null;
    }
    if (jumpscareInterval) {
        clearInterval(jumpscareInterval);
        jumpscareInterval = null;
    }
    if (blackoutInterval) {
        clearInterval(blackoutInterval);
        blackoutInterval = null;
    }
}

// Add ambient background elements
function addBackgroundElements() {
    // Pumpkins
    for (let i = 0; i < 4; i++) {
        const pumpkin = document.createElement('div');
        pumpkin.classList.add('bg-pumpkin');
        pumpkin.textContent = '🎃';
        pumpkin.style.left = `${Math.random() * 90}%`;
        pumpkin.style.top = `${Math.random() * 90}%`;
        pumpkin.style.animationDelay = `${Math.random() * 5}s`;
        background.appendChild(pumpkin);
    }
    
    // Bats
    for (let i = 0; i < 3; i++) {
        const bat = document.createElement('div');
        bat.classList.add('bg-bat');
        bat.textContent = '🦇';
        bat.style.animationDelay = `${Math.random() * 10}s`;
        background.appendChild(bat);
    }
    
    // Spiders
    for (let i = 0; i < 3; i++) {
        const spider = document.createElement('div');
        spider.classList.add('bg-spider');
        spider.textContent = '🕷️';
        spider.style.left = `${10 + Math.random() * 80}%`;
        spider.style.animationDelay = `${Math.random() * 8}s`;
        background.appendChild(spider);
    }
    
    // Skulls
    for (let i = 0; i < 2; i++) {
        const skull = document.createElement('div');
        skull.classList.add('bg-skull');
        skull.textContent = '💀';
        skull.style.left = `${Math.random() * 90}%`;
        skull.style.top = `${Math.random() * 90}%`;
        skull.style.animationDelay = `${Math.random() * 7}s`;
        background.appendChild(skull);
    }
}

// Generate new platforms
function generatePlatforms() {
    // Find the lowest platform
    let lowestPlatformY = CANVAS_HEIGHT;
    for (let i = 0; i < platforms.length; i++) {
        if (platforms[i].y < lowestPlatformY) {
            lowestPlatformY = platforms[i].y;
        }
    }
    
    // Generate platforms above the camera view
    let generatedCount = 0;
    const maxGenerate = 5; // Limit generations per frame
    
    while (lowestPlatformY > cameraY - CANVAS_HEIGHT && generatedCount < maxGenerate) {
        const x = Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH);
        const y = lowestPlatformY - 60 - Math.random() * 40;
        const rand = Math.random();
        let type = 'normal';
        if (rand > 0.88) type = 'breaking';
        else if (rand > 0.78) type = 'moving';
        
        platforms.push(new Platform(x, y, type));
        lowestPlatformY = y;
        generatedCount++;

        // Add powerups
        if (Math.random() > 0.92) {
            const powerupType = Math.random() > 0.5 ? 'spring' : 'jetpack';
            powerups.push(new Powerup(x + PLATFORM_WIDTH/2 - 15, y - 35, powerupType));
        }

        // Add enemies
        if (Math.random() > 0.94 && score > 100) {
            enemies.push(new Enemy(x, y - 50));
        }

        // Add blackholes
        if (Math.random() > 0.97 && score > 200) {
            blackholes.push(new Blackhole(
                Math.random() * CANVAS_WIDTH,
                y - 100
            ));
        }
    }

    // Remove off-screen platforms
    platforms = platforms.filter(p => p.y < cameraY + CANVAS_HEIGHT + 100);
    powerups = powerups.filter(p => p.y < cameraY + CANVAS_HEIGHT + 100);
    enemies = enemies.filter(e => e.y < cameraY + CANVAS_HEIGHT + 100);
    blackholes = blackholes.filter(b => b.y < cameraY + CANVAS_HEIGHT + 100);
}

// Check collisions
function checkCollisions() {
    // Platform collisions
    if (player.velocityY > 0) {
        platforms.forEach(platform => {
            if (!platform.broken &&
                player.x + player.width > platform.x &&
                player.x < platform.x + platform.width &&
                player.y + player.height > platform.y &&
                player.y + player.height < platform.y + platform.height + 10) {
                
                player.velocityY = JUMP_STRENGTH;
                playJumpSound();
                
                if (platform.type === 'breaking') {
                    platform.broken = true;
                }
            }
        });
    }

    // Powerup collisions
    powerups.forEach(powerup => {
        if (!powerup.used &&
            player.x + player.width > powerup.x &&
            player.x < powerup.x + powerup.width &&
            player.y + player.height > powerup.y &&
            player.y < powerup.y + powerup.height) {
            
            powerup.used = true;
            
            if (powerup.type === 'spring') {
                player.velocityY = JUMP_STRENGTH * 1.8;
                playJumpSound();
            } else if (powerup.type === 'jetpack') {
                player.hasJetpack = true;
                player.jetpackFuel = 100;
            }
        }
    });

    // Enemy collisions
    enemies.forEach(enemy => {
        if (player.x + player.width > enemy.x &&
            player.x < enemy.x + enemy.width &&
            player.y + player.height > enemy.y &&
            player.y < enemy.y + enemy.height) {
            
            player.velocityY = 5; // Push player down
        }
    });

    // Blackhole pull
    blackholes.forEach(blackhole => {
        blackhole.pullPlayer(player);
    });

    // Check if player fell
    if (player.y > cameraY + CANVAS_HEIGHT) {
        gameOver();
    }
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;

    // Clear canvas
    ctx.fillStyle = scaryMode ? '#0a0005' : '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Update
    player.update();
    platforms.forEach(p => p.update());
    enemies.forEach(e => e.update());
    generatePlatforms();
    checkCollisions();

    // Draw
    platforms.forEach(p => p.draw());
    powerups.forEach(p => p.draw());
    enemies.forEach(e => e.draw());
    blackholes.forEach(b => b.draw());
    player.draw();

    // Update score display
    scoreDisplay.textContent = `Score: ${score}`;

    requestAnimationFrame(gameLoop);
}

// Game over
function gameOver() {
    gameRunning = false;
    
    if (scaryMode) {
        triggerJumpscare();
        stopScaryMode();
    }
    
    playDeathSound();
    
    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
        finalScoreDisplay.textContent = `Score: ${score}`;
        nameInput.value = localStorage.getItem('day1PlayerName') || '';
    }, scaryMode ? 1200 : 500);
}

// Update timer
function updateTimer() {
    const now = new Date();
    
    // Convert GAME_END_DATE to milliseconds for comparison
    const endTime = GAME_END_DATE.getTime();
    const currentTime = now.getTime();
    const diff = endTime - currentTime;
    
    if (diff <= 0) {
        timerElement.textContent = "Game Ended!";
        timerElement.style.color = '#ff0000';
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) {
        timerElement.textContent = `${days}d ${hours}h ${minutes}m`;
    } else {
        timerElement.textContent = `${hours}h ${minutes}m ${seconds}s`;
    }
}

// Submit score
async function submitScore() {
    const name = nameInput.value.trim();
    if (!name) {
        alert('Please enter your name!');
        return;
    }

    localStorage.setItem('day1PlayerName', name);
    
    const now = new Date();
    const duringGamePeriod = now < GAME_END_DATE;

    try {
        // Save to day 1 leaderboard
        await window.firebaseAddDoc(
            window.firebaseCollection(window.firebaseDb, 'day1Scores'),
            {
                name: name,
                score: score,
                timestamp: now,
                duringGamePeriod: duringGamePeriod
            }
        );

        alert('Score submitted!');
        gameOverScreen.classList.add('hidden');
        initGame();
    } catch (error) {
        console.error('Error submitting score:', error);
        alert('Failed to submit score. Please try again.');
    }
}

// Load leaderboard
async function loadLeaderboard() {
    try {
        const q = window.firebaseQuery(
            window.firebaseCollection(window.firebaseDb, 'day1Scores'),
            window.firebaseOrderBy('score', 'desc'),
            window.firebaseLimit(50)
        );
        
        const querySnapshot = await window.firebaseGetDocs(q);
        const scores = [];
        
        querySnapshot.forEach((doc) => {
            scores.push(doc.data());
        });

        displayLeaderboard(scores);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboardBody.innerHTML = '<tr><td colspan="4">Error loading scores</td></tr>';
    }
}

function displayLeaderboard(scores) {
    leaderboardBody.innerHTML = '';
    
    if (scores.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="4">No scores yet!</td></tr>';
        return;
    }

    scores.forEach((scoreData, index) => {
        const row = document.createElement('tr');
        
        if (index === 0) row.classList.add('rank-1');
        if (index === 1) row.classList.add('rank-2');
        if (index === 2) row.classList.add('rank-3');
        
        const date = scoreData.timestamp?.toDate?.() || new Date();
        const dateStr = date.toLocaleDateString();
        const gamePeriodMarker = scoreData.duringGamePeriod ? ' ⭐' : '';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${scoreData.name}${gamePeriodMarker}</td>
            <td>${scoreData.score}</td>
            <td>${dateStr}</td>
        `;
        
        leaderboardBody.appendChild(row);
    });
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

if (backBtn) {
    backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

if (helpBtn) {
    helpBtn.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
    });
}

if (helpClose) {
    helpClose.addEventListener('click', () => {
        helpModal.classList.add('hidden');
    });
}

if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', () => {
        leaderboardModal.classList.remove('hidden');
        loadLeaderboard();
    });
}

if (leaderboardClose) {
    leaderboardClose.addEventListener('click', () => {
        leaderboardModal.classList.add('hidden');
    });
}

if (submitScoreBtn) {
    submitScoreBtn.addEventListener('click', submitScore);
}

if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        initGame();
    });
}

if (scaryToggle) {
    scaryToggle.addEventListener('change', function() {
        scaryMode = this.checked;
        localStorage.setItem('day1ScaryMode', scaryMode);
        
        if (gameRunning) {
            if (scaryMode) {
                startScaryMode();
            } else {
                stopScaryMode();
            }
        }
    });
}

// Submit score
async function submitScore() {
    const name = nameInput.value.trim();
    if (!name) {
        alert('Please enter your name!');
        return;
    }

    localStorage.setItem('day1PlayerName', name);
    
    const now = new Date();
    const duringGamePeriod = now < GAME_END_DATE;

    try {
        // Save to day 1 leaderboard
        await window.firebaseAddDoc(
            window.firebaseCollection(window.firebaseDb, 'day1Scores'),
            {
                name: name,
                score: score,
                timestamp: now,
                duringGamePeriod: duringGamePeriod
            }
        );

        alert('Score submitted!');
        gameOverScreen.classList.add('hidden');
        initGame();
    } catch (error) {
        console.error('Error submitting score:', error);
        alert('Failed to submit score. Please try again.');
    }
}

// Initialize
window.startGame = function() {
    addBackgroundElements();
    updateTimer();
    setInterval(updateTimer, 1000);
    initGame();
};

if (window.firebaseReady) {
    window.startGame();
}