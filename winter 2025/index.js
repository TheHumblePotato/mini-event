// ==================== Holiday Dates ==================== 
const holidays = {
    christmas: new Date(2025, 11, 25),
    hanukkah: new Date(2025, 11, 25),
    kwanzaa: new Date(2026, 0, 1),
    newyear: new Date(2026, 0, 1)
};

// ==================== Snowflake System ==================== 
const canvas = document.getElementById('snow-canvas');
const ctx = canvas.getContext('2d');
let snowflakes = [];
let windDirection = 1;
let windStrength = 0.5;
let windChangeTimer = 0;

// Snowflake types
const SNOWFLAKE_TYPES = {
    SNOW: 'snow',
    HAIL: 'hail',
    SLEET: 'sleet',
    SPECIAL_CLUE: 'clue'
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Snowflake {
    constructor(isClue = false) {
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.size = Math.random() * 5 + 2;
        this.speedY = Math.random() * 2 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.opacity = Math.random() * 0.5 + 0.5;
        
        // Determine snowflake type (no yellow/gold clues)
        const rand = Math.random();
        if (rand < 0.7) {
            this.type = SNOWFLAKE_TYPES.SNOW;
            this.color = '#FFFFFF';
        } else if (rand < 0.85) {
            this.type = SNOWFLAKE_TYPES.HAIL;
            this.color = '#E8F4F8';
            this.size = Math.random() * 2 + 1; // Smaller
        } else {
            this.type = SNOWFLAKE_TYPES.SLEET;
            this.color = '#D0E8F2';
            this.size = Math.random() * 3 + 1.5;
        }
        // No special clue snowflakes — user wants only white snow
    }

    update() {
        this.y += this.speedY;
        
        // Apply wind effect
        this.x += (this.speedX + windDirection * windStrength) * 0.5;

        // Gentle oscillation based on type
        if (this.type === SNOWFLAKE_TYPES.SNOW) {
            this.speedX += Math.sin(this.y * 0.01) * 0.1;
        } else if (this.type === SNOWFLAKE_TYPES.HAIL) {
            this.speedY += 0.1; // Hail falls faster
        }

        // Fade out near bottom
        if (this.y > canvas.height * 0.9) {
            this.opacity *= 0.98;
        }

        // Reset if off screen
        if (this.y > canvas.height + 20) {
            this.x = Math.random() * canvas.width;
            this.y = -10;
            this.opacity = Math.random() * 0.5 + 0.5;
        }

        // Wrap around sides
        if (this.x > canvas.width + 20) this.x = -20;
        if (this.x < -20) this.x = canvas.width + 20;
    }

    draw() {
        ctx.fillStyle = `rgba(${this.color === '#FFFFFF' ? '255,255,255' : 
                              this.color === '#E8F4F8' ? '232,244,248' :
                              this.color === '#D0E8F2' ? '208,232,242' :
                              '255,215,0'}, ${this.opacity})`;
        
        ctx.shadowColor = `rgba(255, 255, 255, ${this.opacity * 0.5})`;
        ctx.shadowBlur = 10;

        // Draw based on type
        if (this.type === SNOWFLAKE_TYPES.SPECIAL_CLUE) {
            // Gold sparkle for clue
            ctx.fillStyle = `rgba(255, 215, 0, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Extra glow
            ctx.strokeStyle = `rgba(255, 215, 0, ${this.opacity * 0.7})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.type === SNOWFLAKE_TYPES.HAIL) {
            // Hard circle for hail
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Snowflake pattern
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            if (this.size > 4) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.7})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(this.x - this.size * 1.5, this.y);
                ctx.lineTo(this.x + this.size * 1.5, this.y);
                ctx.moveTo(this.x, this.y - this.size * 1.5);
                ctx.lineTo(this.x, this.y + this.size * 1.5);
                ctx.stroke();
            }
        }
    }
}

