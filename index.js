// ==================== FIREBASE SETUP ====================
// Initialize Firebase (library loaded via script tags in HTML)
const firebaseConfig = {
    apiKey: "AIzaSyARY96nrH2Aio8rOiLkewSXtTS40TZLrAw",
    authDomain: "nerd-mini-events.firebaseapp.com",
    databaseURL: "https://nerd-mini-events-default-rtdb.firebaseio.com",
    projectId: "nerd-mini-events",
    storageBucket: "nerd-mini-events.firebasestorage.app",
    messagingSenderId: "974357416633",
    appId: "1:974357416633:web:e190de60553a685d03e968",
    measurementId: "G-V9NGCSEY8J"
};

let app, database;

// Initialize Firebase when document is ready
function initializeFirebase() {
    try {
        app = firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        console.log("Firebase initialized successfully");
    } catch (error) {
        console.warn("Firebase might already be initialized or unavailable:", error);
    }
}

// ==================== GAME CONSTANTS ====================
const GEMINI_API_KEY = "AIzaSyAZjwhCTja1snVUI4h7_nhybWPNCb6AzqM";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + GEMINI_API_KEY;

const SYMBOLS = {
    0: "🎲",
    1: "🧠",
    2: "♠",
    3: "∞",
    4: "Σ",
    5: "∫",
    6: "√",
    7: "π",
};

const TIER_THRESHOLDS = [
    1000,      // Tier 1: 1K randomness
    10000,     // Tier 2: 10K
    100000,    // Tier 3: 100K
    1000000,   // Tier 4: 1M
    10000000,  // Tier 5: 10M
];

// ==================== GAME STATE ====================
const gameState = {
    randomness: 0,
    rpc: 1, // Randomness per click
    rps: 0, // Randomness per second
    totalClicks: 0,
    totalTime: 0,
    ascensionLevel: 0,
    ascensionMultiplier: 1,
    
    upgrades: {},
    buildings: {},
    
    aiGeneratedUpgrades: [],
    aiGeneratedBuildings: [],
    
    goldenDiceActive: false,
    goldenDiceDuration: 10000,
    goldenDiceMultiplier: 7,
    
    lastSaveTime: 0,
    existingUpgradesForAI: [],
    currentTier: 0,
};

// ==================== DEFAULT UPGRADES & BUILDINGS ====================
const DEFAULT_UPGRADES = {
    "double-click": {
        name: "Double Click",
        type: "upgrade",
        baseCost: 10,
        description: "Click two dice at once. +1 RPC",
        effects: { cpc: 1 },
        tier: 0,
        owned: 0,
    },
    "triple-click": {
        name: "Triple Click",
        type: "upgrade",
        baseCost: 100,
        description: "Tap into probability. +2 RPC",
        effects: { cpc: 2 },
        tier: 0,
        owned: 0,
    },
    "four-click": {
        name: "Quadruple Click",
        type: "upgrade",
        baseCost: 500,
        description: "Master the quantum click. +4 RPC",
        effects: { cpc: 4 },
        tier: 0,
        owned: 0,
    },
    "click-multiplier-2x": {
        name: "Click Power I",
        type: "upgrade",
        baseCost: 50,
        description: "Enhance your clicking force. ×1.15 RPC",
        effects: { cpc_mult: 1.15 },
        tier: 0,
        owned: 0,
    },
};

const DEFAULT_BUILDINGS = {
    "neural-pathway": {
        name: "Neural Pathway",
        type: "building",
        baseCost: 10,
        icon: "🧠",
        description: "Your brain's pathway to randomness. +0.1 RPS",
        cps: 0.1,
        tier: 0,
        owned: 0,
    },
    "probability-field": {
        name: "Probability Field",
        type: "building",
        baseCost: 100,
        icon: "∞",
        description: "Bends probability in your favor. +1 RPS",
        cps: 1,
        tier: 0,
        owned: 0,
    },
    "chaos-engine": {
        name: "Chaos Engine",
        type: "building",
        baseCost: 1200,
        icon: "⚡",
        description: "Harnesses pure chaotic energy. +8 RPS",
        cps: 8,
        tier: 0,
        owned: 0,
    },
};

