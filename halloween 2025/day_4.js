// day_4.js — single coherent trading dashboard file (clean)
// Time-lock checks followed by a small Chart.js-powered card UI.


const PT_TZ = 'America/Los_Angeles';
const nowPT = () => new Date(new Date().toLocaleString('en-US', { timeZone: PT_TZ }));

const BLOCKED_RANGES = [[8*60 + 15, 11*60], [12*60 + 50, 15*60 + 20]];
function isWeekday(d){ const day = d.getDay(); return day >= 1 && day <= 5; }
function inBlockedWindow(ptDate){
    if(!isWeekday(ptDate)) return false;
    const mins = ptDate.getHours()*60 + ptDate.getMinutes();
    return BLOCKED_RANGES.some(([a,b]) => mins >= a && mins < b);
}

function showTimeLockOverlay(message){
    if(document.getElementById('time-lock-overlay')) return;
    const o = document.createElement('div');
    o.id = 'time-lock-overlay';
    Object.assign(o.style, {
        position: 'fixed', inset: '0', zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.92)', color: '#ffdca8', textAlign: 'center',
        padding: '24px', fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif'
    });
    o.innerHTML = `<div style="max-width:820px">
        <h2 style="margin:0 0 8px">Game temporarily unavailable</h2>
        <p style="margin:0 0 12px">${message}</p>
        <div style="opacity:.85;font-size:.9rem">Blocked PT weekday hours: 08:15–11:00 and 12:50–15:20</div>
    </div>`;
    document.body.appendChild(o);
}

function hideTimeLockOverlay(){
    const el = document.getElementById('time-lock-overlay');
    if(el) el.remove();
}


const UNLOCK_ISO = '2025-10-30T00:00:00-07:00';
const unlockDate = new Date(UNLOCK_ISO);

const rn = nowPT();
if(rn < unlockDate){
    showTimeLockOverlay(`This game will unlock on ${unlockDate.toLocaleString('en-US', { timeZone: PT_TZ })} PT.`);
} else if(inBlockedWindow(rn)){
    showTimeLockOverlay('This game is temporarily blocked for scheduled hours. Please try again later.');
}

const __timeLockChecker = setInterval(() => {
    const n = nowPT();
    if(n < unlockDate){
        if(!document.getElementById('time-lock-overlay')){
            showTimeLockOverlay(`This game will unlock on ${unlockDate.toLocaleString('en-US', { timeZone: PT_TZ })} PT.`);
        }
        return;
    }
    if(inBlockedWindow(n)){
        if(!document.getElementById('time-lock-overlay')){
            showTimeLockOverlay('This game is temporarily blocked for scheduled hours. Please try again later.');
        }
        return;
    }
    // allowed — remove overlay and stop checking
    hideTimeLockOverlay();
    clearInterval(__timeLockChecker);
}, 10000);