function initSnowflakes() {
    snowflakes = [];
    const snowflakeCount = Math.max(50, Math.floor(window.innerWidth / 20));
    for (let i = 0; i < snowflakeCount; i++) {
        snowflakes.push(new Snowflake(false));
    }
    // Add a clue snowflake periodically
    addClueSnowflake();
}

function addClueSnowflake() {
    // Clue snowflakes disabled per user request — no yellow snow
}


function animateSnow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update wind direction periodically (much less wind)
    windChangeTimer++;
    if (windChangeTimer > 900) { // Change every ~15 seconds
        windChangeTimer = 0;
        windDirection = (Math.random() * 2 - 1) * 0.3; // Small direction
        windStrength = Math.random() * 0.4 + 0.1; // Between 0.1 and 0.5
    }

    snowflakes.forEach(flake => {
        flake.update();
        flake.draw();
    });

    // Occasionally add clue snowflakes
    addClueSnowflake();

    requestAnimationFrame(animateSnow);
}

// ==================== Stars System ==================== 
function createStars() {
    const starsContainer = document.getElementById('stars-container');
    starsContainer.innerHTML = '';
    const starCount = 150;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.width = Math.random() * 3 + 1 + 'px';
        star.style.height = star.style.width;
        star.style.opacity = Math.random() * 0.7 + 0.3;
        star.style.animationDelay = Math.random() * 3 + 's';
        
        // Add twinkling animation
        star.style.animation = `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`;
        starsContainer.appendChild(star);
    }
    // Parallax: store star elements with depth
    const starElems = Array.from(starsContainer.children);
    starElems.forEach((el) => {
        el.dataset.depth = (Math.random() * 0.7 + 0.3).toFixed(2); // 0.3 - 1.0
    });
}

// Small parallax response to cursor for stars
function initStarsParallax(){
    const starsContainer = document.getElementById('stars-container');
    if (!starsContainer) return;
    window.addEventListener('mousemove', (e) => {
        const cx = window.innerWidth/2;
        const cy = window.innerHeight/2;
        const dx = (e.clientX - cx) / cx; // -1..1
        const dy = (e.clientY - cy) / cy;
        Array.from(starsContainer.children).forEach(s => {
            const depth = parseFloat(s.dataset.depth || '0.5');
            const tx = (dx * 10 * (1 - depth));
            const ty = (dy * 8 * (1 - depth));
            s.style.transform = `translate(${tx}px, ${ty}px)`;
        });
    });
}

// ==================== Weather Canvas (Aurora / Rain) ====================
const weatherCanvas = document.getElementById('weather-canvas');
let wctx = null;
let weatherWidth = 0, weatherHeight = 0;
let auroraPhase = 0;
let rainDrops = [];
let rainEnabled = false;

function initWeatherCanvas(){
    if (!weatherCanvas) return;
    wctx = weatherCanvas.getContext('2d');
    weatherCanvas.width = window.innerWidth;
    weatherCanvas.height = window.innerHeight;
    weatherWidth = weatherCanvas.width; weatherHeight = weatherCanvas.height;
}

function resizeWeatherCanvas(){
    if (!weatherCanvas) return;
    weatherCanvas.width = window.innerWidth;
    weatherCanvas.height = window.innerHeight;
    weatherWidth = weatherCanvas.width; weatherHeight = weatherCanvas.height;
}

function drawAurora(){
    if (!wctx) return;
    wctx.clearRect(0,0,weatherWidth,weatherHeight);
    // soft layered bands
    const bands = 5;
    for (let b=0;b<bands;b++){
        const hue = 160 + b*10; // greenish to teal
        const alpha = 0.06 + 0.02*b;
        wctx.fillStyle = `rgba(${Math.floor(30 + b*30)}, ${Math.floor(160 - b*10)}, ${Math.floor(140 + b*20)}, ${alpha})`;
        wctx.globalCompositeOperation = 'lighter';
        wctx.beginPath();
        const offset = Math.sin(auroraPhase * (0.6 + b*0.1) + b) * (40 + b*30);
        const height = 120 + b*30;
        const baseY = weatherHeight * 0.2 + b*30 + offset;
        wctx.moveTo(0, baseY);
        for (let x=0;x<=weatherWidth;x+=20){
            const y = baseY + Math.sin((x/200) + auroraPhase* (0.6 + b*0.02) + b*0.2) * (20 + b*6);
            wctx.lineTo(x, y);
        }
        wctx.lineTo(weatherWidth, baseY + 400);
        wctx.lineTo(0, baseY + 400);
        wctx.closePath();
        wctx.fill();
    }
    wctx.globalCompositeOperation = 'source-over';
}