// ==================== DOM ELEMENTS ====================
const elements = {
    randomness: document.getElementById("randomness"),
    rpc: document.getElementById("rpc"),
    rps: document.getElementById("rps"),
    clickerSymbol: document.getElementById("clickerSymbol"),
    clickFeedback: document.getElementById("clickFeedback"),
    progressText: document.getElementById("progressText"),
    themeToggle: document.getElementById("themeToggle"),
    upgradesList: document.getElementById("upgradesList"),
    buildingsList: document.getElementById("buildingsList"),
    goldenDiceContainer: document.getElementById("goldenDiceContainer"),
    goldenDiceIndicator: document.querySelector(".golden-dice-indicator"),
    minigameBtn: document.getElementById("minigameBtn"),
    minigameSection: document.getElementById("minigameSection"),
    ascensionSection: document.getElementById("ascensionSection"),
    ascensionLevel: document.getElementById("ascensionLevel"),
    ascendButton: document.getElementById("ascendButton"),
    tabBtns: document.querySelectorAll(".tab-btn"),
    shopTabs: document.querySelectorAll(".shop-tab"),
};

// ==================== INITIALIZATION ====================
async function initGame() {
    console.log("Initializing game...");
    
    // Initialize Firebase
    initializeFirebase();
    
    // Load theme preference
    loadTheme();
    
    // Load game state from Firebase
    await loadGameState();
    
    // Initialize upgrades and buildings
    Object.assign(gameState.upgrades, DEFAULT_UPGRADES);
    Object.assign(gameState.buildings, DEFAULT_BUILDINGS);
    
    // Setup event listeners
    setupEventListeners();
    
    // Render initial state
    renderStats();
    renderUpgrades();
    renderBuildings();
    
    // Start passive income loop
    startPassiveIncomeLoop();
    
    // Start auto-save
    startAutoSave();
    
    // Start symbol rotation based on progress
    startSymbolRotation();
    
    console.log("Game initialized!");
}

// ==================== FIREBASE FUNCTIONS ====================
async function saveGameState() {
    try {
        if (!database) return;
        
        const userId = getOrCreateUserId();
        const stateRef = database.ref("users/" + userId + "/gameState");
        
        await stateRef.set({
            randomness: gameState.randomness,
            rpc: gameState.rpc,
            rps: gameState.rps,
            totalClicks: gameState.totalClicks,
            totalTime: gameState.totalTime,
            ascensionLevel: gameState.ascensionLevel,
            ascensionMultiplier: gameState.ascensionMultiplier,
            upgrades: gameState.upgrades,
            buildings: gameState.buildings,
            timestamp: Date.now(),
        });
        
        console.log("Game saved!");
    } catch (error) {
        console.error("Error saving game:", error);
    }
}

async function loadGameState() {
    try {
        if (!database) return;
        
        const userId = getOrCreateUserId();
        const snapshot = await database.ref("users/" + userId + "/gameState").once("value");
        
        if (snapshot.exists()) {
            const saved = snapshot.val();
            gameState.randomness = saved.randomness || 0;
            gameState.rpc = saved.rpc || 1;
            gameState.rps = saved.rps || 0;
            gameState.totalClicks = saved.totalClicks || 0;
            gameState.totalTime = saved.totalTime || 0;
            gameState.ascensionLevel = saved.ascensionLevel || 0;
            gameState.ascensionMultiplier = saved.ascensionMultiplier || 1;
            gameState.upgrades = saved.upgrades || {};
            gameState.buildings = saved.buildings || {};
            console.log("Game loaded from Firebase!");
        } else {
            console.log("No saved game found, starting fresh");
        }
    } catch (error) {
        console.error("Error loading game:", error);
    }
}

function getOrCreateUserId() {
    let userId = localStorage.getItem("37day-userId");
    if (!userId) {
        userId = "user-" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("37day-userId", userId);
    }
    return userId;
}