// Trading dashboard - card based UI
(function(){
    // Improved stock model with trends, momentum and autosave to Firestore
    const STOCK_DEFS = [
        { id: 'choco', name: 'Chocolate', color: '#7b3f00', base: 85 },
        { id: 'gummy', name: 'Gummy', color: '#ff6bd6', base: 42 },
        { id: 'toffee', name: 'Toffee', color: '#ffb84d', base: 210 },
        { id: 'jelly', name: 'Jelly', color: '#b28cff', base: 37 },
        { id: 'mint', name: 'Mint', color: '#2b8f6b', base: 60 },
        { id: 'sour', name: 'Sour', color: '#ff6b35', base: 18 }
    ];

    const STOCKS = [];
    function initStocks(){
        STOCKS.length = 0;
        STOCK_DEFS.forEach(d => {
            // modest variance for starting price (keep things stable)
            const volatility = 0.15 + Math.random() * 0.35;
            const seed = d.base * (0.8 + Math.random() * volatility);
            const price = Math.max(0.5, parseFloat(seed.toFixed(2)));
            const momentum = (Math.random() - 0.5) * 0.02;
            // ensure every stock starts with a random trend/duration
            const trend = pickNewTrend();
            STOCKS.push({ id: d.id, name: d.name, color: d.color, price, history: [], trend, momentum });
        });
    }

    // starting cash lowered to $100 per request
    // start at day 0 so initial market randomization/simulation can run
    let state = { cash: 100, day: 0, portfolio: {}, history: {}, achievements: {}, highestCash: 100 };
    let settings = { autoAdvance: false, gameSpeed: 1 };
    let autoAdvanceInterval;
    let autosaveInterval;

    const EVENT_END_ISO = '2025-10-31T00:00:00-07:00';
    const EVENT_END_TS = new Date(EVENT_END_ISO).getTime();

    function createCharts(){
        const container = document.getElementById('charts-container');
        if(!container) return;
        container.innerHTML = '';

        STOCKS.forEach(s => {
            const card = document.createElement('div');
            card.className = 'chart-card';
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-name">${s.name}</div>
                    <div class="owned-badge" data-stock="${s.id}">Owned: 0</div>
                </div>
                <div class="card-canvas"><canvas id="chart-${s.id}"></canvas></div>
                <div class="card-controls">
                    <button class="btn-buy" data-buy="1" data-stock="${s.id}">Buy 1</button>
                    <button class="btn-buy" data-buy="10" data-stock="${s.id}">Buy 10</button>
                    <button class="btn-buy" data-buy-max="true" data-stock="${s.id}">Buy Max</button>
                    <button class="btn-sell" data-sell="1" data-stock="${s.id}">Sell 1</button>
                    <button class="btn-sell" data-sell="10" data-stock="${s.id}">Sell 10</button>
                    <button class="btn-sell" data-sell-all="true" data-stock="${s.id}">Sell All</button>
                </div>
            `;

            container.appendChild(card);
            const canvas = document.getElementById('chart-' + s.id);
            if(!canvas) return;
            // Ensure canvas will render crisply but not exceed browser limits
            const ctx = canvas.getContext('2d');
            const safeDPR = Math.min(window.devicePixelRatio || 1, 2);
            s._chart = new Chart(ctx, {
                type: 'line',
                data: { labels: [], datasets: [{ data: [], borderColor: s.color, backgroundColor: 'rgba(0,0,0,0)', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.2 }] },
                options: {
                    devicePixelRatio: safeDPR,
                    animation: false,
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { display: false }, y: { display: false } }
                }
            });
        });

        container.addEventListener('click', e => {
            const buy = e.target.closest('[data-buy]');
            const buyMax = e.target.closest('[data-buy-max]');
            const sell = e.target.closest('[data-sell]');
            const sellAll = e.target.closest('[data-sell-all]');

            if(buy){ buyStocks(buy.dataset.stock, parseInt(buy.dataset.buy, 10)); }
            if(buyMax){ buyMaxStocks(buyMax.dataset.stock); }
            if(sellAll){
                // explicit sell-all button now handled separately
                sellAllStocks(sellAll.dataset.stock);
            } else if(sell){
                sellStocks(sell.dataset.stock, parseInt(sell.dataset.sell, 10));
            }
        });
    }

    function buyStocks(id, qty){
        const stock = STOCKS.find(s => s.id === id);
        if(!stock) return;
        const cost = stock.price * qty;
        if(state.cash >= cost){
            state.cash -= cost;
            state.portfolio[id] = (state.portfolio[id] || 0) + qty;
            updateUI();
            // autosave after buying
            scheduleAutosave();
        } else showMessage('Not enough cash');
    }

    function buyMaxStocks(id){
        const stock = STOCKS.find(s => s.id === id);
        if(!stock) return;
        const maxQty = Math.floor(state.cash / stock.price);
        if(maxQty <= 0){ showMessage('Not enough cash'); return; }
        buyStocks(id, maxQty);
    }

    function sellStocks(id, qty){
        if((state.portfolio[id] || 0) >= qty){
            const stock = STOCKS.find(s => s.id === id);
            state.portfolio[id] -= qty;
            state.cash += stock.price * qty;
            updateUI();
            scheduleAutosave();
        } else showMessage('Not enough owned');
    }

    function sellAllStocks(id){
        const owned = state.portfolio[id] || 0;
        if(owned <= 0){ showMessage('No holdings to sell'); return; }
        const stock = STOCKS.find(s => s.id === id);
        if(!stock) { showMessage('Stock not found'); return; }
        // directly liquidate to avoid handler/dataset issues
        state.cash += owned * stock.price;
        state.portfolio[id] = 0;
        updateUI();
        scheduleAutosave();
    }

    function updateUI(){
        const cashEl = document.getElementById('player-cash');
        const dayEl = document.getElementById('current-day');
        const portfolioValueEl = document.getElementById('portfolio-value');
        const statTotalValueEl = document.getElementById('stat-total-value');
        const statDayEl = document.getElementById('stat-day');
        const statHoldingsEl = document.getElementById('stat-holdings');
        const statBestStockEl = document.getElementById('stat-best-stock');
        const statAchievementsEl = document.getElementById('stat-achievements');
        const statNetChangeEl = document.getElementById('stat-net-change');

        if(cashEl) cashEl.textContent = '$' + state.cash.toFixed(2);
        if(dayEl) dayEl.textContent = 'Day ' + state.day;

        let portfolioValue = 0;
        let totalHoldings = 0;
        let bestStock = null;
        let bestPerformance = -Infinity;

        STOCKS.forEach(s => {
            const owned = state.portfolio[s.id] || 0;
            portfolioValue += owned * s.price;
            totalHoldings += owned;

            // Find best performing stock (highest price)
            if(s.price > bestPerformance){
                bestPerformance = s.price;
                bestStock = s.name;
            }

            const el = document.querySelector('.owned-badge[data-stock="' + s.id + '"]');
            if(el) el.textContent = 'Owned: ' + owned;
            if(s._chart){
                s._chart.data.labels.push('');
                s._chart.data.datasets[0].data.push(s.price);
                if(s._chart.data.datasets[0].data.length > 50) s._chart.data.datasets[0].data.shift();
                if(s._chart.data.labels.length > 50) s._chart.data.labels.shift();
                s._chart.update();
            }
        });

        const totalValue = state.cash + portfolioValue;
        const achievementCount = Object.keys(state.achievements || {}).length;

        if(portfolioValueEl) portfolioValueEl.textContent = '$' + portfolioValue.toFixed(2);
        if(statTotalValueEl) statTotalValueEl.textContent = '$' + totalValue.toFixed(2);
        if(statDayEl) statDayEl.textContent = 'Day ' + state.day;
        if(statHoldingsEl) statHoldingsEl.textContent = totalHoldings;
        if(statBestStockEl) statBestStockEl.textContent = bestStock || '-';
        if(statAchievementsEl) statAchievementsEl.textContent = achievementCount;
        if(statNetChangeEl) statNetChangeEl.textContent = '$' + (totalValue - 100).toFixed(2);

        updatePortfolioTable();

        // Track highest cash and autosave if increased; also push to leaderboard
        if(state.cash > (state.highestCash || 0)){
            state.highestCash = state.cash;
            scheduleAutosave();
            // autosave highest score to leaderboard (player-scoped doc)
            try{ saveScore(true); }catch(e){ console.warn('saveScore autosave', e); }
        }
    }

    function updatePortfolioTable(){
        const tbody = document.querySelector('#portfolio-table tbody'); if(!tbody) return; tbody.innerHTML = ''; const keys = Object.keys(state.portfolio).filter(k => state.portfolio[k] > 0); if(keys.length === 0){ tbody.innerHTML = '<tr class="empty-portfolio"><td colspan="3">No holdings</td></tr>'; return; }
        keys.forEach(id => { const stock = STOCKS.find(s => s.id === id); const qty = state.portfolio[id]; const tr = document.createElement('tr'); tr.innerHTML = `<td style="text-align:left">${stock.name}</td><td>${qty}</td><td>$${(stock.price * qty).toFixed(2)}</td>`; tbody.appendChild(tr); });
    }

    function showMessage(msg){ const p = document.getElementById('message'); if(p){ p.textContent = msg; p.classList.remove('hidden'); setTimeout(()=>p.classList.add('hidden'),1500); } }

    function nextDay(){
        // Advance stocks according to trends & momentum
        advanceStocksForNextDay();
        state.day++;
        updateUI();
        checkAchievements();

        // End after 365 days and autosave highest cash
        if(state.day >= 365){
            // Save final snapshot and leaderboard
            saveFinalStateAndScore();
            showMessage('Game ended after 365 days');
        }
    }

    function resetGame(){
        // Save score before resetting
        saveScore();
        state = { cash: 100, day: 0, portfolio: {}, history: {}, achievements: {}, highestCash: 100 };
        createCharts();
        updateUI();
        if(autoAdvanceInterval) clearInterval(autoAdvanceInterval);
        autoAdvanceInterval = null;
    }

    function checkAchievements(){
        // Simple achievement checks
        const totalValue = state.cash + Object.keys(state.portfolio).reduce((sum, id) => sum + (state.portfolio[id] || 0) * STOCKS.find(s => s.id === id).price, 0);
        if(totalValue >= 2000 && !state.achievements?.rich){
            state.achievements = state.achievements || {};
            state.achievements.rich = true;
            showAchievement('Wealthy Trader', 'Accumulated $2000+ in total value!');
        }
        if(state.day >= 10 && !state.achievements?.veteran){
            state.achievements = state.achievements || {};
            state.achievements.veteran = true;
            showAchievement('Veteran Trader', 'Survived 10 trading days!');
        }
    }

    function showAchievement(name, description){
        const popup = document.getElementById('achievement-popup');
        const nameEl = document.getElementById('achievement-name');
        const descEl = document.getElementById('achievement-description');
        const closeBtn = document.getElementById('achievement-close');
        if(popup && nameEl && descEl){
            nameEl.textContent = name;
            descEl.textContent = description;
            popup.classList.remove('hidden');
            const hidePopup = () => popup.classList.add('hidden');
            if(closeBtn) closeBtn.onclick = hidePopup;
            setTimeout(hidePopup, 5000); // Extended to 5 seconds
        }
    }

    // Leaderboard functionality
    let leaderboardData = [];

    function showLeaderboard(){
        const modal = document.getElementById('leaderboard-modal');
        if(modal) modal.classList.remove('hidden');
        loadLeaderboard();
    }

    function hideLeaderboard(){
        const modal = document.getElementById('leaderboard-modal');
        if(modal) modal.classList.add('hidden');
    }

    // Add modal backdrop click to close
    document.addEventListener('click', e => {
        const modal = document.getElementById('leaderboard-modal');
        if(e.target === modal) hideLeaderboard();
    });

    function loadLeaderboard(){
        // Prefer Firebase leaderboard if available
        leaderboardData = [];
        const tbody = document.getElementById('leaderboard-body');
        if(!tbody) return;
        tbody.innerHTML = '<tr><td colspan="4">Loading…</td></tr>';
        if(window.firebaseDb && window.firebaseGetDocs && window.firebaseCollection && window.firebaseQuery && window.firebaseOrderBy){
            (async ()=>{
                try{
                    // order by users.score (per-user highest) descending
                    const q = window.firebaseQuery(window.firebaseCollection(window.firebaseDb,'users'), window.firebaseOrderBy('score','desc'));
                    const snap = await window.firebaseGetDocs(q);
                    const rows = [];
                    snap.forEach(d => rows.push(d.data()));
                    renderLeaderboardRows(rows);
                }catch(e){
                    console.warn('leaderboard fetch', e);
                    renderLeaderboard();
                }
            })();
        } else {
            // If Firebase isn't configured, show a hint to sign in / enable leaderboard
            tbody.innerHTML = '<tr><td colspan="4">Leaderboard requires sign-in / Firebase.</td></tr>';
        }
    }

    async function saveScore(){
        const totalValue = state.cash + Object.keys(state.portfolio).reduce((sum, id) => sum + (state.portfolio[id] || 0) * (STOCKS.find(s => s.id === id)?.price || 0), 0);
        // Only save leaderboard entries for signed-in users and write highest score
        // into the central `users` collection (capped at 50000, rounded to nearest int)
        // Require firebase and a signed-in user
        if(!(window.firebaseDb && window.firebaseSetDoc && window.firebaseDoc && window.firebaseAuth && window.firebaseAuth.currentUser && window.firebaseGetDoc)){
            return;
        }
        // Only save if within event window (before EVENT_END_TS)
        if(Date.now() >= EVENT_END_TS) return;

        try{
            const user = window.firebaseAuth.currentUser;
            const uid = user.uid;
            const username = user.displayName || (user.email ? user.email.split('@')[0] : 'Player');

            // Read existing user doc to get current scores object
            const userDocRef = window.firebaseDoc(window.firebaseDb, 'users', uid);
            let existingScores = {};
            try{
                const snap = await window.firebaseGetDoc(userDocRef);
                if(snap && typeof snap.exists === 'function' && snap.exists()){
                    const data = snap.data();
                    existingScores = (data && data.scores) ? data.scores : {};
                }
            }catch(e){ /* ignore missing doc */ }

            // compute today's day4 value (rounded, capped at 50000)
            const day4Val = Math.min(50000, Math.round(totalValue || 0));

            // compute new total as sum of day1..day5 where day4 is replaced by day4Val
            const days = ['day1','day2','day3','day4','day5'];
            let newTotal = 0;
            days.forEach(d => {
                if(d === 'day4') newTotal += day4Val;
                else newTotal += Math.round(existingScores[d] || 0);
            });

            const payload = { scores: { day4: day4Val, total: newTotal }, lastUpdated: Date.now() };
            // Merge so we don't touch createdAt, email, username, or other fields
            await window.firebaseSetDoc(userDocRef, payload, { merge: true });
        }catch(e){ console.warn('save score', e); }
    }

    function renderLeaderboardRows(rows){
        const tbody = document.getElementById('leaderboard-body'); if(!tbody) return;
        tbody.innerHTML = '';
        rows.slice(0,50).forEach((r, idx)=>{
            const name = r.username || r.player || 'Player';
            const score = (typeof r.highestScore === 'number') ? r.highestScore : (r.score || 0);
            const when = r.ts ? new Date(r.ts).toLocaleString() : (r.date || '');
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${idx+1}</td><td>${name}</td><td>$${(score.toFixed ? score.toFixed(2) : score)}</td><td>${when}</td>`;
            tbody.appendChild(tr);
        });
    }

    function renderLeaderboard(){
        const tbody = document.getElementById('leaderboard-body');
        if(!tbody) return;
        tbody.innerHTML = '';
        leaderboardData.forEach((entry, index) => {
            const name = entry.username || entry.player || 'Player';
            const score = (typeof entry.highestScore === 'number') ? entry.highestScore : (entry.score || 0);
            const when = entry.ts ? new Date(entry.ts).toLocaleString() : (entry.date || '');
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${index + 1}</td><td>${name}</td><td>$${(score.toFixed ? score.toFixed(2) : score)}</td><td>${when}</td>`;
            tbody.appendChild(tr);
        });
    }

    // Save score when game ends or on certain events
    function endGame(){
        saveScore();
        // Also save final state snapshot
        scheduleAutosave(true);
    }

    // ---------- Firestore autosave/load for game state ----------
    function getPlayerDocId(){
        const fbUser = (window.firebaseAuth && window.firebaseAuth.currentUser) ? window.firebaseAuth.currentUser : null;
        if(fbUser && fbUser.uid) return fbUser.uid;
        let id = localStorage.getItem('candyTraderAnonId');
        if(!id){ id = 'anon_' + Date.now() + '_' + Math.random().toString(36).slice(2,8); localStorage.setItem('candyTraderAnonId', id); }
        return id;
    }

    async function autosaveState(){
        const id = getPlayerDocId();
        const payload = { cash: state.cash, day: state.day, portfolio: state.portfolio, stocks: STOCKS.map(s=>({id:s.id,price:s.price,momentum:s.momentum,trend:s.trend})), highestCash: state.highestCash, ts: Date.now() };
        if(window.firebaseDb && window.firebaseSetDoc && window.firebaseDoc){
            try{
                // ensure user signed in before saving to Firestore
                if(window.firebaseAuth && !window.firebaseAuth.currentUser){
                    try{ await window.firebaseSignInWithPopup(window.firebaseAuth, window.googleProvider); }catch(e){ console.warn('signin cancelled', e); }
                }
                await window.firebaseSetDoc(window.firebaseDoc(window.firebaseDb, 'day4_states', id), payload);
                showMessage('Game saved');
                return { ok:true };
            }catch(e){ console.warn('autosave', e); return { ok:false, reason: e.message }; }
        } else {
            localStorage.setItem('day4_state', JSON.stringify(payload));
            return { ok:true, fallback:true };
        }
    }

    let _autosaveTimer = null;
    function scheduleAutosave(force=false){
        if(force){ autosaveState(); return; }
        if(_autosaveTimer) clearTimeout(_autosaveTimer);
        _autosaveTimer = setTimeout(()=> { autosaveState(); _autosaveTimer = null; }, 1200);
    }

    async function loadState(){
        const id = getPlayerDocId();
        let restored = false;
        // try firebase first (must use stable player id from getPlayerDocId)
        if(window.firebaseDb && window.firebaseGetDoc && window.firebaseDoc){
            try{
                const snap = await window.firebaseGetDoc(window.firebaseDoc(window.firebaseDb, 'day4_states', id));
                if(snap && typeof snap.exists === 'function' && snap.exists()){
                    const data = snap.data();
                    restoreStateFromPayload(data);
                    restored = true;
                }
            }catch(e){ console.warn('loadState (firebase)', e); }
        }
        // fallback localStorage if remote not available or not found
        if(!restored){
            try{
                const stored = localStorage.getItem('day4_state');
                if(stored){ const data = JSON.parse(stored); restoreStateFromPayload(data); restored = true; }
            }catch(e){ console.warn('loadState (local)', e); }
        }
        return restored;
    }

    function restoreStateFromPayload(data){
        if(!data) return;
        state.cash = data.cash ?? state.cash;
        state.day = data.day ?? state.day;
        state.portfolio = data.portfolio ?? state.portfolio;
        state.highestCash = data.highestCash ?? state.highestCash;
        if(Array.isArray(data.stocks)){
            data.stocks.forEach(sd =>{
                const s = STOCKS.find(x=>x.id===sd.id);
                if(s){ s.price = sd.price ?? s.price; s.momentum = sd.momentum ?? s.momentum; s.trend = sd.trend ?? s.trend; }
            });
        }
    }

    // ---------- stock trend engine ----------
    function pickNewTrend(s){
        const r = Math.random();
        // produce mostly modest trends with varied durations
        if(r < 0.12) return { dir: 1, dur: 2 + Math.floor(Math.random()*6), magnitude: 0.008 + Math.random()*0.03 };
        if(r < 0.24) return { dir: -1, dur: 2 + Math.floor(Math.random()*6), magnitude: 0.008 + Math.random()*0.03 };
        if(r < 0.70) return { dir: 0, dur: 1 + Math.floor(Math.random()*8), magnitude: 0.002 + Math.random()*0.012 };
        // occasional longer trend but still moderate
        return { dir: (Math.random()<0.6?1:-1), dur: 4 + Math.floor(Math.random()*20), magnitude: 0.01 + Math.random()*0.04 };
    }

    function advanceStocksForNextDay(){
        // reduce the cap to make markets noticeably more stable
        const MAX_DAILY_PCT = 0.06; // was 0.18
        STOCKS.forEach(s => {
            if(!s.trend || s.trend.dur <= 0) s.trend = pickNewTrend(s);
            // reduce shock frequency and magnitude
            if(Math.random() < 0.03){
                const shock = (Math.random() < 0.5 ? -1 : 1) * (0.02 + Math.random() * 0.04);
                s.momentum = (s.momentum || 0) * 0.3 + shock * (0.25 + Math.random()*0.2);
            }
            // occasional trend flip, but keep it mild
            if(Math.random() < 0.06){
                s.trend.dir = (s.trend.dir || 0) * -1 || (Math.random()<0.5?1:-1);
                s.trend.magnitude = (s.trend.magnitude || 0.01) * (1 + Math.random()*0.4);
            }
            const volatility = 0.006 + Math.random()*0.02;
            const trendEffect = (s.trend.dir || 0) * (s.trend.magnitude || 0);
            const randomEffect = (Math.random() - 0.5) * volatility * 2;
            let changePct = trendEffect + randomEffect + (s.momentum || 0) * (0.4 + Math.random()*0.2);
            // cap daily change
            changePct = Math.max(-MAX_DAILY_PCT, Math.min(MAX_DAILY_PCT, changePct));
            // update momentum (decay + influence)
            s.momentum = (s.momentum || 0) * (0.6 + Math.random()*0.2) + changePct * (0.12 + Math.random()*0.15);
            s.price = Math.max(0.2, +(s.price * (1 + changePct)).toFixed(2));
            s.history.push({ day: state.day, price: s.price });
            s.trend.dur = Math.max(0, (s.trend.dur || 0) - 1);
            // prune history length
            if(s.history.length > 500) s.history.shift();
        });
    }

    function setupEventListeners(){
        const next = document.getElementById('next-day-btn');
        const reset = document.getElementById('reset-game-btn');
        const back = document.getElementById('back-btn');
        const leaderboard = document.getElementById('leaderboard-btn');
        const closeLeaderboard = document.getElementById('close-leaderboard');
        const autoAdvance = document.getElementById('auto-advance');
        const gameSpeed = document.getElementById('game-speed');
        const wipe = document.getElementById('wipe-save-btn');
        const saveBtn = document.getElementById('save-game-btn');

        if(next) next.addEventListener('click', nextDay);
        if(reset) reset.addEventListener('click', resetGame);
    if(saveBtn) saveBtn.addEventListener('click', ()=>{ scheduleAutosave(true); saveScore(); showMessage('Saved'); });
        if(wipe) wipe.addEventListener('click', wipeSavedState);
        if(back) back.addEventListener('click', () => window.history.back());
        if(leaderboard) leaderboard.addEventListener('click', showLeaderboard);
        if(closeLeaderboard) closeLeaderboard.addEventListener('click', hideLeaderboard);
        if(autoAdvance) autoAdvance.addEventListener('change', handleAutoAdvanceToggle);
        if(gameSpeed) gameSpeed.addEventListener('input', handleGameSpeedChange);
    }

    function handleAutoAdvanceToggle(){
        settings.autoAdvance = this.checked;
        const baseMs = 2000; // base interval to divide by speed
        if(settings.autoAdvance){
            const iv = Math.max(100, Math.floor(baseMs / settings.gameSpeed));
            autoAdvanceInterval = setInterval(nextDay, iv);
        } else {
            if(autoAdvanceInterval) clearInterval(autoAdvanceInterval);
            autoAdvanceInterval = null;
        }
    }

    function handleGameSpeedChange(){
        settings.gameSpeed = parseFloat(this.value);
        // update UI display if exists
        const disp = document.getElementById('game-speed-display'); if(disp) disp.textContent = settings.gameSpeed.toFixed(1) + 'x';
        if(settings.autoAdvance && autoAdvanceInterval){
            clearInterval(autoAdvanceInterval);
            const baseMs = 2000;
            const iv = Math.max(100, Math.floor(baseMs / settings.gameSpeed));
            autoAdvanceInterval = setInterval(nextDay, iv);
        }
    }

    // Wipe saved state (Firestore doc + local storage)
    async function wipeSavedState(){
        const id = getPlayerDocId();
        // delete remote doc if possible
        if(window.firebaseDb && window.firebaseDoc && window.firebaseSetDoc){
            try{
                // overwrite with empty or delete if delete API not available: set an empty state
                await window.firebaseSetDoc(window.firebaseDoc(window.firebaseDb, 'day4_states', id), { wiped: true, ts: Date.now() });
            }catch(e){ console.warn('wipe remote', e); }
        }
        // remove local keys
        localStorage.removeItem('day4_state');
        localStorage.removeItem('candyTraderLeaderboard');
        localStorage.removeItem('candyTraderAnonId');
    // reset client state and UI (start at day 0)
    state = { cash: 100, day: 0, portfolio: {}, history: {}, achievements: {}, highestCash: 100 };
        initStocks(); createCharts(); updateUI();
        showMessage('Saved state wiped and game restarted');
    }
    function updateTimers(){
        const el = document.getElementById('game-timer');
        if(!el) return;
        const left = EVENT_END_TS - Date.now();
        if(left <= 0) return el.textContent = 'Event ended';
        const s = Math.floor(left/1000);
        const hh = String(Math.floor(s/3600)).padStart(2,'0');
        const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
        const ss = String(s%60).padStart(2,'0');
        el.textContent = `${hh}:${mm}:${ss}`;
    }

    async function saveFinalStateAndScore(){
        // save final snapshot
        await autosaveState();
        // save a final leaderboard entry
        saveScore();
    }

    // Start up
    window.addEventListener('load', async () => {
        // Initialize stocks and load any saved state, but always re-randomize
        // the market by stepping 31 simulated days so each fresh start has
        // randomized trends/history.
        initStocks();
        await loadState();
        // Re-init stocks to ensure random trends regardless of restored state
        initStocks();
        // simulate 31 days to randomize the market, but show Day 0 to player.
        // We'll increment state.day during simulation so history reflects real days,
        // then reset the visible counter to 0.
        state.day = 1;
        for(let i=0;i<31;i++){
            advanceStocksForNextDay();
            state.day++;
        }
        // after simulation, set displayed day back to 0
        state.day = 0;
        // persist the randomized start so reloads will restore it
        scheduleAutosave(true);
        createCharts();
        updateUI();
        setupEventListeners();
        // timers
        updateTimers();
        setInterval(updateTimers, 1000);
        // autosave periodic
        if(autosaveInterval) clearInterval(autosaveInterval);
        autosaveInterval = setInterval(()=> scheduleAutosave(), 10_000);
        // show current game speed
        const disp = document.getElementById('game-speed-display'); if(disp) disp.textContent = (settings.gameSpeed||1).toFixed(1) + 'x';
        // if auto-advance checkbox is already checked (from UI) start it
        const autoCheckbox = document.getElementById('auto-advance');
        if(autoCheckbox && autoCheckbox.checked){ settings.autoAdvance = true; handleAutoAdvanceToggle.call(autoCheckbox); }
    });
})();