function animateWeather(){
    auroraPhase += 0.01;
    // draw aurora when enabled
    if (document.body.classList.contains('bg-aurora') || document.body.classList.contains('scene-aurora')){
        drawAurora();
    } else {
        if (wctx) wctx.clearRect(0,0,weatherWidth,weatherHeight);
    }

    // rain
    if (rainEnabled){
        // update drops
        wctx.save();
        wctx.strokeStyle = 'rgba(200,220,255,0.35)';
        wctx.lineWidth = 1;
        wctx.beginPath();
        for (let i=rainDrops.length-1;i>=0;i--){
            const d = rainDrops[i];
            d.x += d.vx; d.y += d.vy;
            wctx.moveTo(d.x, d.y);
            wctx.lineTo(d.x - d.vx*2, d.y - d.vy*2);
            if (d.y > weatherHeight + 50) { rainDrops.splice(i,1); }
        }
        wctx.stroke();
        wctx.restore();
        // spawn new
        while (rainDrops.length < Math.floor(weatherWidth/12)){
            rainDrops.push({ x: Math.random()*weatherWidth, y: Math.random()*-200, vx: -1 - Math.random()*1.5, vy: 8+Math.random()*8 });
        }
    }

    requestAnimationFrame(animateWeather);
}

function enableRain(enable){
    rainEnabled = !!enable;
    if (!rainEnabled) rainDrops = [];
}

// ==================== Floating Ornaments ==================== 
function createFloatingOrnaments() {
    const floatingElements = document.getElementById('floating-elements');
    floatingElements.innerHTML = '';
    const count = 6;

    for (let i = 0; i < count; i++) {
        const ornament = document.createElement('div');
        ornament.className = 'floating-ornament';
        ornament.style.left = Math.random() * 90 + 5 + '%';
        ornament.style.top = Math.random() * 60 + '%';
        ornament.style.animationDuration = Math.random() * 2 + 3 + 's';
        ornament.style.animationDelay = Math.random() * 1 + 's';
        floatingElements.appendChild(ornament);
    }
}

// ==================== Day/Night Cycle (Slower) ==================== 
let cycleHour = 6;

function updateDayNightCycle() {
    // Much slower cycle: 1 hour per ~24 seconds, full cycle 60 seconds
    const cycleSpeed = 0.00417; // 1 hour per ~240 seconds (60 second cycle)
    cycleHour = (cycleHour + cycleSpeed) % 24;

    const body = document.body;
    const isNight = cycleHour > 18 || cycleHour < 6;

    if (isNight && !body.classList.contains('night-mode')) {
        body.classList.add('night-mode');
    } else if (!isNight && body.classList.contains('night-mode')) {
        body.classList.remove('night-mode');
    }

    requestAnimationFrame(updateDayNightCycle);
}

// ==================== Celestial Body (Sun/Moon) ==================== 
function updateCelestialBody() {
    const celestialBody = document.getElementById('celestial-body');
    
    if (!celestialBody.classList.contains('sun')) {
        celestialBody.classList.add('sun');
    }
    
    const body = document.body;
    const isNight = body.classList.contains('night-mode');
    
    if (isNight) {
        celestialBody.classList.remove('sun');
        celestialBody.classList.add('moon');
    } else {
        celestialBody.classList.remove('moon');
        celestialBody.classList.add('sun');
    }
    
    requestAnimationFrame(updateCelestialBody);
}