// ==================== CLICK HANDLER ====================
function handleClick() {
    let gainedRandomness = gameState.rpc;
    
    // Apply ascension multiplier
    gainedRandomness *= gameState.ascensionMultiplier;
    
    // Apply golden dice multiplier if active
    if (gameState.goldenDiceActive) {
        gainedRandomness *= gameState.goldenDiceMultiplier;
    }
    
    gameState.randomness += gainedRandomness;
    gameState.totalClicks++;
    
    // Visual feedback
    showClickFeedback(gainedRandomness);
    
    // Check for tier progression
    checkTierProgression();
    
    // Check for golden dice trigger
    checkGoldenDice();
    
    // Render updates
    renderStats();
}

function showClickFeedback(amount) {
    const feedback = document.createElement("div");
    feedback.className = "click-feedback";
    feedback.textContent = "+" + formatNumber(amount);
    elements.clickFeedback.parentElement.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 600);
}

// ==================== PASSIVE INCOME ====================
function startPassiveIncomeLoop() {
    const interval = 100; // Update every 100ms
    const rpsPerTick = (gameState.rps / 1000) * interval;
    
    setInterval(() => {
        if (gameState.rps > 0) {
            let gain = (gameState.rps / 10); // Per 100ms
            gain *= gameState.ascensionMultiplier;
            
            if (gameState.goldenDiceActive) {
                gain *= gameState.goldenDiceMultiplier;
            }
            
            gameState.randomness += gain;
            gameState.totalTime += interval;
            
            renderStats();
            checkTierProgression();
            checkGoldenDice();
        }
    }, interval);
}

// ==================== UPGRADE & BUILDING PURCHASE ====================
function purchaseUpgrade(upgradeId) {
    const upgrade = gameState.upgrades[upgradeId];
    if (!upgrade) return;
    
    const cost = calculateUpgradeCost(upgradeId);
    
    if (gameState.randomness < cost) {
        alert("Not enough Randomness!");
        return;
    }
    
    gameState.randomness -= cost;
    upgrade.owned++;
    
    // Apply effects
    applyUpgradeEffects(upgrade);
    
    renderStats();
    renderUpgrades();
    checkTierProgression();
    saveGameState();
}

function purchaseBuilding(buildingId) {
    const building = gameState.buildings[buildingId];
    if (!building) return;
    
    const cost = calculateBuildingCost(buildingId);
    
    if (gameState.randomness < cost) {
        alert("Not enough Randomness!");
        return;
    }
    
    gameState.randomness -= cost;
    building.owned++;
    
    // Apply building effects
    applyBuildingEffects(building);
    
    renderStats();
    renderBuildings();
    checkTierProgression();
    saveGameState();
}

function applyUpgradeEffects(upgrade) {
    const effects = upgrade.effects;
    
    if (effects.cpc) {
        gameState.rpc += effects.cpc;
    }
    if (effects.cpc_mult) {
        gameState.rpc *= effects.cpc_mult;
    }
    if (effects.rps) {
        gameState.rps += effects.rps;
    }
    if (effects.rps_mult) {
        gameState.rps *= effects.rps_mult;
    }
}

function applyBuildingEffects(building) {
    gameState.rps += building.cps;
}

function calculateUpgradeCost(upgradeId) {
    const upgrade = gameState.upgrades[upgradeId];
    return Math.ceil(upgrade.baseCost * Math.pow(1.15, upgrade.owned));
}

function calculateBuildingCost(buildingId) {
    const building = gameState.buildings[buildingId];
    return Math.ceil(building.baseCost * Math.pow(1.15, building.owned));
}

// ==================== TIER PROGRESSION & AI CALLS ====================
async function checkTierProgression() {
    for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
        if (gameState.randomness >= TIER_THRESHOLDS[i] && gameState.currentTier === i) {
            gameState.currentTier = i + 1;
            console.log("🎉 Tier progression! Now at tier " + gameState.currentTier);
            console.log("Next threshold: " + (TIER_THRESHOLDS[i + 1] ? TIER_THRESHOLDS[i + 1] : "Max tier reached"));
            
            showToast("🎉 Tier " + gameState.currentTier + " Unlocked! New upgrades & buildings available!", "success", 4000);
            
            // Call AI to generate new upgrades and buildings
            await generateAIContent(i + 1);
            saveGameState();
        }
    }
}

