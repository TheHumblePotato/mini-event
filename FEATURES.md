# 37 Day - Clicker Game Features

## ✅ Core Game Features

### 1. **Title & Theme**
- ✅ Website celebrating "37 Day" (3/7) with prominent title
- ✅ Light/Dark theme toggle in header (not AI-generated, clean aesthetic)
- ✅ Mathematical symbol background (π, ∫, Σ, ∞, √, etc.)

### 2. **Main Clicker Mechanic**
- ✅ Clickable symbol (dice 🎲) in center of screen
- ✅ Currency system called "Randomness"
- ✅ Real-time feedback showing gains per click
- ✅ Symbol changes based on progression tier (🎲→🧠→♠→∞→Σ→∫→√→π)

### 3. **Game Statistics Display**
- ✅ Randomness (current total)
- ✅ RPC (Randomness Per Click) - live calculation
- ✅ RPS (Randomness Per Second) - live calculation
- ✅ Tier progression bar showing progress to next tier
- ✅ Current tier level display

### 4. **Shop System - Two Tabs**
- ✅ **Upgrades Tab**
  - Direct additive RPC bonuses
  - Multiplicative RPC bonuses
  - RPS-based upgrades
  - Dynamic inventory tracking (count badges)
  
- ✅ **Generators Tab** (renamed from "buildings")
  - Passive RPS generation
  - Purchased with Randomness currency
  - Cost scales exponentially (1.15x per unit)
  - Visual indicators for affordability
  - Count badges for owned units

### 5. **Default Content (Tier 0)**

**Upgrades:**
- Double Click: +1 RPC (cost: 10)
- Triple Click: +2 RPC (cost: 100)
- Quadruple Click: +4 RPC (cost: 500)
- Click Power I: ×1.15 RPC multiplier (cost: 50)

**Generators:**
- Neural Pathway: +0.1 RPS (cost: 10)
- Probability Field: +1 RPS (cost: 100)
- Chaos Engine: +8 RPS (cost: 1200)

### 6. **Tier System with AI Content Generation**

**Tier Thresholds:**
- Tier 0: Start
- Tier 1: 1,000 Randomness
- Tier 2: 10,000 Randomness
- Tier 3: 100,000 Randomness
- Tier 4: 1,000,000 Randomness
- Tier 5: 10,000,000 Randomness

**AI Integration:**
- ✅ Calls Gemini API when reaching new tier
- ✅ Generates 3 upgrades + 2 buildings per tier
- ✅ AI receives full game context:
  - Current player stats (RPC, RPS, randomness)
  - Existing upgrades/buildings
  - Game progression info
- ✅ AI generates randomness-themed content
- ✅ Validates AI response and parses JSON
- ✅ Seamlessly adds new content to shop
- ✅ Tier notifications via toast system

### 7. **Golden Dice (Special Event)**
- ✅ Random trigger during gameplay (~0.2% per 100ms tick)
- ✅ 7x multiplier on all gains (RPC and RPS)
- ✅ Lasts 10 seconds per activation
- ✅ Visual indicator with animated glow effect
- ✅ Toast notification when activated
- ✅ Cannot stack (prevents abuse)

### 8. **Mini-Game: Lucky Spin**
- ✅ Accessible from right sidebar
- ✅ Spinning wheel with 6 segments
- ✅ Multipliers: 2x, 3x, 1.5x, 4x, 5x, or Lose
- ✅ Payout based on current Randomness amount
- ✅ Win/Lose animations
- ✅ Modal popup interface
- ✅ Expected value: ~2.25x (slightly positive, balances luck factor)

### 9. **Ascension System**
- ✅ Available in right sidebar
- ✅ Cost formula: 10^(6 + level) - exponentially expensive
- ✅ Progressive bonus: 5% + (level × 2%) multiplicative RPS boost
- ✅ Resets Randomness to 0 but keeps all upgrades/buildings
- ✅ Permanent multiplier stacks between ascensions
- ✅ Strategic decision point for long-term progression
- ✅ Confirmation dialog with bonus info