// ==================== Countdown Timers ==================== 
function formatCountdown(targetDate) {
    const now = new Date();
    let diff = targetDate - now;

    if (diff < 0) {
        return '00:00:00';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateCountdowns() {
    document.getElementById('christmas-countdown').textContent = formatCountdown(holidays.christmas);
    document.getElementById('hanukkah-countdown').textContent = formatCountdown(holidays.hanukkah);
    document.getElementById('kwanzaa-countdown').textContent = formatCountdown(holidays.kwanzaa);
    document.getElementById('newyear-countdown').textContent = formatCountdown(holidays.newyear);
}

// ==================== Button Interactions ==================== 
function setupButtonHandlers() {
    document.getElementById('decomytree-btn').addEventListener('click', () => {
        window.location.href = 'decomytree.html';
    });

    // Small game links are direct anchors and available permanently; no release modal behavior required.
    // Nothing to do here — the <a> elements handle navigation directly.

    // Background settings
    const bgSettingsBtn = document.getElementById('bg-settings-btn');
    const bgSettingsModal = document.getElementById('bg-settings-modal');
    const closeBgSettings = document.getElementById('close-bg-settings');
    const bgThemeOptions = document.querySelectorAll('input[name="bg-theme"]');

    if (bgSettingsBtn) {
        bgSettingsBtn.addEventListener('click', () => {
            bgSettingsModal.classList.remove('hidden');
            // Load saved preference
            const saved = localStorage.getItem('websiteBgTheme') || 'default';
            const radio = document.querySelector(`input[name="bg-theme"][value="${saved}"]`);
            if (radio) radio.checked = true;
        });
    }

    if (closeBgSettings) {
        closeBgSettings.addEventListener('click', () => {
            bgSettingsModal.classList.add('hidden');
        });
    }

    bgThemeOptions.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const theme = e.target.value;
            localStorage.setItem('websiteBgTheme', theme);
            
            // Remove all theme classes
            document.body.classList.remove('bg-default', 'bg-colorful', 'bg-snowy', 'bg-aurora', 'bg-sunset');
            
            // Add selected theme
            if (theme === 'default') {
                // Default, no class needed
            } else {
                document.body.classList.add('bg-' + theme);
            }
        });
    });
}

// ==================== Notification System ==================== 
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        z-index: 2000;
        font-size: 1rem;
        animation: slide-up 0.3s ease-out;
        backdrop-filter: blur(10px);
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slide-down 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

// ==================== CSS Animations ==================== 
const style = document.createElement('style');
style.textContent = `
    @keyframes particle-float {
        0% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateY(-100px) scale(0.5);
        }
    }

    @keyframes slide-up {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }

    @keyframes slide-down {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
    }

    @keyframes twinkle {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
    }

    @keyframes powerup-float {
        0% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateY(-100px) scale(0);
        }
    }
`;
document.head.appendChild(style);

// ==================== Initialization ==================== 
window.addEventListener('load', () => {
    resizeCanvas();
    initSnowflakes();
    createStars();
    createFloatingOrnaments();
    initWeatherCanvas();
    initStarsParallax();
    animateWeather();
    
    // Load saved background preference
    const savedBgTheme = localStorage.getItem('websiteBgTheme') || 'default';
    if (savedBgTheme !== 'default') {
        document.body.classList.add('bg-' + savedBgTheme);
    }
    // Turn on rain for sunset theme as a tasteful effect; can be toggled via API
    if (savedBgTheme === 'sunset') enableRain(true);
    
    animateSnow();
    updateDayNightCycle();
    updateCelestialBody();
    
    updateCountdowns();
    setInterval(updateCountdowns, 1000);

    setupButtonHandlers();

    setTimeout(() => {
        showNotification('❄️ Welcome to Winter Celebrations!');
    }, 500);
});

window.addEventListener('resize', () => {
    resizeCanvas();
    createFloatingOrnaments();
    resizeWeatherCanvas();
});

// Expose simple API to toggle rain manually (useful for themes or debugging)
window.enableWeatherRain = enableRain;