async function generateAIContent(tier) {
    try {
        console.log("📡 Calling Gemini API for tier " + tier + " content...");
        
        // Prepare context about current upgrades and buildings
        const gameContext = {
            currentTier: tier,
            playerRandomness: Math.floor(gameState.randomness),
            currentRPC: Math.floor(gameState.rpc * 100) / 100,
            currentRPS: Math.floor(gameState.rps * 100) / 100,
            totalBuildings: Object.values(gameState.buildings).reduce((sum, b) => sum + b.owned, 0),
            totalUpgrades: Object.values(gameState.upgrades).reduce((sum, u) => sum + u.owned, 0),
            existingUpgrades: Object.entries(gameState.upgrades)
                .filter(([_, u]) => u.tier <= tier)
                .map(([id, u]) => ({
                    id,
                    name: u.name,
                    baseCost: u.baseCost,
                    effects: u.effects
                })),
            existingBuildings: Object.entries(gameState.buildings)
                .filter(([_, b]) => b.tier <= tier)
                .map(([id, b]) => ({
                    id,
                    name: b.name,
                    baseCost: b.baseCost,
                    cps: b.cps
                })),
        };
        
        const prompt = createGeminiPrompt(gameContext);
        console.log("Prompt length: " + prompt.length + " characters");
        
        const response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }],
                }],
            }),
        });
        
        if (!response.ok) {
            throw new Error("API responded with status " + response.status);
        }
        
        const data = await response.json();
        
        if (data.error) {
            console.error("API Error:", data.error);
            return;
        }
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            parseAIResponse(aiResponse, tier);
        } else {
            console.warn("Unexpected API response structure:", data);
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
    }
}

function createGeminiPrompt(context) {
    const upgradesList = context.existingUpgrades.map(u => "- " + u.name + " (costs " + u.baseCost + "): " + JSON.stringify(u.effects)).join('\n');
    const buildingsList = context.existingBuildings.map(b => "- " + b.name + " (costs " + b.baseCost + ", generates " + b.cps + " RPS)").join('\n');
    
    return "You are a game designer creating upgrades and buildings for a clicker game called '37 Day Randomness Challenge'.\n\n" +
        "CURRENT GAME STATE (Tier " + context.currentTier + "):\n" +
        "- Player has: " + context.playerRandomness + " Randomness\n" +
        "- Click power (RPC): " + context.currentRPC + "\n" +
        "- Passive generation (RPS): " + context.currentRPS + "\n" +
        "- Buildings owned: " + context.totalBuildings + "\n" +
        "- Upgrades bought: " + context.totalUpgrades + "\n\n" +
        
        "EXISTING UPGRADES (Reference only - DO NOT duplicate):\n" +
        (upgradesList || "None yet") + "\n\n" +
        
        "EXISTING BUILDINGS (Reference only - DO NOT duplicate):\n" +
        (buildingsList || "None yet") + "\n\n" +
        
        "YOUR TASK:\n" +
        "Generate EXACTLY 3 UPGRADES and EXACTLY 2 BUILDINGS for Tier " + context.currentTier + ".\n" +
        "Theme: Randomness, probability, chaos, mathematics, dice, brains, infinity symbols.\n\n" +
        
        "REQUIREMENTS:\n" +
        "1. Upgrades should cost 10-100x current resources\n" +
        "2. Buildings should cost 5-50x current resources\n" +
        "3. Effects must be balanced (1-3x multipliers, 5-50 additive values)\n" +
        "4. Each item must have a unique name and description\n" +
        "5. All values must be positive numbers\n\n" +
        
        "RESPONSE FORMAT (return ONLY valid JSON, one object per line):\n" +
        "For UPGRADES: {\"type\":\"upgrade\",\"name\":\"Name\",\"description\":\"50 chars max\",\"baseCost\":number,\"effects\":{\"effectType\":number,...}}\n" +
        "For BUILDINGS: {\"type\":\"building\",\"name\":\"Name\",\"description\":\"50 chars max\",\"baseCost\":number,\"cps\":number,\"icon\":\"emoji\"}\n\n" +
        
        "Valid effect types: cpc (per click), rps (per second), cpc_mult, rps_mult, building_boost\n" +
        "Valid icons: emoji only (e.g., 🎲, 🧠, ⚡, ♠, ∞, π, √, etc)\n\n" +
        
        "OUTPUT: Respond with ONLY the JSON objects, no other text, no markdown, no explanations.";
}
}