### 10. **Data Persistence**
- ✅ Firebase Realtime Database integration
- ✅ Auto-saves game state every 30 seconds
- ✅ Manual save on purchase/ascension
- ✅ Unique user ID generation (localStorage based)
- ✅ Complete game state preserved:
  - Randomness amount
  - RPC and RPS values
  - All upgrades (owned count)
  - All buildings (owned count)
  - Ascension level and multiplier
  - Tier progression

### 11. **Game Balance & Polish**

**Cost Progression:**
- Upgrades: baseCost × 1.15^owned
- Buildings: baseCost × 1.15^owned
- Smoothly scales difficulty curve

**Pacing:**
- Early game: Minutes to reach first tier
- Mid game: Hours for tier 2-3
- Late game: AI-generated content = infinite progression
- Ascension unlocks new playstyle at ~1M+ Randomness

**Visual Polish:**
- ✅ Smooth animations and transitions
- ✅ Toast notification system for events
- ✅ Tier progress bar with visual feedback
- ✅ Color-coded UI elements (primary, accent, success, warning, danger)
- ✅ Responsive design (works on mobile/tablet/desktop)
- ✅ Scrollable shop with custom scrollbar styling
- ✅ Theme toggle with smooth dark mode

### 12. **AI Content Generation**

**What AI Receives:**
- Current game state snapshot
- All existing upgrades/buildings
- Player's current RPC/RPS values
- Total units of each type owned
- Tier being generated for

**What AI Generates:**
- 3 Upgrades per tier with:
  - Name (randomness-themed)
  - Description (max 50 chars)
  - Base cost (exponentially higher per tier)
  - Effect types (cpc, rps, multiplicative, boosters)
  
- 2 Buildings per tier with:
  - Name (randomness-themed)
  - Description (max 50 chars)
  - Base cost (exponentially higher per tier)
  - CPS value (passive generation)
  - Emoji icon

**Format Validation:**
- JSON parsing with error handling
- Validates all required fields
- Sanitizes costs/values (prevents negative/zero values)
- Graceful fallback for malformed responses

### 13. **Game Features Not Yet Implemented** (but structured for future)
- Prestige/Ascension milestones
- Achievement system
- Leaderboard (Firebase-ready)
- Special seasonal building behavior
- Combo/streak system
- Building synergies (e.g., "Chaos Engine boost for every 5 Neural Pathways")

## 🎮 How to Play

1. **Start Clicking**: Click the dice to gain Randomness
2. **Buy Upgrades**: Increase your click power
3. **Build Generators**: Unlock passive income
4. **Reach Milestones**: Hit tier thresholds to unlock new content via AI
5. **Golden Dice**: Get lucky for 7x bonus rounds
6. **Try Minigame**: Spin the wheel for big multipliers
7. **Ascend**: Reset with a permanent multiplier boost for long-term growth

## 🔧 Technical Details

**Architecture:**
- Vanilla JavaScript (no frameworks)
- CSS Grid & Flexbox for responsive layout
- Firebase Realtime Database for persistence
- Google Gemini API for dynamic content
- LocalStorage for theme & user ID

**Performance:**
- Passive income ticks every 100ms
- Auto-save every 30 seconds
- Optimized re-renders on stat changes
- No memory leaks or circular dependencies

**Browser Compatibility:**
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Opera
- Mobile browsers

## 📊 Balance Notes

**RPC Growth:**
- Base: 1 RPC
- Tier 0: Can reach ~10-20 RPC
- Tier 1: Can reach ~50-100 RPC
- Tier 2+: AI-balanced to scale appropriately

**RPS Growth:**
- Base: 0 RPS (passive)
- First generator: +0.1 RPS
- Scales to hundreds/thousands with multiple generators
- Ascension provides 5%+ per level multiplicative boost

**Golden Dice:**
- ~1 trigger per 500-1000 clicks (probabilistic)
- 10 second duration
- 7x multiplier makes it valuable but not game-breaking

**Minigame:**
- 16.7% lose chance (1 in 6)
- 83.3% win chance with varying multipliers
- Expected value: ~2.25x (positive but with variance)
- Scales with current Randomness (high risk, high reward)

---

**Last Updated:** March 4, 2026
**Version:** 1.0 Production Ready