function parseAIResponse(response, tier) {
    try {
        console.log("Parsing AI response for tier " + tier);
        console.log("Response:", response);
        
        // Extract JSON objects from response - more robust parsing
        const lines = response.split('\n');
        let upgradeCount = 0;
        let buildingCount = 0;
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) continue;
            
            try {
                const item = JSON.parse(trimmed);
                
                // Validate item structure
                if (!item.type || !item.name || item.baseCost === undefined) {
                    console.warn("Invalid item structure:", item);
                    continue;
                }
                
                if (item.type === "upgrade" && upgradeCount < 3) {
                    const id = "ai-upgrade-t" + tier + "-" + upgradeCount;
                    gameState.upgrades[id] = {
                        name: item.name,
                        type: "upgrade",
                        baseCost: Math.max(10, parseInt(item.baseCost)) || 100,
                        description: item.description || "AI-generated upgrade",
                        effects: item.effects || { cpc: 1 },
                        tier,
                        owned: 0,
                    };
                    console.log("✓ Added upgrade: " + item.name);
                    upgradeCount++;
                } else if (item.type === "building" && buildingCount < 2) {
                    const id = "ai-building-t" + tier + "-" + buildingCount;
                    gameState.buildings[id] = {
                        name: item.name,
                        type: "building",
                        baseCost: Math.max(10, parseInt(item.baseCost)) || 100,
                        icon: item.icon || "⚙️",
                        description: item.description || "AI-generated building",
                        cps: Math.max(0.1, parseFloat(item.cps) || 1),
                        tier,
                        owned: 0,
                    };
                    console.log("✓ Added building: " + item.name);
                    buildingCount++;
                }
            } catch (parseError) {
                // Skip lines that can't be parsed
            }
        }
        
        console.log("Generated " + upgradeCount + " upgrades and " + buildingCount + " buildings for tier " + tier);
        
        if (upgradeCount > 0 || buildingCount > 0) {
            renderUpgrades();
            renderBuildings();
            saveGameState();
        }
    } catch (error) {
        console.error("Error parsing AI response:", error);
    }
}

// ==================== GOLDEN DICE ====================
function checkGoldenDice() {
    // 0.2% chance per tick (every 100ms) to trigger golden dice
    // = ~0.12% per second ~ rare event
    if (Math.random() < 0.002 && !gameState.goldenDiceActive) {
        activateGoldenDice();
    }
}

function activateGoldenDice() {
    if (gameState.goldenDiceActive) return;
    
    gameState.goldenDiceActive = true;
    elements.goldenDiceIndicator.classList.add("active");
    
    showToast("✨ Golden Dice Activated! 7x multiplier for 10 seconds!", "success", 2000);
    
    // Show visual animation
    showGoldenDiceAnimation();
    
    setTimeout(() => {
        gameState.goldenDiceActive = false;
        elements.goldenDiceIndicator.classList.remove("active");
    }, gameState.goldenDiceDuration);
}

function showGoldenDiceAnimation() {
    // Visual feedback for golden dice activation
    const originalColor = elements.clickerSymbol.style.filter;
    elements.clickerSymbol.style.filter = "drop-shadow(0 0 20px #f59e0b)";
    
    setTimeout(() => {
        elements.clickerSymbol.style.filter = originalColor || "none";
    }, gameState.goldenDiceDuration);
}

// ==================== MINIGAME ====================
function setupMinigame() {
    const modal = document.getElementById("minigameModal");
    const closeBtn = modal.querySelector(".close");
    const spinBtn = document.getElementById("spinButton");
    
    elements.minigameBtn.addEventListener("click", () => {
        modal.style.display = "block";
    });
    
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });
    
    spinBtn.addEventListener("click", spinMinigame);
    
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
}

function spinMinigame() {
    const wheel = document.getElementById("minigameWheel");
    const result = document.getElementById("minigameResult");
    const spinBtn = document.getElementById("spinButton");
    
    spinBtn.disabled = true;
    result.textContent = "";
    
    // Reset animation
    wheel.style.transform = "rotate(0deg)";
    
    setTimeout(() => {
        const spinDegrees = 360 * 5 + Math.random() * 360;
        wheel.style.transform = `rotate(` + spinDegrees + `deg)`;
        
        setTimeout(() => {
            const resultIndex = Math.floor((spinDegrees % 360) / 60);
            const multipliers = [2, 3, 1.5, 4, 5, 0]; // 0 = lose
            const mult = multipliers[resultIndex];
            
            if (mult === 0) {
                result.textContent = "❌ Lose! Better luck next time.";
                result.style.color = "#ef4444";
            } else {
                const gain = gameState.randomness * mult;
                gameState.randomness += gain;
                result.textContent = "✨ Win " + mult + "x multiplier! +" + formatNumber(gain) + " Randomness!";
                result.style.color = "#10b981";
                renderStats();
                saveGameState();
            }
            
            spinBtn.disabled = false;
        }, 3000);
    }, 100);
}

// ==================== ASCENSION ====================
function setupAscension() {
    elements.ascendButton.addEventListener("click", () => {
        // Cost grows exponentially: 1M, 10M, 100M, etc.
        const ascensionCost = Math.pow(10, 6 + gameState.ascensionLevel);
        const ascensionBonus = 5 + (gameState.ascensionLevel * 2); // 5% base, increases per level
        
        if (gameState.randomness < ascensionCost) {
            alert("Need " + formatNumber(ascensionCost) + " Randomness to ascend!\n\nYou get +" + ascensionBonus + "% RPS multiplier.");
            return;
        }
        
        const confirmMessage = "Ascend and gain +" + ascensionBonus + "% RPS multiplier?\n" +
            "Ascension Level: " + gameState.ascensionLevel + " → " + (gameState.ascensionLevel + 1) + "\n" +
            "You will lose all Randomness but keep upgrades and buildings.";
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        gameState.randomness = 0;
        gameState.ascensionLevel++;
        
        // Multiplicative bonus per level
        const bonusMultiplier = 1 + (ascensionBonus / 100);
        gameState.ascensionMultiplier *= bonusMultiplier;
        
        // Update display
        elements.ascensionLevel.textContent = gameState.ascensionLevel;
        renderStats();
        saveGameState();
        
        console.log("🌟 Ascended to level " + gameState.ascensionLevel + "! New multiplier: " + gameState.ascensionMultiplier.toFixed(2) + "x");
    });
}

// ==================== SYMBOL ROTATION ====================
function startSymbolRotation() {
    setInterval(() => {
        const tierIndex = Math.min(gameState.currentTier, Object.keys(SYMBOLS).length - 1);
        elements.clickerSymbol.textContent = SYMBOLS[tierIndex];
    }, 5000);
}

// ==================== RENDERING ====================
function renderStats() {
    elements.randomness.textContent = formatNumber(gameState.randomness);
    elements.rpc.textContent = formatNumber(gameState.rpc);
    elements.rps.textContent = formatNumber(gameState.rps);
    
    // Update tier progress
    updateTierProgress();
}

function updateTierProgress() {
    const currentTierElem = document.getElementById("currentTier");
    const nextTierTargetElem = document.getElementById("nextTierTarget");
    const progressFill = document.getElementById("progressFill");
    
    if (!currentTierElem || !nextTierTargetElem || !progressFill) return;
    
    currentTierElem.textContent = gameState.currentTier;
    
    const currentThreshold = TIER_THRESHOLDS[gameState.currentTier];
    const previousThreshold = gameState.currentTier > 0 ? TIER_THRESHOLDS[gameState.currentTier - 1] : 0;
    
    if (currentThreshold) {
        nextTierTargetElem.textContent = formatNumber(currentThreshold);
        
        const progress = Math.min(100, ((gameState.randomness - previousThreshold) / (currentThreshold - previousThreshold)) * 100);
        progressFill.style.width = progress + "%";
    } else {
        nextTierTargetElem.textContent = "MAX";
        progressFill.style.width = "100%";
    }
}

function renderUpgrades() {
    elements.upgradesList.innerHTML = "";
    
    const upgrades = Object.entries(gameState.upgrades)
        .sort(([_, a], [__, b]) => calculateUpgradeCost(a) - calculateUpgradeCost(b));
    
    upgrades.forEach(([id, upgrade]) => {
        const cost = calculateUpgradeCost(id);
        const canAfford = gameState.randomness >= cost;
        
        const item = document.createElement("div");
        item.className = "shop-item" + (canAfford ? "" : " unavailable");
        item.innerHTML = `
            <div class="shop-item-header">
                <span class="shop-item-name">` + upgrade.name + `</span>
                ` + (upgrade.owned > 0 ? `<span class="shop-item-count">` + upgrade.owned + `</span>` : "") + `
            </div>
            <p class="shop-item-description">` + upgrade.description + `</p>
            <p class="shop-item-cost">Cost: ` + formatNumber(cost) + ` Randomness</p>
        `;
        
        item.addEventListener("click", () => {
            if (canAfford) purchaseUpgrade(id);
        });
        
        elements.upgradesList.appendChild(item);
    });
}

function renderBuildings() {
    elements.buildingsList.innerHTML = "";
    
    const buildings = Object.entries(gameState.buildings)
        .sort(([_, a], [__, b]) => calculateBuildingCost(a) - calculateBuildingCost(b));
    
    buildings.forEach(([id, building]) => {
        const cost = calculateBuildingCost(id);
        const canAfford = gameState.randomness >= cost;
        
        const item = document.createElement("div");
        item.className = "shop-item" + (canAfford ? "" : " unavailable");
        item.innerHTML = `
            <div class="shop-item-header">
                <span class="shop-item-name">` + (building.icon ? building.icon + " " : "") + building.name + `</span>
                ` + (building.owned > 0 ? `<span class="shop-item-count">` + building.owned + `</span>` : "") + `
            </div>
            <p class="shop-item-description">` + building.description + `</p>
            <p class="shop-item-cost">Cost: ` + formatNumber(cost) + ` Randomness</p>
        `;
        
        item.addEventListener("click", () => {
            if (canAfford) purchaseBuilding(id);
        });
        
        elements.buildingsList.appendChild(item);
    });
}

// ==================== NOTIFICATIONS ====================
function showToast(message, type = "info", duration = 3000) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return Math.floor(num).toString();
}

// ==================== THEME TOGGLE ====================
function loadTheme() {
    const theme = localStorage.getItem("37day-theme") || "light";
    if (theme === "dark") {
        document.body.classList.add("dark-theme");
    }
}

function toggleTheme() {
    document.body.classList.toggle("dark-theme");
    const isDark = document.body.classList.contains("dark-theme");
    localStorage.setItem("37day-theme", isDark ? "dark" : "light");
}

// ==================== AUTO SAVE ====================
function startAutoSave() {
    setInterval(() => {
        saveGameState();
    }, 30000); // Save every 30 seconds
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    elements.clickerSymbol.addEventListener("click", handleClick);
    elements.themeToggle.addEventListener("click", toggleTheme);
    
    // Tab switching
    elements.tabBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            elements.tabBtns.forEach(b => b.classList.remove("active"));
            elements.shopTabs.forEach(t => t.classList.remove("active"));
            
            btn.classList.add("active");
            const tabId = btn.getAttribute("data-tab") + "-tab";
            document.getElementById(tabId).classList.add("active");
        });
    });
    
    // Minigame
    if (elements.minigameBtn) {
        setupMinigame();
        elements.minigameSection.style.display = "block";
    }
    
    // Ascension
    if (elements.ascendButton) {
        setupAscension();
        elements.ascensionSection.style.display = "block";
    }
}

// ==================== START GAME ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
