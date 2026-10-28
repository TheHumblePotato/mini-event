// Changes: landscape aspect, fullscreen aspect-preserve + restore, more abilities/enemies/bosses,
// knockback, nerfs, visual-only abilities removed, end-game button, heal-drop nerf, fixed duplicates.

(() => {
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

  const UNLOCK_ISO = '2025-10-31T00:00:00-07:00';
  const unlockDate = new Date(UNLOCK_ISO);

  const rn = nowPT();
  if(inBlockedWindow(rn)){
    showTimeLockOverlay('This game is temporarily blocked for scheduled hours. Please try again later.');
    return;
  }

  if(rn < unlockDate){
    showTimeLockOverlay(`This game will unlock on ${unlockDate.toLocaleString('en-US', { timeZone: PT_TZ })} PT.`);
    return;
  }

  const __timeLockChecker = setInterval(() => {
    const n = nowPT();
    if(n < unlockDate){
      if(!document.getElementById('time-lock-overlay')){
        showTimeLockOverlay(`This game will unlock on ${unlockDate.toLocaleString('en-US', { timeZone: PT_TZ })} PT.`);
      }
      return;
    }
    if(!inBlockedWindow(n)){
      hideTimeLockOverlay();

      clearInterval(__timeLockChecker);
    } else {

      if(!document.getElementById('time-lock-overlay')){
        showTimeLockOverlay('This game is temporarily blocked for scheduled hours. Please try again later.');
      }
    }
  }, 30_000);

  // DOM
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const playbound = document.getElementById('playbound');
  const bigScoreEl = document.getElementById('big-score');
  const gameTimerHeader = document.getElementById('game-timer');
  const dayLeaderboardBtn = document.getElementById('day-leaderboard-btn');
  const dayLeaderboardModal = document.getElementById('day-leaderboard-modal');
  const dayLeaderboardClose = document.getElementById('day-leaderboard-close');
  const dayLeaderboardBody = document.getElementById('day-leaderboard-body');
  const gameOverModal = document.getElementById('game-over-modal');
  const finalScoreEl = document.getElementById('final-score');
  const submitScoreBtn = document.getElementById('submit-score-btn');
  const retryBtn = document.getElementById('retry-btn');
  const playOverlay = document.getElementById('play-overlay');
  const playBtn = document.getElementById('play-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const backgroundRoot = document.getElementById('background');
  const hud = document.getElementById('hud');
  const hpText = document.getElementById('hp-text');
  const xpFill = document.getElementById('xp-fill');
  const lvlText = document.getElementById('lvl');
  const abilityPills = document.getElementById('ability-pills');
  const choiceArea = document.getElementById('choice-area');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayDesc = document.getElementById('overlay-desc');

  // Timer — Nov 1 00:00 PT
  const now = new Date();
  const year = now.getFullYear();
  const GAME_END_TS = Date.parse(`${year}-11-01T00:00:00-07:00`);
  function formatTimeRemaining(ms){
    if(ms<=0) return 'Event Ended';
    const s=Math.floor(ms/1000);
    const hh=Math.floor(s/3600).toString().padStart(2,'0');
    const mm=Math.floor((s%3600)/60).toString().padStart(2,'0');
    const ss=(s%60).toString().padStart(2,'0');
    return `${hh}:${mm}:${ss}`;
  }
  function updateTimers(){ if(gameTimerHeader) gameTimerHeader.textContent = formatTimeRemaining(GAME_END_TS - Date.now()); }
  updateTimers(); setInterval(updateTimers,1000);

  // logical canvas resolution — landscape default
  const VIEW_W = 900, VIEW_H = 540; // landscape
  canvas.width = VIEW_W; canvas.height = VIEW_H;

  // map size large multiple of view
  const MAP_W = VIEW_W * 10; // expanded map per request
  const MAP_H = VIEW_H * 8;

  // state
  let running = false;
  let lastTime = performance.now();
  let keys = {};
  let player = null;
  let camera = { x:0,y:0,w:VIEW_W,h:VIEW_H };
  let enemies = [];
  let projectiles = [];
  let orbs = [];
  let spawnTimer = 0;
  let spawnInterval = 3800;
  let score = 0;
  let slowMotionUntil = 0;
  let deathSlowActive = false;
  let abilityDefs = {};

  // visual effect arrays
  let blades = [];
  let beams = [];
  let anvils = [];
  let particles = [];
  let poisonTrails = []; // visual trail segments
  const ENEMY_PROJECTILE_CAP = 12; // cap simultaneous enemy projectiles

  // --- ability definitions (all abilities have visible effects) ---
  const ABILITIES = [
    // melee reduced, visible blades
    { id:'blade_spin', title:'Blade Spin', desc:'Rotating blades around you (auto).', type:'auto', basePower:10, cooldown:900, range:72, upgradePow:(lv)=>10 + lv*3 },
  // dash: small damage and visible streak, knockback (space-bound)
  { id:'dash_strike', title:'Dash Strike', desc:'Dash and damage enemies in path.', type:'dash', basePower:18, cooldown:2600, range:160, upgradePow:(lv)=>18+lv*6, bind:'space' },
  // projectile: fireball with explosion visual — auto-fires in last movement direction
  { id:'fireball', title:'Fireball', desc:'Fire a projectile that explodes on impact.', type:'projectile', basePower:20, cooldown:900, range:480, upgradePow:(lv)=>20+lv*6, auto:true },
  // multi_arrow spread (auto in movement direction)
  { id:'multi_arrow', title:'Multi Arrow', desc:'Spread arrows in movement direction.', type:'projectile', basePower:12, cooldown:1100, range:520, upgradePow:(lv)=>12+lv*4, auto:true },
    // siphon passive: deals damage on hit and heals small — visible as particle
    { id:'siphon', title:'Siphon', desc:'On-hit heal.', type:'passive', basePower:5, cooldown:0, range:40, upgradePow:(lv)=>5+lv*2 },
  // passive aura: slightly slows nearby enemies while active
  { id:'frost_aura', title:'Frost Aura', desc:'Passive aura that chills nearby enemies, slowing movement.', type:'passive', basePower:0, cooldown:0, range:120, upgradePow:(lv)=>0 },
  // small click AoE that briefly stuns/slows enemies
  { id:'shock_burst', title:'Shock Burst', desc:'Click to emit a short-range shock that slows and damages enemies.', type:'aoe', basePower:16, cooldown:2000, range:120, upgradePow:(lv)=>16+lv*6, bind:'click' },
    // turret (friendly) — visual bullets (click to deploy)
  { id:'turret', title:'Turret', desc:'Place a turret that shoots at on-screen enemies.', type:'deploy', basePower:10, cooldown:5000, range:0, upgradePow:(lv)=>10+lv*4, bind:'click' },
    // homing mine — visible seeker (click to deploy)
    { id:'homing_mine', title:'Homing Mine', desc:'Spawn a homing mine that seeks enemies.', type:'deploy', basePower:14, cooldown:4000, range:0, upgradePow:(lv)=>14+lv*6, bind:'click' },
  // cone: visible cone shock that auto-fires in movement direction
  { id:'shockwave', title:'Shockwave', desc:'Cone shock forward.', type:'cone', basePower:18, cooldown:2500, range:220, upgradePow:(lv)=>18+lv*5, auto:true },
  // (removed poison_trail and frost_aura — deprecated)
    // shield visible
  { id:'shield', title:'Shield', desc:'Temporary damage reduction.', type:'active', basePower:0.3, cooldown:7000, range:0, upgradePow:(lv)=>0.3+lv*0.06, bind:'space' },

  // auto special (only hit on-screen)
    { id:'auto_laser', title:'Auto Laser', desc:'Auto-aim laser at nearest on-screen enemy).', type:'auto', basePower:18, cooldown:1400, range:700, upgradePow:(lv)=>18+lv*6 },
    { id:'anvil_drop', title:'Anvil Drop', desc:'Drop an anvil on a enemy.', type:'auto', basePower:36, cooldown:7000, range:700, upgradePow:(lv)=>36+lv*12 },

  // extra projectile/area abilities (visible)
  // poison_bomb removed per request
  // cannon: heavy click-targeted projectile with AoE
  { id:'cannon', title:'Cannon', desc:'Click to fire a heavy cannonball that explodes on impact.', type:'projectile', basePower:36, cooldown:4000, range:720, upgradePow:(lv)=>36+lv*12, bind:'click' },
  // new click abilities: ice shard (slows)
  { id:'ice_shard', title:'Ice Shard', desc:'Throw an icy shard that strongly slows enemies on hit (click).', type:'projectile', basePower:14, cooldown:2200, range:520, upgradePow:(lv)=>14+lv*4, bind:'click' },
  // stun grenade: short telegraph then stun on impact
  // stun_grenade removed per request
  // ricochet shot: bounces between nearby enemies (click)
  { id:'ricochet', title:'Ricochet Shot', desc:'Fires a projectile that ricochets to another nearby enemy.', type:'projectile', basePower:14, cooldown:2000, range:640, upgradePow:(lv)=>14+lv*5, bind:'click' },
  // defensive abilities
  // reflect_shield / guardian_spirit removed per request
  { id:'phase_shift', title:'Phase Shift', desc:'Brief invulnerability (short cooldown).', type:'active', basePower:0, cooldown:15000, range:0, upgradePow:(lv)=>0, bind:'space' },
  // orbital removed (duplicate / deprecated)
  { id:'chain_lightning', title:'Chain Lightning', desc:'Strikes an enemy and chains to nearby enemies (auto).', type:'auto', auto:true, basePower:16, cooldown:3200, range:540, upgradePow:(lv)=>16+lv*5 },
    { id:'meteor', title:'Meteor', desc:'Calls down a meteor that deals huge explosion (long cooldown).', type:'projectile', basePower:60, cooldown:14000, range:900, upgradePow:(lv)=>60+lv*24, bind:'click' },
  // small extras
  ];
  ABILITIES.forEach(a=> abilityDefs[a.id]=a);


  // --- Enemy, Turret, Projectile, Orb, HomingMine, Boss, Necromancer ---
  class Enemy {
    constructor(x,y,hp=40,speed=40,r=14,type='zombie',melee=true,xpValue=10){
      this.x=x; this.y=y; this.hp=hp; this.maxHp=hp; this.speed=speed; this.r=r; this.type=type; this.melee=melee;
      this.alive=true; this.slowUntil=0; this.slowFactor=1; this.tickAcc=0; this.friendly=false; this.xpValue = xpValue;
      this.vx = 0; this.vy = 0; // for knockback
      this.stunUntil = 0; // timestamp while stunned (skip AI)
      // attack-slow: reduces how fast attack countdowns decrement (<=1 slows attacks)
      this.attackSlowUntil = 0; this.attackSlowFactor = 1;
      // temporary buff multiplier (for commanders)
      this.buffUntil = 0; this.buffMultiplier = 1;
    }
    applyAttackSlow(factor, ms){ this.attackSlowFactor = factor; this.attackSlowUntil = performance.now() + ms; }
    applyBuff(mult, ms){ this.buffMultiplier = mult; this.buffUntil = performance.now() + ms; }
    takeDamage(d){
      this.hp -= d;
      particles.push({ x:this.x, y:this.y, t:performance.now(), dur:520, col:'#ff6b6b' });
      if(this.hp<=0) this.die();
    }
    die(){
      if(!this.alive) return;
      this.alive=false;
      score += Math.round(this.xpValue);
      const orbsCount = Math.max(1, Math.floor(this.xpValue/6));
      for(let i=0;i<orbsCount;i++) orbs.push(new Orb(this.x + randRange(-10,10), this.y + randRange(-10,10), randRange(6,16), 'xp'));
      // nerfed heal chance
      if(Math.random() < 0.08) orbs.push(new Orb(this.x + randRange(-8,8), this.y + randRange(-8,8), randRange(12,30), 'heal'));
    }
    applySlow(factor, ms){ this.slowFactor = factor; this.slowUntil = performance.now() + ms; }
    update(dt){
      if(!player || !player.alive) return;
      // if stunned, only apply lingering velocity (knockback) and skip AI/movement
      if(this.stunUntil > performance.now()){
        this.applyVelocity(dt);
        return;
      }
      if(this.friendly) {
        if(this.updateFriendly) this.updateFriendly(dt);
        // friendly can still have vx vy applied
        this.applyVelocity(dt);
        return;
      }
      if(performance.now() > this.slowUntil) this.slowFactor = 1;
      if(performance.now() > this.attackSlowUntil) this.attackSlowFactor = 1;
      if(performance.now() > this.buffUntil) this.buffMultiplier = 1;
      const sx = player.x - this.x, sy = player.y - this.y; const d = Math.hypot(sx,sy);
      if(d > 1){
        const spd = this.speed * (this.slowFactor || 1) * (this.buffMultiplier || 1);
        this.x += (sx/d) * spd * dt/1000;
        this.y += (sy/d) * spd * dt/1000;
      }
      // apply knockback velocity
      this.applyVelocity(dt);

      // keep within map
      this.x = clamp(this.x, 0, MAP_W); this.y = clamp(this.y, 0, MAP_H);

      // Prevent enemies from clipping into player: if overlapping, shove the enemy outward
      const d2 = Math.hypot(player.x - this.x, player.y - this.y) || 0.0001;
      const minDist = this.r + player.r + 4;
      if(d2 < minDist){
        const overlap = (minDist - d2) + 0.5;
        const nx = (this.x - player.x) / d2;
        const ny = (this.y - player.y) / d2;
        this.x += nx * overlap;
        this.y += ny * overlap;
        // give a small outward nudge to velocity so it doesn't immediately re-collide
        this.vx += nx * 60;
        this.vy += ny * 60;
      }

      // melee damage on contact (use explicit meleePower when provided)
      if(this.melee && d2 <= this.r + player.r + 4){
        if(this.tickAcc <= 0){
          const dmg = this.meleePower || Math.max(3, this.maxHp*0.06);
          player.takeDamage(dmg, { x: this.x, y: this.y, type: 'melee' });
          this.tickAcc = 750;
        }
      }
      if(this.tickAcc > 0) this.tickAcc = Math.max(0, this.tickAcc - dt);
    }
    applyVelocity(dt){
      // simple damping
      this.x += this.vx * dt/1000;
      this.y += this.vy * dt/1000;
      this.vx *= Math.pow(0.2, dt/1000); // quickly damp
      this.vy *= Math.pow(0.2, dt/1000);
    }
    draw(ctx, cam){
      if(!this.alive) return;
      const x = this.x - cam.x, y = this.y - cam.y;
      ctx.save(); ctx.translate(x,y);
      // style by type, and friendly entities render in distinct color
      if(this.friendly){ ctx.fillStyle = '#6be37b'; }
      else if(this.type==='skeleton'){ ctx.fillStyle = '#dfe8e9'; }
      else if(this.type==='demon'){ ctx.fillStyle = '#b14a4a'; }
      else if(this.type==='brute'){ ctx.fillStyle = '#7b3a3a'; }
      else if(this.type==='wolf'){ ctx.fillStyle = '#88aacc'; }
      else if(this.type==='mini'){ ctx.fillStyle = '#ffc968'; }
      else if(this.type==='boss'){ ctx.fillStyle = '#ff6b6b'; }
      else if(this.type==='necromancer'){ ctx.fillStyle = '#9a6bd1'; }
      else ctx.fillStyle = '#6b8b6b';
      ctx.beginPath(); ctx.arc(0,0,this.r,0,Math.PI*2); ctx.fill();
      // hp bar
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-this.r, -this.r-8, this.r*2, 5);
      ctx.fillStyle = '#ff8d4d'; ctx.fillRect(-this.r, -this.r-8, (this.hp/this.maxHp)*this.r*2, 5);
      ctx.restore();
    }
  }


  // --- New enemy types: Replicator + MeteorSummoner Boss ---
  class Replicator extends Enemy {
    constructor(x,y,lvl){
      super(x,y, 120 + lvl*30, 30, 20, 'replicator', true, 80 + lvl*8);
      this.lifespan = performance.now() + 18000; // will spawn clones then perish
      this.spawned = false;
      this.realId = Math.random().toString(36).slice(2,8);
    }
    update(dt){
      Enemy.prototype.update.call(this, dt);
      if(!this.spawned && performance.now() > this.lifespan - 14000){
        // spawn clones nearby (visual only weaker)
        for(let i=0;i<3;i++){
          const c = new Enemy(this.x + randRange(-28,28), this.y + randRange(-28,28), Math.max(8, 18 + Math.floor(this.xpValue/6)), 80, 10, 'mini', true, Math.max(4, Math.floor(this.xpValue/5)));
          // mark clone as illusion (no XP)
          c.illusion = true; c.realRef = this.realId; enemies.push(c);
        }
        this.spawned = true;
      }
      // replicator occasionally duplicates: clone itself (rare)
      if(performance.now() > this.lifespan){ this.die(); }
    }
    die(){
      if(!this.alive) return;
      this.alive = false;
      // reward only if real
      score += Math.round(this.xpValue * 1.5);
      for(let i=0;i<3;i++) orbs.push(new Orb(this.x + randRange(-10,10), this.y + randRange(-10,10), randRange(6,12), 'xp'));
      particles.push({ x:this.x, y:this.y, t:performance.now(), dur:900, col:'#ff9b6b' });
    }
  }

  class MeteorSummoner extends Enemy {
    constructor(x,y,lvl){
      super(x,y, 420 + lvl*80, 8, 30, 'meteor_summoner', false, 160 + lvl*20);
      this.strikeAcc = 4000 - lvl*80;
    }
    update(dt){
      Enemy.prototype.update.call(this, dt);
      this.strikeAcc -= dt * (this.attackSlowFactor || 1);
      if(this.strikeAcc <= 0){
        this.strikeAcc = 3200 + Math.random()*2000;
        // telegraph a meteor at a random on-screen position near player
        const ang = Math.random()*Math.PI*2; const rad = randRange(80, Math.min(420, VIEW_W));
        const tx = clamp(player.x + Math.cos(ang)*rad, 0, MAP_W);
        const ty = clamp(player.y + Math.sin(ang)*rad, 0, MAP_H);
        // create telegraph beam with long dur
        beams.push({ x1:tx, y1:ty, aoe:true, range:100, t:performance.now(), dur:3000, power:0, meteor:true, long:true });
        // impact after telegraph
        setTimeout(()=>{
          beams.push({ x1:tx, y1:ty, aoe:true, range:160, t:performance.now(), dur:420, power:80 + Math.floor(this.xpValue/2) });
          for(const e of enemies) if(e.alive && !e.friendly && dist(tx,ty,e.x,e.y) <= 160){ e.takeDamage(80 + Math.floor(this.xpValue/2)); }
          if(dist(tx,ty,player.x,player.y) <= 160) player.takeDamage(60, { x: tx, y: ty, type: 'meteor' });
          particles.push({ x:tx, y:ty, t:performance.now(), dur:1200, col:'#ff6b6b' });
        }, 3000);
      }
    }
  }

  // --- utilities ---
  function randRange(a,b){ return a + Math.random()*(b-a); }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function dist(ax,ay,bx,by){ const dx=ax-bx, dy=ay-by; return Math.hypot(dx,dy); }
  function choose(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function onScreen(x,y){
    return x >= camera.x - 16 && x <= camera.x + VIEW_W + 16 && y >= camera.y - 16 && y <= camera.y + VIEW_H + 16;
  }

  // --- Player ---
  class Player {
    constructor(x,y){
      this.x=x; this.y=y; this.r=18;
      this.hp=120; this.maxHp=120;
  this.reflectUntil = 0; // for reflect_shield ability
      this.xp=0; this.level=1;
      this.nextXp = 50;
      this.abilities = [];
      this.moveSpeed = 180;
      this.shieldUntil = 0;
      this.invulUntil = 0; // true invulnerability for phase_shift
      this.alive = true;
      this.lastAuto = {};
      this.lastDir = { x:1, y:0 };
      this.trailPoints = [];
      this.slowUntil = 0; this.slowFactor = 1;
    }
    applySlow(factor, ms){ this.slowFactor = factor; this.slowUntil = performance.now() + ms; }
    addAbility(id){
      const existing = this.abilities.find(a=>a.id===id);
      if(existing){ existing.lvl++; return existing; }
      const def = abilityDefs[id];
      if(!def) return null;
      const item = { id, lvl:1, cd:0, lastUsed:0 };
      this.abilities.push(item);
      return item;
    }
    hasAbility(id){ return !!this.abilities.find(a=>a.id===id); }
    abilityLevel(id){ const a=this.abilities.find(x=>x.id===id); return a? a.lvl:0; }
    tick(dt){
      this.abilities.forEach(a=>{ if(a.cd>0) a.cd = Math.max(0, a.cd - dt); });
      if(performance.now() > this.slowUntil) this.slowFactor = 1;
      // shield ring periodic spawner: when shield ability recently used, spawn visible rings that briefly reduce damage
      try{
        const now = performance.now();
        if(this._shieldRingActiveUntil && now < this._shieldRingActiveUntil){
          this._shieldRingAcc = this._shieldRingAcc || 0;
          if(now >= this._shieldRingAcc){
            // schedule next ring in ~1.1s
            this._shieldRingAcc = now + 1100;
            // visible pulse
            beams.push({ x1:this.x, y1:this.y, aoe:true, range: Math.round(this.r + 96), t: now, dur: 520, power:0, shieldRing:true });
            // brief extra damage reduction window
            this._shieldRingWindowUntil = now + 520;
          }
        }
      }catch(e){}
      for(const a of this.abilities){
        const def = abilityDefs[a.id];
        if(!def) continue;
        if(def.type === 'auto'){
          const last = this.lastAuto[a.id]||0;
          if(performance.now() - last > (def.cooldown || 1000)){
            this.lastAuto[a.id] = performance.now();
            this.triggerAuto(a.id);
          }
        }
      }
      // trailPoints reserved for visual movement trail
      this.trailPoints = [];
      // allow deploy-type abilities to auto-trigger when ready (place turret/mine automatically)
      for(const a of this.abilities){
        const def = abilityDefs[a.id]; if(!def) continue;
        if(def.type === 'deploy' && a.cd <= 0){
          // avoid placing duplicate turret/mine nearby
          if(a.id === 'turret'){
            const nearbyTurret = enemies.find(en=>en.friendly && en.type === 'turret' && dist(en.x,en.y,this.x,this.y) < 180);
            if(!nearbyTurret) this.tryUseAbility(a.id);
          } else if(a.id === 'homing_mine'){
            const nearbyMine = enemies.find(en=>en.friendly && en.type === 'mine' && dist(en.x,en.y,this.x,this.y) < 120);
            if(!nearbyMine) this.tryUseAbility(a.id);
          }
        }
      }
    }
    triggerAuto(id){
      const def = abilityDefs[id];
      const lvl = this.abilityLevel(id);
      const power = def.upgradePow ? def.upgradePow(lvl-1) : def.basePower;
      if(id === 'blade_spin'){
        blades.push({ t: performance.now(), dur: 700, power, spins: 6 + lvl*2 });
      } else if(id === 'auto_laser'){
        const target = enemies.filter(e=>e.alive && !e.friendly && onScreen(e.x,e.y)).sort((a,b)=>dist(this.x,this.y,a.x,a.y)-dist(this.x,this.y,b.x,b.y))[0];
        if(target) {
          beams.push({ x1:this.x, y1:this.y, x2:target.x, y2:target.y, t:performance.now(), dur:220, power });
          target.takeDamage(power);
          // small knockback from laser
          const dx = target.x - this.x, dy = target.y - this.y, m=Math.hypot(dx,dy)||1;
          target.vx = (target.vx||0) + (dx/m)*20;
          target.vy = (target.vy||0) + (dy/m)*20;
        }
      } else if(id === 'anvil_drop'){
        const pool = enemies.filter(e=>e.alive && !e.friendly && onScreen(e.x,e.y));
        if(pool.length){
          const target = choose(pool);
          anvils.push({ tx: target.x, ty: target.y, x: target.x, y: -80, vy: 0, t: performance.now(), power, hit:false });
        }
      } else if(id === 'chain_lightning'){
        // auto-triggered chain lightning: hit nearest on-screen enemy then arc to nearby targets
        const pool = enemies.filter(e=>e.alive && !e.friendly && onScreen(e.x,e.y));
        if(pool.length){
          const first = pool.sort((a,b)=>dist(this.x,this.y,a.x,a.y)-dist(this.x,this.y,b.x,b.y))[0];
          if(first){
            const lvl = this.abilityLevel('chain_lightning');
            const base = power;
            beams.push({ x1:this.x, y1:this.y, x2:first.x, y2:first.y, t:performance.now(), dur:200, power: base });
            first.takeDamage(base);
            let last = first;
            const chains = 1 + Math.floor((lvl-1)/2) + 1;
            const targets = enemies.filter(e=>e.alive && !e.friendly && e !== first).sort((a,b)=>dist(first.x,first.y,a.x,a.y)-dist(first.x,first.y,b.x,b.y)).slice(0, chains);
            for(const tg of targets){
              beams.push({ x1:last.x, y1:last.y, x2:tg.x, y2:tg.y, t:performance.now(), dur:220, power: base*0.7 });
              tg.takeDamage(Math.round(base*0.7));
              last = tg;
            }
          }
        }
      }
    }
    takeDamage(dmg, src){
      // preliminary normalization of src: if provided but missing numeric x/y, attempt to infer nearest enemy/player
      if(src && (typeof src.x !== 'number' || typeof src.y !== 'number')){
        try{
          let nearest = null, nd = Infinity;
          for(const e of enemies) if(e.alive && !e.friendly){ const d = dist(e.x,e.y,this.x,this.y); if(d < nd){ nd = d; nearest = e; } }
          if(nearest && nd < 160){ src.x = nearest.x; src.y = nearest.y; src._guessed = { type: nearest.type }; }
          else { src.x = this.x; src.y = this.y; src._guessed = { type: 'self' }; }
        }catch(e){}
      }

      // now perform a nearby-source sanity check for melee sources: if there's no nearby enemy, treat as phantom and ignore
      try{
        if(src && src.type === 'melee'){
          // find nearest hostile enemy to player
          let nearest = null, nd = Infinity;
          for(const e of enemies) if(e.alive && !e.friendly){ const d = dist(e.x,e.y,this.x,this.y); if(d < nd){ nd = d; nearest = e; } }
          // augment log with guess info (below) and reject if nothing is reasonably close
          if(!nearest || nd > 180){
            console.warn('[Day5] Ignored phantom melee damage (no nearby enemy found)', { src, nearestGuess: nearest ? { type:nearest.type, d: Math.round(nd) } : null });
            // record this ignored event for diagnostics
            if(window && !window._day5_ignored_phantom) window._day5_ignored_phantom = [];
            window._day5_ignored_phantom.push({ t: performance.now(), src, nearest: nearest ? { type: nearest.type, x: nearest.x, y: nearest.y, d: nd } : null, hp: this.hp });
            // keep the ignored log length bounded
            if(window && window._day5_ignored_phantom && window._day5_ignored_phantom.length > 300) window._day5_ignored_phantom.shift();
            return;
          }
        }
      }catch(e){}

      // instrumentation: record every damage attempt so we can trace phantom sources (after normalization)
      try{
        if(window && !window._day5_damage_log) window._day5_damage_log = [];
        const entry = { t: performance.now(), dmg: dmg, src: src ? { ...src } : null, hp: this.hp };
        try{ entry.stack = (new Error()).stack.split('\n').slice(2,8).map(s=>s.trim()); }catch(e){}
        if(window && window._day5_damage_log){ window._day5_damage_log.push(entry); if(window._day5_damage_log.length > 600) window._day5_damage_log.shift(); }
        if(console && console.debug) console.debug('[Day5] takeDamage called', entry);
      }catch(e){}

      // if player is currently invulnerable (phase_shift), ignore damage
      if(this.invulUntil && this.invulUntil > performance.now()){
        if(console && console.debug) console.debug('[Day5] damage blocked by invulnerability', src);
        return;
      }

      // ignore damage if player already dead
      if(!this.alive) return;

      // simple dedupe for rapid repeated hits from identical sources to prevent phantom persistent damage
      // normalize src coords: if provided but missing numeric x/y, attempt to infer nearest enemy/player
      if(src && (typeof src.x !== 'number' || typeof src.y !== 'number')){
        try{
          // try to find a nearby enemy as the likely culprit
          let nearest = null, nd = Infinity;
          for(const e of enemies) if(e.alive && !e.friendly){ const d = dist(e.x,e.y,this.x,this.y); if(d < nd){ nd = d; nearest = e; } }
          if(nearest && nd < 160){ src.x = nearest.x; src.y = nearest.y; }
          else { src.x = this.x; src.y = this.y; }
        }catch(e){}
      }
      this._recentDamage = this._recentDamage || [];
      try{
        const nowt = performance.now();
        if(src && typeof src.x === 'number' && typeof src.y === 'number' && src.type){
          // remove old entries
          this._recentDamage = this._recentDamage.filter(it => nowt - it.t < 600);
          const similar = this._recentDamage.find(it => it.type === src.type && Math.hypot(it.x - src.x, it.y - src.y) < 8);
          if(similar){
            // already took very recent damage from same source, ignore to avoid repeats
            if(console && console.debug) console.debug('[Day5] Ignored repeated damage from same source', src);
            return;
          }
          this._recentDamage.push({ x: src.x, y: src.y, type: src.type, t: nowt });
        }
      }catch(e){}

      // shield reduction (less strong than phase_shift)
      if(this.shieldUntil > performance.now()) dmg *= 0.65;
      // additional temporary ring reduction windows (spawned by shield ability)
      try{
        const nowt = performance.now();
        if(this._shieldRingWindowUntil && this._shieldRingWindowUntil > nowt){ dmg *= 0.78; }
      }catch(e){}

      // If a source is provided, verify it's reasonably close to the player. This avoids
      // accepting damage from distant/noisy sources (phantom hits) while preserving
      // legitimate attacks (which include src coords).
      if(src && typeof src.x === 'number' && typeof src.y === 'number'){
        const ds = dist(src.x, src.y, this.x, this.y);
        if(ds > 600){
          const now = performance.now();
          this._lastPhantomLog = this._lastPhantomLog || 0;
          if(now - this._lastPhantomLog > 2500){ this._lastPhantomLog = now; console.warn('Ignored distant damage source at', src, 'dist', Math.round(ds)); }
          return;
        }
      }

      // if no src provided, perform a nearby threat check (enemy or enemy projectile)
      if(!src){
        let threat = false;
        try{
          for(const p of projectiles) if(p.alive && p.owner === 'enemy' && dist(p.x,p.y,this.x,this.y) <= (p.r + this.r + 8)){ threat = true; break; }
          if(!threat){
            for(const e of enemies) if(e.alive && !e.friendly && dist(e.x,e.y,this.x,this.y) <= (e.r + this.r + 8)){ threat = true; break; }
          }
        }catch(ex){ threat = true; }
        if(!threat){
          const now = performance.now();
          this._lastPhantomLog = this._lastPhantomLog || 0;
          if(now - this._lastPhantomLog > 2500){ this._lastPhantomLog = now; console.warn('Ignored phantom damage: no nearby visible source'); }
          return;
        }
      }

      this.hp -= dmg;
      if(this.hp <= 0){ this.hp = 0; this.die(); }
    }
    heal(n){ this.hp = Math.min(this.maxHp, this.hp + n); }
    die(){ this.alive=false; onPlayerDeath(); }
    giveXp(n){
      this.xp += n;
      while(this.xp >= this.nextXp){
        this.xp -= this.nextXp;
        this.level++;
        this.nextXp = Math.floor(50 * Math.pow(1.28, this.level-1)); // easier leveling
        queueLevelUp();
      }
    }
    tryUseAbility(id, dx, dy){
      const def = abilityDefs[id]; if(!def) return false;
      const slot = this.abilities.find(a=>a.id===id); if(!slot) return false;
      if(slot.cd>0) return false;
      slot.lastUsed = performance.now();
        // effective cooldown decreases with ability level (upgrades reduce cooldown)
        slot.cd = def.cooldown ? Math.max(0, Math.round(def.cooldown * Math.pow(0.85, slot.lvl - 1))) : 0;
      const lvl = slot.lvl;
      const power = def.upgradePow ? def.upgradePow(lvl-1) : def.basePower;

      // resolve direction: prefer argument, fall back to lastDir
      const dirx = (typeof dx === 'number') ? dx : this.lastDir.x;
      const diry = (typeof dy === 'number') ? dy : this.lastDir.y;
      const mag = Math.hypot(dirx, diry) || 1;

      if(def.type==='melee' || def.type==='aura'){
        // reduced melee power; visible blades already handled by auto/melee combining to blades
        blades.push({ t:performance.now(), dur:520, power, spins: 4 + lvl });
        for(const e of enemies) if(e.alive && !e.friendly && dist(this.x,this.y,e.x,e.y) <= (def.range||72)){
          e.takeDamage(power);
          // knockback small
          const dx2 = e.x - this.x, dy2 = e.y - this.y, m2 = Math.hypot(dx2,dy2)||1;
          e.vx = (e.vx||0) + (dx2/m2)*28;
          e.vy = (e.vy||0) + (dy2/m2)*28;
        }
        return true;
      }
      if(def.type==='dash'){
        const nx = (dirx/mag), ny = (diry/mag);
        const targetX = this.x + nx*def.range, targetY = this.y + ny*def.range;
        // visible streak
        particles.push({ x:this.x + nx*(this.r+6), y:this.y + ny*(this.r+6), t:performance.now(), dur:420, col:'#ffd8a0' });
        this.x = clamp(targetX, this.r, MAP_W - this.r);
        this.y = clamp(targetY, this.r, MAP_H - this.r);
        for(const e of enemies) if(e.alive && !e.friendly && dist(this.x,this.y,e.x,e.y) <= this.r + e.r + 8){
          e.takeDamage(power);
          // strong knockback
          const dx2=e.x-this.x, dy2=e.y-this.y, m2=Math.hypot(dx2,dy2)||1;
          e.vx=(e.vx||0)+(dx2/m2)*60; e.vy=(e.vy||0)+(dy2/m2)*60;
        }
        return true;
      }
      if(def.type==='projectile'){
            // special-case for seeker shot
            if(id === 'seeker_shot'){
              // create a homing projectile that updates its velocity toward nearest on-screen enemy
              const nx = dirx/mag, ny = diry/mag;
              const proj = new Projectile(this.x + nx*(this.r+8), this.y + ny*(this.r+8), nx*420, ny*420, power, 7, 'player', def.range, {
                homing:true,
                homingStrength: 420 + lvl*20,
                visual:'spark',
                onUpdate: function(p, dt){
                  // find nearest enemy on screen
                  let target = null, td = Infinity;
                  for(const e of enemies) if(e.alive && !e.friendly && onScreen(e.x,e.y)){
                    const d = dist(p.x,p.y,e.x,e.y); if(d<td){ td=d; target=e; }
                  }
                  if(target){ const dx = target.x - p.x, dy = target.y - p.y, m2 = Math.hypot(dx,dy)||1; p.vx += (dx/m2) * (p.opt.homingStrength/100) * dt/1000; p.vy += (dy/m2) * (p.opt.homingStrength/100) * dt/1000; }
                }
              });
              projectiles.push(proj);
              return true;
            }
        if(id === 'multi_arrow'){
          // number of arrows scales with level
          const spread = 3 + Math.max(0, lvl-1);
          for(let i=0;i<spread;i++){
            const a = (i - Math.floor(spread/2)) * 0.12;
            const ang = Math.atan2(diry,dirx) + a;
            const nx = Math.cos(ang), ny = Math.sin(ang);
            projectiles.push(new Projectile(this.x + nx*(this.r+8), this.y + ny*(this.r+8), nx*420, ny*420, power, 6, 'player', def.range, { type:'arrow' }));
          }
        } else if(id === 'cannon'){
          // heavy cannonball: explodes on impact or expire with AoE damage
          const nx = dirx/mag, ny = diry/mag;
          projectiles.push(new Projectile(this.x + nx*(this.r+8), this.y + ny*(this.r+8), nx*320, ny*320, power, 10, 'player', def.range, {
            onExpire: (px,py)=>{
              const rad = 80 + lvl*12;
              beams.push({ x1:px, y1:py, aoe:true, range:rad, t:performance.now(), dur:360, power: power*0.9 });
              for(const e of enemies) if(e.alive && !e.friendly && dist(px,py,e.x,e.y) <= rad){ e.takeDamage(Math.round(power*0.9)); e.vx = (e.x-px)/Math.max(1,dist(px,py,e.x,e.y))*80; e.vy = (e.y-py)/Math.max(1,dist(px,py,e.x,e.y))*80; }
              particles.push({ x:px, y:py, t:performance.now(), dur:900, col:'#ffb86b' });
            },
            onHit: (enemy)=>{
              // immediate explosion on hit
              const px = enemy.x, py = enemy.y; const rad = 80 + lvl*12;
              beams.push({ x1:px, y1:py, aoe:true, range:rad, t:performance.now(), dur:360, power: power*0.9 });
              for(const e of enemies) if(e.alive && !e.friendly && dist(px,py,e.x,e.y) <= rad){ e.takeDamage(Math.round(power*0.9)); e.vx = (e.x-px)/Math.max(1,dist(px,py,e.x,e.y))*80; e.vy = (e.y-py)/Math.max(1,dist(px,py,e.x,e.y))*80; }
            },
            visual:'heavy'
          }));
        // stun_grenade removed
        } else if(id === 'ice_shard'){
          const nx = dirx/mag, ny = diry/mag;
          projectiles.push(new Projectile(this.x + nx*(this.r+8), this.y + ny*(this.r+8), nx*380, ny*380, power, 6, 'player', def.range, {
            onHit: (enemy)=>{
              // stronger, more noticeable slow effect on movement
              enemy.applySlow(0.3, 4200 + lvl*1200);
              // slow down enemy attack cadence as well (longer)
              if(typeof enemy.applyAttackSlow === 'function') enemy.applyAttackSlow(0.4, 6000 + lvl*1500);
              // stronger immediate velocity damp so they visibly jolt
              enemy.vx *= 0.35; enemy.vy *= 0.35;
              beams.push({ x1:enemy.x, y1:enemy.y, aoe:false, t:performance.now(), dur:420, power:Math.round(power*0.6) });
              particles.push({ x:enemy.x, y:enemy.y, t:performance.now(), dur:1000, col:'#d6f2ff' });
            },
            visual:'spark'
          }));
        } else if(id === 'ricochet'){
          // ricochet: spawns a projectile that can spawn follow-up projectiles hitting nearby enemies
          const nx = dirx/mag, ny = diry/mag;
          const bounces = 1 + Math.floor(lvl/2);
          const speed = 420;
          function makeRicochet(sx, sy, tx, ty, remaining){
            const dxr = tx - sx, dyr = ty - sy; const m2 = Math.hypot(dxr,dyr)||1;
            projectiles.push(new Projectile(sx, sy, dxr/m2*speed, dyr/m2*speed, Math.round(power), 6, 'player', def.range, {
              onHit: (enemy)=>{
                // spawn particle beam
                beams.push({ x1:enemy.x, y1:enemy.y, aoe:false, t:performance.now(), dur:200, power: power*0.6 });
                if(remaining > 0){
                  // find next nearest enemy excluding this one
                  const next = enemies.filter(e=>e.alive && !e.friendly && e !== enemy).sort((a,b)=>dist(enemy.x,enemy.y,a.x,a.y)-dist(enemy.x,enemy.y,b.x,b.y))[0];
                  if(next){
                    // spawn new projectile from this enemy to next
                    setTimeout(()=> makeRicochet(enemy.x, enemy.y, next.x, next.y, remaining-1), 40);
                  }
                }
              },
              visual:'spark'
            }));
          }
          // initial target: pick an on-screen enemy towards click direction or nearest
          const firstTarget = enemies.filter(e=>e.alive && !e.friendly).sort((a,b)=>dist(this.x,this.y,a.x,a.y)-dist(this.x,this.y,b.x,b.y))[0];
          if(firstTarget){ makeRicochet(this.x + nx*(this.r+8), this.y + ny*(this.r+8), firstTarget.x, firstTarget.y, bounces); }
        } else if(id === 'meteor'){
          const nx = dirx/mag, ny = diry/mag;
          // meteor: spawn falling marker then impact after short delay
          const tx = this.x + nx * Math.min(def.range, 420);
          const ty = this.y + ny * Math.min(def.range, 420);
          // visible telegraph
          beams.push({ x1:tx, y1:ty, aoe:true, range:80, t:performance.now(), dur:800, power:0, meteor:true });
          setTimeout(()=> {
            // impact
            beams.push({ x1:tx, y1:ty, aoe:true, range:140, t:performance.now(), dur:420, power });
            for(const e of enemies) if(e.alive && !e.friendly && dist(tx,ty,e.x,e.y) <= 140){ e.takeDamage(power); e.vx=(e.x-tx)/Math.max(1,dist(tx,ty,e.x,e.y))*80; e.vy=(e.y-ty)/Math.max(1,dist(tx,ty,e.x,e.y))*80; }
            particles.push({ x:tx, y:ty, t:performance.now(), dur:900, col:'#ffb86b' });
          }, 700);
        } else {
          // default projectile (fireball)
          const nx = dirx/mag, ny = diry/mag;
          projectiles.push(new Projectile(this.x + nx*(this.r+8), this.y + ny*(this.r+8), nx*420, ny*420, power, 7, 'player', def.range, {
            onHit: (enemy)=>{
              // explosion visual + small AoE
              beams.push({ x1:enemy.x, y1:enemy.y, aoe:true, range:42, t:performance.now(), dur:260, power: power*0.6 });
              for(const e of enemies) if(e.alive && !e.friendly && dist(enemy.x,enemy.y,e.x,e.y)<=42){ e.takeDamage(power*0.35); e.vx=(e.x-enemy.x)/Math.max(1,dist(enemy.x,enemy.y,e.x,e.y))*26; e.vy=(e.y-enemy.y)/Math.max(1,dist(enemy.x,enemy.y,e.x,e.y))*26; }
            },
            visual:'fire'
          }));
        }
        return true;
      }
      if(def.type==='deploy'){
        if(id === 'turret'){
          const t = new Turret(this.x + 20, this.y, power, 7000 + lvl*1500); t.friendly = true; enemies.push(t);
        } else if(id === 'homing_mine'){
          enemies.push(new HomingMine(this.x + randRange(-18,18), this.y + randRange(-18,18), power, 7000 + lvl*1000));
        }
        return true;
      }
      if(def.type==='cone'){
        beams.push({ x1:this.x, y1:this.y, angle: Math.atan2(diry,dirx), cone:true, dur:260, t:performance.now(), power, range:def.range });
        const angleCenter = Math.atan2(diry,dirx);
        const coneSize = Math.PI/3;
        for(const e of enemies) if(e.alive && !e.friendly){
          const dx2 = e.x - this.x, dy2 = e.y - this.y, d = Math.hypot(dx2,dy2);
          if(d > def.range) continue;
          const a = Math.atan2(dy2,dx2); let diff = Math.abs(((a-angleCenter+Math.PI)%(Math.PI*2))-Math.PI);
          if(diff < coneSize/2){ e.takeDamage(power); e.vx=(e.x-this.x)/Math.max(1,d)*60; e.vy=(e.y-this.y)/Math.max(1,d)*60; }
        }
        return true;
      }
      if(def.type==='active'){
        // per-ability active behavior — only keep phase_shift and fallback shield
        if(id === 'phase_shift'){
          // short true invulnerability (no damage taken while active)
          this.invulUntil = performance.now() + 600 + lvl*400;
          // small visual cue
          beams.push({ x1:this.x, y1:this.y, aoe:true, range: this.r+32, t:performance.now(), dur:380, power:0 });
        } else if(id === 'shield'){
          // shield reduces incoming damage and emits periodic protective rings + revolving shields
          const now = performance.now();
          this.shieldUntil = now + 1200 + lvl*400;
          // spawn a sequence of rings for a short window (rings every ~1.1s)
          this._shieldRingActiveUntil = now + 3200 + Math.max(0, lvl*400);
          this._shieldRingAcc = now + 60;
          // revolving shield visual lasts slightly shorter than ring sequence
          this._revolvingShieldUntil = now + 1200 + Math.max(0, lvl*300);
        } else {
          // generic short shield fallback
          this.shieldUntil = performance.now() + 800 + lvl*300;
        }
        return true;
      }
      if(def.type==='aoe'){
        const dmgMul = (id === 'shock_burst') ? 0.95 : 0.6;
        const kb = (id === 'shock_burst') ? 120 : 40;
        for(const e of enemies) if(e.alive && !e.friendly && dist(this.x,this.y,e.x,e.y) <= def.range){ e.applySlow(0.45, 2000 + lvl*200); e.takeDamage(Math.round(power * dmgMul)); e.vx=(e.x-this.x)/Math.max(1,dist(this.x,this.y,e.x,e.y))*kb; e.vy=(e.y-this.y)/Math.max(1,dist(this.x,this.y,e.x,e.y))*kb; }
        // special visual for shock_burst
        if(id === 'shock_burst'){
          beams.push({ x1:this.x, y1:this.y, aoe:true, range:def.range, t:performance.now(), dur:420, power, shock:true });
          // concentric pulse
          beams.push({ x1:this.x, y1:this.y, aoe:true, range:Math.round(def.range*0.6), t:performance.now()+40, dur:300, power:Math.round(power*0.5), shock:true });
          particles.push({ x:this.x, y:this.y, t:performance.now(), dur:900, col:'#fff2b2' });
        } else {
          beams.push({ x1:this.x, y1:this.y, aoe:true, range:def.range, t:performance.now(), dur:320, power });
        }
        return true;
      }
      return false;
    }
  }

  class Necromancer extends Enemy {
    constructor(x,y,lvl){
      super(x,y, 70 + lvl*18, 16 + lvl*1.2, 14, 'necromancer', false, 36 + lvl*4);
      this.summonAcc = 2200 - lvl*60;
    }
    update(dt){
      Enemy.prototype.update.call(this,dt);
  this.summonAcc -= dt * (this.attackSlowFactor || 1);
      if(this.summonAcc <= 0){
        this.summonAcc = 2200 + Math.random()*700;
        // summon a skeleton nearby (only if on-screen so not unfair)
        if(onScreen(this.x,this.y)){
          const s = new Enemy(this.x + randRange(-30,30), this.y + randRange(-30,30), 26 + this.xpValue/2, 40, 10, 'skeleton', false, 8 + Math.floor(this.xpValue/3));
          enemies.push(s);
          particles.push({ x:this.x, y:this.y, t:performance.now(), dur:520, col:'#9b8cff' });
        }
      }
    }
  }

  // replacement enemy: Skirmisher (less buggy dash attacker)
  class Skirmisher extends Enemy {
    constructor(x,y,lvl){
      // simpler: store level and use smaller impulse with telegraph
      super(x,y, 48 + lvl*6, 72 + Math.floor(lvl*3), 10, 'skirmisher', true, 18 + lvl*2);
      this.meleePower = 6;
      this.lvl = lvl;
      this.chargeAcc = 1600 - Math.max(0, this.lvl*12);
      this.telegraph = false;
    }
    update(dt){
      Enemy.prototype.update.call(this, dt);
      this.chargeAcc -= dt * (this.attackSlowFactor || 1);
      if(this.chargeAcc <= 0){
        this.chargeAcc = 1400 + Math.random()*1200;
        // telegraph briefly then dash
        this.telegraph = true;
        const sx = this.x, sy = this.y;
        beams.push({ x1: this.x, y1: this.y, aoe:false, range: 8, t:performance.now(), dur:260, power:0 });
        setTimeout(()=>{
          const dx = player.x - this.x, dy = player.y - this.y, m = Math.hypot(dx,dy)||1;
          const impulse = 260 + Math.floor(this.lvl*6);
          this.vx += (dx/m) * impulse; this.vy += (dy/m) * impulse;
          this.telegraph = false;
        }, 180);
      }
    }
  }

  // new enemy: Sniper (telegraphed long range shot)
  class Sniper extends Enemy {
    constructor(x,y,lvl){
      super(x,y, 38 + lvl*6, 12 + lvl*1.2, 12, 'sniper', false, 26 + lvl*4);
      this.snipeAcc = 1800 - lvl*60;
    }
    update(dt){
      Enemy.prototype.update.call(this, dt);
  this.snipeAcc -= dt * (this.attackSlowFactor || 1);
      if(this.snipeAcc <= 0){
        this.snipeAcc = 1800 + Math.random()*1000;
        if(onScreen(this.x,this.y)){
          // telegraph then fire
          const tx = player.x, ty = player.y;
          beams.push({ x1:tx, y1:ty, aoe:false, range:6, t:performance.now(), dur:420, power:0 });
          setTimeout(()=>{
            const dx = tx - this.x, dy = ty - this.y, m = Math.hypot(dx,dy)||1;
            // spawn an enemy projectile (respects ENEMY_PROJECTILE_CAP elsewhere)
            projectiles.push(new Projectile(this.x, this.y, dx/m*220, dy/m*220, Math.max(8, 8 + Math.floor(player.level*0.6)), 6, 'enemy', 640));
          }, 400);
        }
      }
    }
  }

  // new enemy: Tank (big slow enemy)
  class Tank extends Enemy {
    constructor(x,y,lvl){
      super(x,y, 220 + lvl*50, 8 + Math.floor(lvl*0.5), 36, 'tank', true, 180 + lvl*12);
    }
    update(dt){
      Enemy.prototype.update.call(this, dt);
      // occasionally slam area
      if(Math.random() < 0.002){
        for(const e of enemies) if(e.alive && !e.friendly && dist(this.x,this.y,e.x,e.y) < 80) e.takeDamage(18 + Math.floor(player.level*2));
      }
    }
  }

  // new enemy: SlowCaster - periodically fires a chilling beam that slows the player
  class SlowCaster extends Enemy {
    constructor(x,y,lvl){
      super(x,y, 46 + lvl*8, 12 + Math.floor(lvl*0.5), 12, 'slowcaster', false, 26 + lvl*4);
      this.castAcc = 2200 - Math.min(1400, lvl*60);
    }
    update(dt){
      Enemy.prototype.update.call(this, dt);
      this.castAcc -= dt * (this.attackSlowFactor || 1);
      if(this.castAcc <= 0){
        this.castAcc = 2000 + Math.random()*1200;
        if(onScreen(this.x,this.y)){
          // telegraph and apply slow to player if in range
          beams.push({ x1:player.x, y1:player.y, aoe:false, range:10, t:performance.now(), dur:420, power:0 });
          // small delay then apply slow
          setTimeout(()=>{
            const distToPlayer = dist(this.x,this.y,player.x,player.y);
            const rng = 260;
            if(distToPlayer <= rng){
              player.applySlow(0.6, 1600 + Math.floor(this.xpValue/2)*200);
              particles.push({ x:player.x, y:player.y, t:performance.now(), dur:900, col:'#d6f2ff' });
            }
          }, 240);
        }
      }
    }
  }

  // new enemy: Commander - periodically buffs nearby hostile enemies
  class Commander extends Enemy {
    constructor(x,y,lvl){
      super(x,y, 120 + lvl*26, 10 + Math.floor(lvl*0.6), 16, 'commander', false, 80 + lvl*10);
      this.auraAcc = 3000 - Math.min(2000, lvl*80);
    }
    update(dt){
      Enemy.prototype.update.call(this, dt);
      this.auraAcc -= dt * (this.attackSlowFactor || 1);
      if(this.auraAcc <= 0){
        this.auraAcc = 3200 + Math.random()*1800;
        // buff nearby hostiles
        const rad = 140;
        for(const e of enemies) if(e.alive && !e.friendly && e !== this && dist(this.x,this.y,e.x,e.y) <= rad){
          e.applyBuff(1.35, 3200 + Math.floor(this.xpValue/3)*400);
        }
        beams.push({ x1:this.x, y1:this.y, aoe:true, range:rad, t:performance.now(), dur:420, power:0 });
        particles.push({ x:this.x, y:this.y, t:performance.now(), dur:900, col:'#ffb86b' });
      }
    }
  }

  class Boss extends Enemy {
    constructor(x,y,lvl){
      super(x,y, 900 + (lvl-5)*200, 0, 42, 'boss', true, 400 + lvl*30);
      this.dashAcc = 3000 - lvl*120;
      this.phase = 0;
    }
    update(dt){
      // boss chases slowly but occasionally performs fast dash
      const px = player.x - this.x, py = player.y - this.y, d=Math.hypot(px,py)||1;
      if(this.dashAcc <= 0){
        this.dashAcc = 2800 + Math.random()*1400;
        // dash towards player with big stun/damage
        const nx = px/d, ny = py/d;
        this.vx += nx * 420;
        this.vy += ny * 420;
        // damage nearby on impact after short delay
        setTimeout(()=>{
          for(const e of enemies) if(e.alive && !e.friendly && dist(this.x,this.y,e.x,e.y) < 120) e.takeDamage(90);
          if(dist(this.x,this.y,player.x,player.y) < 120) player.takeDamage(80, { x: this.x, y: this.y, type: 'boss_dash' });
          particles.push({ x:this.x, y:this.y, t:performance.now(), dur:900, col:'#ff9b6b' });
        }, 300);
      }
  this.dashAcc -= dt * (this.attackSlowFactor || 1);
      Enemy.prototype.applyVelocity.call(this, dt);
      // small passive regen so boss persists
      if(this.hp < this.maxHp && Math.random() < 0.002) this.hp += 6;
      // keep within map
      this.x = clamp(this.x, 0, MAP_W); this.y = clamp(this.y, 0, MAP_H);
    }
  }

  // new boss: Warlord — summons reinforcements and slams the ground
  class Warlord extends Enemy {
    constructor(x,y,lvl){
      super(x,y, 650 + lvl*120, 6, 40, 'warlord', true, 300 + lvl*30);
      this.summonAcc = 4200 - Math.min(2000, lvl*100);
      this.slamAcc = 2800 - Math.min(1500, lvl*80);
    }
    update(dt){
      Enemy.prototype.update.call(this, dt);
  this.summonAcc -= dt * (this.attackSlowFactor || 1); this.slamAcc -= dt * (this.attackSlowFactor || 1);
      if(this.summonAcc <= 0){
        this.summonAcc = 4200 + Math.random()*1800;
        // summon 1-2 brutes near the player to harass
        for(let i=0;i<1+Math.floor(Math.random()*2);i++){
          const s = new Enemy(this.x + randRange(-60,60), this.y + randRange(-60,60), 80 + Math.floor(this.xpValue/3), 28, 14, 'brute', true, 30 + Math.floor(this.xpValue/6));
          enemies.push(s);
        }
        particles.push({ x:this.x, y:this.y, t:performance.now(), dur:800, col:'#ff9b6b' });
      }
      if(this.slamAcc <= 0){
        this.slamAcc = 3200 + Math.random()*1400;
        beams.push({ x1:this.x, y1:this.y, aoe:true, range:160, t:performance.now(), dur:420, power:80 });
        for(const e of enemies) if(e.alive && !e.friendly && dist(this.x,this.y,e.x,e.y) < 160) e.takeDamage(80 + Math.floor(player.level*3));
  if(dist(this.x,this.y,player.x,player.y) < 160) player.takeDamage(70, { x: this.x, y: this.y, type: 'warlord_slam' });
      }
    }
  }

  class Turret extends Enemy {
    constructor(x,y,power,lifeMs){
      super(x,y, 40, 0, 12, 'turret', false, 8);
      this.power=power; this.expireAt=performance.now()+lifeMs; this.shootAcc=0; this.friendly=true;
    }
    update(dt){
      if(performance.now() > this.expireAt){ this.alive=false; return; }
      this.shootAcc -= dt;
      if(this.shootAcc <= 0){
        this.shootAcc = 700;
        let target=null, td=Infinity;
        for(const e of enemies) if(e.alive && !e.friendly && onScreen(e.x,e.y)){ const d=dist(this.x,this.y,e.x,e.y); if(d<td){td=d;target=e;} }
        if(target){
          // turret projectiles are friendly and owned by 'player'
          const dx = target.x - this.x, dy = target.y - this.y, m = Math.hypot(dx,dy)||1;
          projectiles.push(new Projectile(this.x, this.y, dx/m*260, dy/m*260, this.power, 6, 'player', 620));
        }
      }
      Enemy.prototype.applyVelocity.call(this, dt);
    }
  }

  class HomingMine extends Enemy {
    constructor(x,y,power,lifeMs){
      super(x,y, 24, 30, 10, 'mine', false, 10);
      this.power = power; this.expireAt = performance.now()+lifeMs; this.friendly=true;
    }
    update(dt){
      if(performance.now() > this.expireAt){ this.alive=false; return; }
      let target=null, td=Infinity;
      for(const e of enemies) if(e.alive && !e.friendly){ const d=dist(this.x,this.y,e.x,e.y); if(d<td){td=d;target=e;} }
      if(target){
        const dx=target.x-this.x, dy=target.y-this.y, m=Math.hypot(dx,dy)||1;
        this.x += (dx/m) * 80 * dt/1000;
        this.y += (dy/m) * 80 * dt/1000;
        if(dist(this.x,this.y,target.x,target.y) < target.r + this.r + 4){
          // explode with AoE damage and visuals
          const ex = this.x, ey = this.y;
          const radius = 64 + Math.floor(this.power * 2);
          beams.push({ x1:ex, y1:ey, aoe:true, range:radius, t:performance.now(), dur:420, power: Math.round(this.power * 1.4) });
          for(const e of enemies) if(e.alive && !e.friendly && dist(ex,ey,e.x,e.y) <= radius){ e.takeDamage(Math.round(this.power * 1.4)); e.vx = (e.x-ex)/Math.max(1,dist(ex,ey,e.x,e.y))*80; e.vy = (e.y-ey)/Math.max(1,dist(ex,ey,e.x,e.y))*80; }
          if(dist(ex,ey,player.x,player.y) <= radius) player.takeDamage(Math.round(this.power * 1.2), { x: ex, y: ey, type: 'mine_explode' });
          particles.push({ x:ex, y:ey, t:performance.now(), dur:900, col:'#ffb86b' });
          this.alive=false;
        }
      }
      Enemy.prototype.applyVelocity.call(this, dt);
    }
    draw(ctx, cam){
      if(!this.alive) return;
      const x=this.x-cam.x, y=this.y-cam.y;
      ctx.save(); ctx.translate(x,y);
      ctx.fillStyle = this.friendly ? '#6be37b' : '#cc9a2e'; ctx.beginPath(); ctx.arc(0,0,this.r,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }

  class Projectile {
    constructor(x,y,vx,vy,power,r,owner,range=600,opt={}){
      this.x=x; this.y=y; this.vx=vx; this.vy=vy; this.power=power; this.r=r; this.owner=owner; this.range=range;
      this.life = Math.max(200, range / Math.hypot(vx,vy) * 1000);
      this.alive=true; this.trail=[]; this.opt = opt;
    }
    update(dt){
      if(!this.alive) return;
      // allow optional per-projectile onUpdate hook (for homing)
      if(this.opt && typeof this.opt.onUpdate === 'function'){
        try{ this.opt.onUpdate(this, dt); }catch(e){}
      }
      this.x += this.vx * dt/1000; this.y += this.vy * dt/1000;
      // we intentionally avoid storing large world-space trails because they can produce
      // phantom translated streaks when projectiles are spawned/mirrored. Keep a tiny
      // history count (timestamps only) if needed; visual trail is rendered procedurally.
      if(this.trail && this.trail.length > 6) this.trail.shift();
      this.life -= dt;
      if(this.life<=0){
        this.alive=false;
        if(this.opt.onExpire) this.opt.onExpire(this.x, this.y);
      }
      // ensure projectiles have valid owners; sanitize stray projectiles that have unexpected owner
      if(!(this.owner === 'player' || this.owner === 'enemy')){
        // if a projectile has no owner, drop visual-only trace and remove
        this.alive = false; return;
      }
      if(this.owner === 'player'){
        for(const e of enemies) if(e.alive && !e.friendly && dist(this.x,this.y,e.x,e.y) <= e.r + this.r){
          // apply damage and visual/hit callbacks
          e.takeDamage(this.power, { x: this.x, y: this.y, type: 'proj' });
          if(this.opt.onHit) this.opt.onHit(e);
          // siphon: heal player a small fraction on hit
          try{ if(window && window.Day5Game && typeof window.Day5Game.playerRef === 'function'){ const pl = window.Day5Game.playerRef(); if(pl && pl.hasAbility && pl.hasAbility('siphon')) pl.heal(Math.max(1, Math.floor(this.power * 0.12))); } }catch(ex){}
          // knockback from projectile
          const nx = (e.x - this.x) || 1, ny = (e.y - this.y) || 1, m = Math.hypot(nx,ny)||1;
          e.vx = (e.vx||0) + (nx/m) * Math.min(140, this.power*4);
          e.vy = (e.vy||0) + (ny/m) * Math.min(140, this.power*4);
          this.alive=false; break;
        }
      } else if(this.owner === 'enemy'){
        if(dist(this.x,this.y,player.x,player.y) <= player.r + this.r){
          const now = performance.now();
          // reflect behavior when player has reflect active
          if(player && player.reflectUntil && player.reflectUntil > now){
            // flip ownership and reverse velocity so it heads back toward enemies
            this.owner = 'player';
            this.vx = -this.vx; this.vy = -this.vy;
            this.life = Math.max(300, this.range / Math.hypot(this.vx||1,this.vy||1) * 1000);
            // small visual cue
            beams.push({ x1:player.x, y1:player.y, aoe:false, t:now, dur:220, power:0 });
          } else {
            player.takeDamage(this.power, { x: this.x, y: this.y, type: 'enemy_proj' });
            this.alive=false;
          }
        }
      }
    }
    draw(ctx,cam){
      if(!this.alive) return;
      const x=this.x-cam.x, y=this.y-cam.y;
      ctx.save(); ctx.translate(x,y);
      // short procedural trail (avoid replaying stored world points which can create
      // phantom duplicates when projectiles are spawned with translated coordinates)
      const col = this.owner==='player' ? 'rgba(255,216,77,0.9)' : (this.owner === 'enemy' ? 'rgba(240,128,128,0.9)' : 'rgba(187,187,187,0.6)');
      ctx.fillStyle = col;
      // draw a few faint blobs behind the projectile based on velocity
      const speed = Math.hypot(this.vx||0,this.vy||0)||1;
      for(let i=1;i<=3;i++){
        const t = i * 0.02;
        const bx = -this.vx * t, by = -this.vy * t;
        const s = Math.max(1, this.r * (1 - i*0.22));
        ctx.globalAlpha = 0.7 * (1 - i*0.22);
        ctx.beginPath(); ctx.arc(bx, by, s, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // visual by opt type
      if(this.opt.type === 'arrow'){
        ctx.fillStyle = '#c9f2ff'; ctx.beginPath(); ctx.ellipse(0,0,this.r*1.2,this.r*0.6, Math.atan2(this.vy,this.vx),0,Math.PI*2); ctx.fill();
      } else if(this.opt.visual === 'poison'){
        ctx.fillStyle = '#6fbf6b'; ctx.beginPath(); ctx.arc(0,0,this.r,0,Math.PI*2); ctx.fill();
      } else if(this.opt.visual === 'spark'){
        ctx.fillStyle = '#f2f9ff'; ctx.beginPath(); ctx.arc(0,0,this.r,0,Math.PI*2); ctx.fill();
      } else {
        // ensure enemy projectiles look distinct but not generate confusing streaks
        ctx.fillStyle = this.owner==='player' ? '#ffd84d' : (this.owner === 'enemy' ? '#f08080' : '#bbbbbb');
        ctx.beginPath(); ctx.arc(0,0,this.r,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
  }

  class Orb {
    constructor(x,y,amt,type='xp'){ this.x=x; this.y=y; this.amt=amt; this.type=type; this.r=8; this.alive=true; this.float=Math.random()*Math.PI*2; }
    update(dt){
      this.float += dt/300;
      // if visible on screen, slowly attract to player so orbs naturally pull in
      if(player && onScreen(this.x, this.y)){
        const dx = player.x - this.x, dy = player.y - this.y; const m = Math.hypot(dx,dy)||1;
        // attraction strength scales with proximity
        const distToPlayer = m;
        const pull = clamp(1200 / Math.max(60, distToPlayer), 16, 220);
        this.x += (dx/m) * pull * dt/1000;
        this.y += (dy/m) * pull * dt/1000;
      }
    }
    draw(ctx,cam){
      if(!this.alive) return;
      const x=this.x-cam.x, y=this.y-cam.y + Math.sin(this.float)*2;
      ctx.save(); ctx.translate(x,y);
      if(this.type==='xp'){ ctx.fillStyle = '#9be3ff'; ctx.beginPath(); ctx.arc(0,0,this.r,0,Math.PI*2); ctx.fill(); }
      else { ctx.fillStyle = '#9bffb5'; ctx.beginPath(); ctx.rect(-this.r/1.6, -this.r/1.6, this.r*1.6, this.r*1.6); ctx.fill(); }
      ctx.restore();
    }
  }

  // --- spawns: scale by player.level and unlock types by level ---
  function findSpawnPoint(minDist, maxDist){
    const cx = player.x, cy = player.y;
    const maxAttempts = 24;
    for(let i=0;i<maxAttempts;i++){
      const ang = Math.random()*Math.PI*2;
      const rad = randRange(minDist, maxDist);
      const sx = clamp(cx + Math.cos(ang)*rad, 0, MAP_W);
      const sy = clamp(cy + Math.sin(ang)*rad, 0, MAP_H);
      // ensure not inside visible viewport (+margin)
      const margin = 48;
      if(sx < camera.x - margin || sx > camera.x + VIEW_W + margin || sy < camera.y - margin || sy > camera.y + VIEW_H + margin) return {sx, sy};
    }
    // fallback: place just outside viewport
    return { sx: clamp(player.x + (VIEW_W/2 + 80), 0, MAP_W), sy: clamp(player.y + (VIEW_H/2 + 80), 0, MAP_H) };
  }

  function spawnInitialWave(){
    // early game: only 2-3 normal zombies, outside visible area
    const count = 2 + Math.floor(Math.random()*2); // 2 or 3
    const minDist = Math.max(VIEW_W, VIEW_H)/2 + 60;
    const maxDist = minDist + 180;
    for(let i=0;i<count;i++){
      const pt = findSpawnPoint(minDist, maxDist);
      enemies.push(new Enemy(pt.sx, pt.sy, 28 + 1*6, 28 + 1*1.5, 16, 'zombie', true, 14 + 1*2));
    }
  }

  function spawnEnemyWave(dt){
    if(!player) return;
    spawnTimer -= dt;
    if(spawnTimer > 0) return;
    // dynamic cap of enemies based on level
    const lvl = Math.max(1, player.level);
    const maxEnemies = Math.max(3, Math.min(28, 3 + Math.floor(lvl * 1.2)));
    if(enemies.length >= maxEnemies) { spawnTimer = 300; return; }

    // set next timer scaled by level
    spawnTimer = clamp(600 + Math.max(0, 1600 - player.level*60), 180, 3200);

    // early game should remain mild
    if(lvl <= 1){
      // only spawn small zombies occasionally (1 at a time)
      const pt = findSpawnPoint(Math.max(VIEW_W, VIEW_H)/2 + 60, Math.max(VIEW_W, VIEW_H)/2 + 180);
      enemies.push(new Enemy(pt.sx, pt.sy, 28 + lvl*5, 28 + lvl*1.5, 16, 'zombie', true, 14 + lvl*2));
      return;
    }

    // normal spawn group scales with level
    const count = Math.min(1 + Math.floor(1 + lvl/3), 8);
    for(let i=0;i<count && enemies.length < maxEnemies;i++){
      const pt = findSpawnPoint( Math.max(VIEW_W, VIEW_H)/2 + 60, Math.max(VIEW_W, VIEW_H)/2 + 380 );
      const r = Math.random();
  if(lvl >= 10 && Math.random() < 0.02){ enemies.push(new Boss(pt.sx,pt.sy,lvl)); continue; }
  if(lvl >= 12 && Math.random() < 0.01){ enemies.push(new Warlord(pt.sx,pt.sy,lvl)); continue; }
      // new mob spawns
      if(lvl >= 10 && Math.random() < 0.02){ enemies.push(new Commander(pt.sx, pt.sy, lvl)); continue; }
      if(lvl >= 8 && Math.random() < 0.035){ enemies.push(new SlowCaster(pt.sx, pt.sy, lvl)); continue; }
      if(lvl >= 6 && Math.random() < 0.04){ enemies.push(new Necromancer(pt.sx,pt.sy,lvl)); continue; }
      if(lvl >=5 && Math.random() < 0.03){ enemies.push(new Enemy(pt.sx,pt.sy, 120 + lvl*30, 22, 26, 'mini', true, 100 + lvl*10)); continue; }

  // expanded enemy types with level scaling
  if(lvl >= 6 && r < 0.12){ enemies.push(new Skirmisher(pt.sx,pt.sy,lvl)); }
  else if(r < 0.25){ enemies.push(new Sniper(pt.sx,pt.sy,lvl)); }
  else if(r < 0.42){ enemies.push(new Enemy(pt.sx,pt.sy, 30 + lvl*6, 30 + lvl*1.2, 14, 'zombie', true, 12 + lvl*2)); }
  else if(r < 0.58){ enemies.push(new Enemy(pt.sx,pt.sy, 28 + lvl*6, 36, 12, 'skeleton', false, 18 + lvl*3)); }
  else if(r < 0.78){ enemies.push(new Enemy(pt.sx,pt.sy, 60 + lvl*10, 22 + lvl*1.2, 28, 'brute', true, 40 + lvl*6)); }
  else if(r < 0.93){ enemies.push(new Tank(pt.sx,pt.sy,lvl)); }
  else { enemies.push(new Enemy(pt.sx,pt.sy, 24 + lvl*5, 86 + lvl*4, 10, 'demon', true, 18 + lvl*3)); }
    }
  }

  // --- camera centering ---
  function updateCamera(){
    camera.w = VIEW_W; camera.h = VIEW_H;
    let cx = player.x - camera.w/2; let cy = player.y - camera.h/2;
    cx = clamp(cx, 0, MAP_W - camera.w); cy = clamp(cy, 0, MAP_H - camera.h);
    camera.x = cx; camera.y = cy;
  }

  // --- input ---
  window.addEventListener('keydown', e=> { keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', e=> { keys[e.key.toLowerCase()] = false; });

  // space / click bindings: allow player to activate a primary ability with Space or click to fire projectiles
  window.addEventListener('keydown', (e)=>{
    if(e.code === 'Space'){ e.preventDefault();
      if(!player) return;
      // Space triggers ALL abilities bound to 'space'
      const spaceables = player.abilities.filter(a=>{ const d=abilityDefs[a.id]; return d && d.bind === 'space'; });
      let usedAny = false;
      for(const slot of spaceables){ if(player.tryUseAbility(slot.id)) usedAny = true; }
      // fallback: if none bound to space, try dash if available
      if(!usedAny && player.hasAbility('dash_strike')) player.tryUseAbility('dash_strike');
    }
  });

  if(canvas){
    // pointerdown: left-click => projectile (if available) / dash fallback
    // right-click => use a primary active ability (heal, barrier, reflect) if available
    canvas.addEventListener('pointerdown', (ev)=>{
      if(!player) return;
      const rect = canvas.getBoundingClientRect();
      const sx = (ev.clientX - rect.left) * (VIEW_W / rect.width) + camera.x;
      const sy = (ev.clientY - rect.top) * (VIEW_H / rect.height) + camera.y;
      const dx = sx - player.x, dy = sy - player.y; const m = Math.hypot(dx,dy)||1;
      // left click: trigger ALL abilities bound to 'click'
      if(ev.button === 0){
        const clickables = player.abilities.filter(a=>{ const d=abilityDefs[a.id]; return d && d.bind === 'click'; });
        let usedAny = false;
        for(const slot of clickables){ const d = abilityDefs[slot.id]; const ok = player.tryUseAbility(slot.id, dx/m, dy/m); if(ok) usedAny = true; }
        // fallback: if none bound to click, allow firing a default projectile if player has auto:false projectile (legacy)
        if(!usedAny){ if(player.hasAbility('fireball')) player.tryUseAbility('fireball', dx/m, dy/m); }
      } else if(ev.button === 2){
        // right click: try active / space-bound abilities first (treat as quick-use)
        ev.preventDefault();
        const prefer = ['phase_shift','shield'];
        let used = false;
        for(const id of prefer){ if(player.hasAbility(id)) { used = player.tryUseAbility(id); if(used) break; } }
        if(!used){
          // also trigger click-bound projectiles as fallback
          const clickables = player.abilities.filter(a=>{ const d=abilityDefs[a.id]; return d && d.bind === 'click'; });
          for(const slot of clickables) player.tryUseAbility(slot.id, dx/m, dy/m);
        }
      }
    });
    // prevent context menu on right-click inside canvas so right-click can be used for abilities
    canvas.addEventListener('contextmenu', e => { e.preventDefault(); });
  }

  function getMoveDir(){
    let x=0,y=0;
    if(keys['w']||keys['arrowup']||keys['i']) y -= 1;
    if(keys['s']||keys['arrowdown']||keys['k']) y += 1;
    if(keys['a']||keys['arrowleft']||keys['j']) x -= 1;
    if(keys['d']||keys['arrowright']||keys['l']) x += 1;
    const m = Math.hypot(x,y); if(m>0) return {x:x/m,y:y/m}; return null;
  }

  // --- level up UI & choices (no duplicates) ---
  function presentChoices(title, choices, onPick){
    overlayTitle.textContent = title;
    // show up to three main choices in the grid
    choiceArea.innerHTML = ''; choiceArea.style.display = 'grid';
    overlayDesc.style.display = 'none';
    playBtn.style.display = 'none';
    playOverlay.classList.remove('hidden');
    // ensure only the first three choices are shown in the grid
    const main = choices.slice(0,3);
    for(const opt of main){
      const div = document.createElement('div'); div.className='choice-card';
      div.innerHTML = `<h3>${opt.title}</h3><p>${opt.desc}</p><small style="color:#ffd8a8;">${opt.extra||''}</small>`;
      div.addEventListener('click', ()=>{ choiceArea.style.display='none'; const extraEl = document.getElementById('choice-extra'); if(extraEl) extraEl.remove(); overlayDesc.style.display='block'; playOverlay.classList.add('hidden'); onPick(opt); });
      choiceArea.appendChild(div);
    }
    // add a separate small stat/button row below the grid (e.g. +HP)
    const old = document.getElementById('choice-extra'); if(old) old.remove();
    const extra = document.createElement('div'); extra.id = 'choice-extra'; extra.className = 'choice-extra';
    const hb = document.createElement('button'); hb.className = 'hp-boost'; hb.textContent = '+30 ❤';
    hb.title = 'Increase max HP by 30 and heal 30';
    hb.addEventListener('click', ()=>{
      choiceArea.style.display='none'; extra.remove(); overlayDesc.style.display='block'; playOverlay.classList.add('hidden');
      running = true; player.maxHp = (player.maxHp || 100) + 30; player.heal(30); updateHud();
    });
    extra.appendChild(hb);
    const overlayBody = document.getElementById('overlay-body');
    if(overlayBody) overlayBody.appendChild(extra);
  }
  function queueLevelUp(){
    const opts=[];
    const used = new Set();
    const candidates = [];
    // upgrades first
    for(const a of player.abilities) candidates.push({ id:a.id, title:abilityDefs[a.id].title + ' (Upgrade)', desc:abilityDefs[a.id].desc, upgrade:true });
    // new ability candidates
    ABILITIES.forEach(a=> candidates.push({ id:a.id, title:a.title, desc:a.desc }));
    // shuffle
    for(let i=candidates.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [candidates[i], candidates[j]]=[candidates[j], candidates[i]]; }
    for(const c of candidates){
      if(opts.length>=3) break;
      if(used.has(c.id)) continue;
      opts.push({ id:c.id, title:c.title, desc:c.desc, extra: c.upgrade ? 'Upgrade' : (player.hasAbility(c.id) ? 'Upgrade' : 'New ability') });
      used.add(c.id);
    }
    running = false;
    // present three ability choices; +30 HP is shown as a separate button below by presentChoices
    presentChoices('Level Up', opts, (opt)=>{
      player.addAbility(opt.id);
      running = true; updateHud();
    });
  }

  // --- ranged enemy behaviour: skeleton shoots, only on-screen and weaker --- 
  function enemyRangedBehavior(e, dt){
    if(e.type!=='skeleton' || !e.alive) return;
  e.tickAcc = (e.tickAcc||0) - dt * (e.attackSlowFactor || 1);
    if(e.tickAcc <= 0){
      e.tickAcc = 1800 + player.level*90;
      const dx = player.x - e.x, dy = player.y - e.y; const m = Math.hypot(dx,dy)||1;
      if(onScreen(e.x,e.y) && onScreen(player.x,player.y)){
        // limit enemy projectiles
        const enemyProjCount = projectiles.filter(p=>p.owner === 'enemy').length;
        if(enemyProjCount < ENEMY_PROJECTILE_CAP){
          // shorter range / slower for enemy projectiles
          projectiles.push(new Projectile(e.x, e.y, dx/m*160, dy/m*160, Math.max(6, 6 + Math.floor(player.level*0.5)), 5, 'enemy', 420));
        }
      }
    }
  }

  // --- pickups & passive effects ---
  function pickupOrbs(){
    for(const orb of orbs){
      if(!orb.alive) continue;
      if(dist(player.x,player.y,orb.x,orb.y) <= player.r + orb.r + 6){
        orb.alive=false;
        if(orb.type==='xp') player.giveXp(Math.round(orb.amt));
        else if(orb.type==='heal') player.heal(Math.round(orb.amt));
      }
    }
    orbs = orbs.filter(o=>o.alive);
  }

  // --- update & visuals helper ---
  function updateEffects(dt){
    const now = performance.now();
    // blades applying reduced DPS
    for(const b of blades){
      const elapsed = now - b.t;
      if(elapsed > b.dur) continue;
      for(const e of enemies) if(e.alive && !e.friendly){
        const d = dist(player.x,player.y,e.x,e.y);
        if(d <= (b.spins/6)*42){
          // nerfed melee: lower DPS multiplier
          const dmg = b.power * dt/1000 * 8;
          e.takeDamage(dmg);
          // siphon (on-hit heal) — small percent of damage
          if(player && player.hasAbility && player.hasAbility('siphon')){
            player.heal(Math.max(1, Math.floor(dmg * 0.12)));
          }
        }
      }
    }
    blades = blades.filter(b=> now - b.t <= b.dur);

    // passive frost aura: if player has the passive, apply a light continuous slow to nearby enemies
    try{
      if(player && player.hasAbility && player.hasAbility('frost_aura')){
        const lvl = player.abilityLevel('frost_aura');
        const auraRange = 100 + lvl*16;
        for(const e of enemies) if(e.alive && !e.friendly && dist(player.x,player.y,e.x,e.y) <= auraRange){
          // stronger aura: longer slow + slight attack slow
          e.applySlow(0.7, 1400 + lvl*200);
          if(typeof e.applyAttackSlow === 'function') e.applyAttackSlow(0.9, 900 + lvl*120);
          // small icy particles frequently
          if(Math.random() < 0.12) particles.push({ x:e.x + randRange(-6,6), y:e.y + randRange(-6,6), t:performance.now(), dur:900, col:'#cfeeff' });
        }
      }
    }catch(e){}

    beams = beams.filter(b => now - b.t <= (b.dur||220));

    for(const a of anvils){
      if(a.hit) continue;
      a.vy += 1200 * dt/1000;
      a.y += a.vy * dt/1000;
      if(a.y >= a.ty){
        for(const e of enemies) if(e.alive && !e.friendly && dist(a.tx,a.ty,e.x,e.y) < 36) { e.takeDamage(a.power); e.vx=(e.x-a.tx)/Math.max(1,dist(a.tx,a.ty,e.x,e.y))*60; e.vy=(e.y-a.ty)/Math.max(1,dist(a.tx,a.ty,e.x,e.y))*60; }
        a.hit = true;
        particles.push({ x:a.tx, y:a.ty, t:performance.now(), dur:700, col:'#ffb86b' });
      }
    }
    anvils = anvils.filter(a => !a.hit || (now - a.t < 600));

    for(const p of poisonTrails){
      const elapsed = now - p.t;
      if(elapsed > p.dur) continue;
      for(const e of enemies) if(e.alive && !e.friendly && dist(p.x,p.y,e.x,e.y) <= p.r) e.takeDamage(p.power * dt/1000);
    }
    poisonTrails = poisonTrails.filter(p => now - p.t <= p.dur);

    particles = particles.filter(p => performance.now() - p.t <= p.dur);
  }

  function update(dt){
    if(!player || !player.alive) return;
    const dir = getMoveDir();
    if(dir){
      const spdFactor = player.slowFactor || 1;
      player.x += dir.x * player.moveSpeed * spdFactor * dt/1000;
      player.y += dir.y * player.moveSpeed * spdFactor * dt/1000;
      player.x = clamp(player.x, 0, MAP_W);
      player.y = clamp(player.y, 0, MAP_H);
      player.lastDir = dir;
      // no passive trails (deprecated)
    }

    player.tick(dt);

    // passives: (poison_trail and frost_aura removed)

    // directional abilities: DO NOT auto-trigger dash or projectiles; only auto types should run
    for(const a of player.abilities){
      const def = abilityDefs[a.id]; if(!def) continue;
      if(def.type === 'auto'){
        // auto abilities are triggered in player.tick already (triggerAuto)
      }
      // auto-fire abilities that are marked auto (e.g., fireball, multi_arrow, shockwave)
      if(def.auto && a.cd <= 0){
        // need a direction: prefer lastDir (movement) otherwise fallback to right
        const dir = player.lastDir || { x: 1, y: 0 };
        player.tryUseAbility(a.id, dir.x, dir.y);
      }
      // deploy abilities: leave them bound to click (if bind==='click') or auto if desired
      if(def.type === 'deploy' && def.bind !== 'click' && a.cd <= 0){
        // default behavior previously auto-placed turrets/mines — keep only non-click deploy as auto
        if(a.id === 'turret'){
          const nearbyTurret = enemies.find(en=>en.friendly && en.type === 'turret' && dist(en.x,en.y,player.x,player.y) < 180);
          if(!nearbyTurret) player.tryUseAbility(a.id);
        } else if(a.id === 'homing_mine'){
          const nearbyMine = enemies.find(en=>en.friendly && en.type === 'mine' && dist(en.x,en.y,player.x,player.y) < 120);
          if(!nearbyMine) player.tryUseAbility(a.id);
        }
      }
    }

    // update enemies & special behaviors
    for(const e of enemies) if(e.alive){
      if(e.type === 'skeleton') enemyRangedBehavior(e, dt);
      e.update(dt);
    }
    enemies = enemies.filter(e=>e.alive);

    // projectiles
    for(const p of projectiles) p.update(dt);
  // filter projectiles and sanitize any stray ones without owner
  projectiles = projectiles.filter(p=>p.alive && (p.owner === 'player' || p.owner === 'enemy'));

    for(const o of orbs) o.update(dt);

    pickupOrbs();

    spawnEnemyWave(dt);

    updateEffects(dt);

    updateCamera();
    updateHud();
  }

  // --- draw: background tilemap + entities + effects + player health bar ---
  function drawBackground(){
    const tile = 64;
    const camX = camera.x, camY = camera.y;
    ctx.save();
    for(let y = Math.floor(camY/tile)-1; y <= Math.floor((camY+VIEW_H)/tile)+1; y++){
      for(let x = Math.floor(camX/tile)-1; x <= Math.floor((camX+VIEW_W)/tile)+1; x++){
        const px = x*tile - camX, py = y*tile - camY;
        const shade = ((x + y) % 2 === 0) ? '#0b1a1e' : '#081316';
        ctx.fillStyle = shade;
        ctx.fillRect(px, py, tile, tile);
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.strokeRect(px+1, py+1, tile-2, tile-2);
      }
    }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(255,107,53,0.03)';
    ctx.lineWidth = 6;
    ctx.strokeRect(-camX, -camY, MAP_W, MAP_H);
    ctx.restore();
  }

  function draw(){
    ctx.fillStyle = '#041018';
    ctx.fillRect(0,0,VIEW_W,VIEW_H);

    drawBackground();

    for(const o of orbs) o.draw(ctx, camera);

    for(const b of beams){
      const age = performance.now() - b.t; const a = 1 - age/(b.dur||220);
      if(a <= 0) continue;
      ctx.save();
      ctx.globalAlpha = a*0.95;
      // special shock rendering
      if(b.shock){
        ctx.fillStyle = 'rgba(255,240,200,0.10)'; ctx.beginPath(); ctx.arc(b.x1 - camera.x, b.y1 - camera.y, b.range || 80, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,220,160,0.95)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(b.x1 - camera.x, b.y1 - camera.y, (b.range||80)*0.9, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
        continue;
      }
      if(b.shieldRing){
        // soft bluish protective pulse
        ctx.fillStyle = 'rgba(120,200,255,0.12)'; ctx.beginPath(); ctx.arc(b.x1 - camera.x, b.y1 - camera.y, b.range || 110, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = 'rgba(160,220,255,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x1 - camera.x, b.y1 - camera.y, (b.range||110)*0.95, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
        continue;
      }
      if(b.meteor){
        ctx.fillStyle = 'rgba(255,120,60,0.12)'; ctx.beginPath(); ctx.arc(b.x1 - camera.x, b.y1 - camera.y, b.range || 80, 0, Math.PI*2); ctx.fill();
      } else if(b.aoe){
        ctx.fillStyle = 'rgba(120,200,255,0.12)'; ctx.beginPath(); ctx.arc(b.x1 - camera.x, b.y1 - camera.y, b.range || 80, 0, Math.PI*2); ctx.fill();
      } else if(b.cone){
        ctx.fillStyle = 'rgba(255,180,110,0.12)'; ctx.beginPath();
        ctx.moveTo(b.x1-camera.x, b.y1-camera.y);
        const ang = b.angle;
        const r = b.range || 180;
        ctx.arc(b.x1-camera.x, b.y1-camera.y, r, ang - 0.7, ang + 0.7);
        ctx.closePath(); ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(255,220,80,0.95)'; ctx.lineWidth = 3;
        ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(255,200,80,0.6)';
        ctx.beginPath(); ctx.moveTo(b.x1-camera.x, b.y1-camera.y); ctx.lineTo((b.x2||b.tx)-camera.x, (b.y2||b.ty)-camera.y); ctx.stroke();
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
      }
      ctx.restore();
    }

    for(const a of anvils) {
      ctx.save();
      const x = a.x - camera.x, y = a.y - camera.y;
      ctx.translate(x,y);
      ctx.fillStyle = '#5a4c3a';
      ctx.fillRect(-14, -10, 28, 20);
      ctx.restore();
    }

    for(const e of enemies) e.draw(ctx, camera);

    for(const p of projectiles) p.draw(ctx, camera);

    if(player && player.trailPoints && player.trailPoints.length){
      for(let i=0;i<player.trailPoints.length;i++){
        const t = player.trailPoints[i]; const age = performance.now() - t.t;
        const alpha = 1 - (age/1200);
        if(alpha <= 0) continue;
        ctx.save(); ctx.globalAlpha = alpha*0.6; ctx.fillStyle = '#7fbf3f';
        ctx.beginPath(); ctx.arc(t.x - camera.x, t.y - camera.y, 6, 0, Math.PI*2); ctx.fill(); ctx.restore();
      }
    }

    if(player && player.alive){
      const px = player.x - camera.x, py = player.y - camera.y;
      ctx.save(); ctx.translate(px,py);
      ctx.fillStyle = '#7fbfff'; ctx.beginPath(); ctx.arc(0,0,player.r,0,Math.PI*2); ctx.fill();
      if(player.shieldUntil > performance.now()){
        const now = performance.now();
        ctx.strokeStyle = 'rgba(130,200,255,0.6)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0,0,player.r+8,0,Math.PI*2); ctx.stroke();
        // revolving mini-shields while active
        if(player._revolvingShieldUntil && player._revolvingShieldUntil > now){
          const count = 5;
          for(let i=0;i<count;i++){
            const ang = (now/320) + i * (Math.PI*2 / count);
            const rad = player.r + 18;
            const sx = Math.cos(ang) * rad, sy = Math.sin(ang) * rad;
            ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang);
            ctx.globalAlpha = 0.95;
            ctx.fillStyle = 'rgba(170,220,255,0.95)';
            ctx.fillRect(-6, -4, 12, 8);
            ctx.restore();
          }
        }
      }
      const barW = 72; const barH = 8;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-barW/2, -player.r - 22, barW, barH);
      ctx.fillStyle = '#ff6b6b'; ctx.fillRect(-barW/2, -player.r - 22, barW * (player.hp/player.maxHp), barH);
      ctx.strokeStyle = '#00000055'; ctx.lineWidth = 1; ctx.strokeRect(-barW/2, -player.r - 22, barW, barH);
      ctx.restore();
    }

    for(const b of blades){
      const age = performance.now() - b.t; if(age > b.dur) continue;
      const ratio = 1 - age / b.dur;
      const spins = b.spins;
      for(let i=0;i<spins;i++){
        const ang = (performance.now()/300 + i*(Math.PI*2/spins));
        const rad = 28 + i*2;
        const x = player.x - camera.x + Math.cos(ang)*rad;
        const y = player.y - camera.y + Math.sin(ang)*rad;
        ctx.save(); ctx.globalAlpha = 0.9*ratio;
        ctx.fillStyle = '#ffd84d';
        ctx.beginPath(); ctx.ellipse(x,y,6,3,ang,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
    }

    for(const p of particles){
      const age = performance.now()-p.t; const a = 1 - age/p.dur;
      if(a<=0) continue;
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = p.col || '#fff';
      ctx.fillRect(p.x - camera.x - 2, p.y - camera.y - 2, 4, 4); ctx.restore();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(VIEW_W/2-12, VIEW_H/2); ctx.lineTo(VIEW_W/2+12, VIEW_H/2); ctx.moveTo(VIEW_W/2, VIEW_H/2-12); ctx.lineTo(VIEW_W/2, VIEW_H/2+12); ctx.stroke();
  }

  // --- main loop ---
  function loop(ts){
    const dt = Math.min(40, ts - lastTime);
    lastTime = ts;
    const now = performance.now();
    if(deathSlowActive){
      if(now < slowMotionUntil){
        // run the world at half speed for a short replay window
        update(dt * 0.5);
      } else {
        // replay finished — show game over and stop
        deathSlowActive = false;
        running = false;
        gameOverModal.classList.remove('hidden');
      }
    } else {
      if(running) update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  // --- HUD updates ---
  function updateHud(){
    if(!player) return;
    hud.style.display = player.alive ? 'flex' : 'none';
    // show XP instead of health in small HUD (per request)
    hpText.textContent = `XP: ${Math.round(player.xp)} / ${player.nextXp}`;
    xpFill.style.width = `${Math.min(100, Math.floor(player.xp / player.nextXp * 100))}%`;
    lvlText.textContent = player.level;
    // show ability pills with cooldown bars for click/active/deploy/projectile abilities
    if(abilityPills){
      abilityPills.innerHTML = '';
      abilityPills.style.display = 'flex';
  abilityPills.style.fontSize = '0.78rem';
      // do not let HUD block clicks to the canvas
      hud.style.pointerEvents = 'none'; abilityPills.style.pointerEvents = 'none';
      const arr = player.abilities || [];
      // only show abilities that are explicitly bound to click or space
      const visible = arr.filter(slot => { const d = abilityDefs[slot.id]; return d && (d.bind === 'click' || d.bind === 'space'); });
      for(const slot of visible){
        const def = abilityDefs[slot.id];
        if(!def) continue;
        const pill = document.createElement('div'); pill.className = 'ability-pill';
        pill.title = def.desc || '';
        const t = document.createElement('div'); t.style.fontSize = '0.7rem'; t.textContent = def.title; pill.appendChild(t);
        if(def.cooldown && def.cooldown > 0){
          const bar = document.createElement('div');
          bar.style.width = '100%'; bar.style.height = '5px'; bar.style.background = 'rgba(0,0,0,0.25)'; bar.style.borderRadius = '4px'; bar.style.marginTop = '6px'; bar.style.overflow = 'hidden';
          const fill = document.createElement('i');
          const pct = Math.max(0, Math.min(1, (slot.cd || 0) / def.cooldown));
          fill.style.display = 'block'; fill.style.height = '100%';
          fill.style.width = `${Math.round(pct*100)}%`;
          fill.style.background = pct > 0 ? 'linear-gradient(90deg,#ffd84d,#ff6bcb)' : 'linear-gradient(90deg,#6bf2a0,#9be3ff)';
          bar.appendChild(fill);
          pill.appendChild(bar);
          if(pct > 0){ const s = Math.ceil((slot.cd||0)/1000); const tsmall = document.createElement('div'); tsmall.style.fontSize='0.72rem'; tsmall.style.opacity='0.9'; tsmall.style.marginTop='4px'; tsmall.textContent = `${s}s`; pill.appendChild(tsmall); }
        }
        abilityPills.appendChild(pill);
      }
    }
    bigScoreEl.textContent = `Score: ${score}`;
  }

  // --- death / reset ---
  function onPlayerDeath(){
    // trigger a short slow-motion replay so the player can see what happened
    slowMotionUntil = performance.now() + 900;
    deathSlowActive = true;
    // ensure score is prepared for display when slow-motion ends
    finalScoreEl.textContent = score;
  }
  retryBtn.addEventListener('click', ()=>{ gameOverModal.classList.add('hidden'); resetGame(); startGame(); });

  function resetGame(){
    enemies = []; projectiles = []; orbs = []; blades=[]; beams=[]; anvils=[]; particles=[]; poisonTrails=[];
    score = 0; spawnTimer = 0; spawnInterval = 3800;
    player = new Player(MAP_W/2, MAP_H/2);
    player.abilities = [];
    // ensure quick initial spawn and small starting wave
    updateHud();
    updateCamera();
    spawnInitialWave();
    // next full wave delayed a bit
    spawnTimer = 900;
  }

  // starting choice: guaranteed damaging and unique
  function startGame(){
    resetGame();
    const damageCandidates = ABILITIES.filter(a => ['projectile','auto','melee','cone','aura','deploy','aoe','dash'].includes(a.type));
    const pool = damageCandidates.slice();
    const opts = [];
    while(opts.length < 3 && pool.length){
      const idx = Math.floor(Math.random()*pool.length); const a = pool.splice(idx,1)[0];
      opts.push({ id:a.id, title:a.title, desc:a.desc, extra:'Starting ability' });
    }
    presentChoices('Choose starting ability', opts, (opt)=>{ player.addAbility(opt.id); playOverlay.classList.add('hidden'); running=true; updateHud(); });
  }

  // UI wiring + leaderboard save (uses firebase objects exposed on window)
  if(playBtn) playBtn.addEventListener('click', ()=> startGame());

  // --- aspect ratio & fullscreen handling ---
  let prevPlayboundStyles = null;
  function preserveAspectFitToWindow(){
    const ratio = VIEW_W / VIEW_H;
    let ww = window.innerWidth, wh = window.innerHeight;
    let w = ww, h = Math.round(w / ratio);
    if(h > wh){ h = wh; w = Math.round(h * ratio); }
    // set canvas size to keep ratio
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    // center canvas
    if(playbound){
      playbound.style.display = 'flex';
      playbound.style.justifyContent = 'center';
      playbound.style.alignItems = 'center';
    }
  }
  async function toggleFullscreen(){
    try{
      if(!document.fullscreenElement){
        // save previous inline styles so we can restore later
        prevPlayboundStyles = {
          width: playbound.style.width || '',
          height: playbound.style.height || '',
          display: playbound.style.display || '',
          justifyContent: playbound.style.justifyContent || '',
          alignItems: playbound.style.alignItems || '',
        };
        await playbound.requestFullscreen();
        preserveAspectFitToWindow();
      } else {
        await document.exitFullscreen();
        // restore styles
        if(prevPlayboundStyles){
          playbound.style.width = prevPlayboundStyles.width;
          playbound.style.height = prevPlayboundStyles.height;
          playbound.style.display = prevPlayboundStyles.display;
          playbound.style.justifyContent = prevPlayboundStyles.justifyContent;
          playbound.style.alignItems = prevPlayboundStyles.alignItems;
        }
        // revert canvas to fill playbound while keeping aspect (resize helper)
        resizeCanvasToPlaybound();
      }
    }catch(e){}
  }
  if(fullscreenBtn && playbound) fullscreenBtn.addEventListener('click', toggleFullscreen);
  window.addEventListener('fullscreenchange', ()=>{
    // if user toggles with F11 or ESC, ensure aspect preserved or restored
    if(document.fullscreenElement){
      preserveAspectFitToWindow();
    } else {
      if(prevPlayboundStyles){
        playbound.style.width = prevPlayboundStyles.width;
        playbound.style.height = prevPlayboundStyles.height;
        playbound.style.display = prevPlayboundStyles.display;
      }
      // ensure we clear any inline canvas sizing left from fullscreen
      if(canvas){
        canvas.style.width = '';
        canvas.style.height = '';
      }
      // revert canvas to fill playbound while keeping aspect (resize helper)
      resizeCanvasToPlaybound();
    }
  });

  if(dayLeaderboardBtn && dayLeaderboardModal) dayLeaderboardBtn.addEventListener('click', ()=> {
    dayLeaderboardModal.classList.remove('hidden');
    if(window.firebaseReady){
      const db = window.firebaseDb;
      // use day5_scores collection and order by 'score' desc (same pattern as day_3)
      const col = window.firebaseCollection(db, 'day5_scores');
      const q = window.firebaseQuery(col, window.firebaseOrderBy('score', 'desc'));
      window.firebaseGetDocs(q).then(snap => {
        dayLeaderboardBody.innerHTML = '';
        let rank = 1;
        snap.forEach(docSnap => {
          const d = docSnap.data();
          // apply rank classes for top three
          const cls = rank===1 ? 'rank-1' : rank===2 ? 'rank-2' : rank===3 ? 'rank-3' : '';
          const when = d.ts ? new Date(d.ts).toLocaleString() : (d.when ? new Date(d.when).toLocaleString() : '');
          const tr = document.createElement('tr');
          tr.className = cls;
          tr.innerHTML = `<td>${rank++}</td><td>${d.playerName||d.name||'Guest'}</td><td>${d.score}</td><td>${when}</td><td>${d.withinEvent?'Yes':''}</td>`;
          dayLeaderboardBody.appendChild(tr);
        });
      }).catch(()=>{});
    }
  });
  if(dayLeaderboardClose && dayLeaderboardModal) dayLeaderboardClose.addEventListener('click', ()=> dayLeaderboardModal.classList.add('hidden'));

  if(submitScoreBtn){
    // Replace previous submission logic with the same flow from day_3 adapted to day5.
    async function submitScoreToFirestoreDocs(entry){
      try{
        if(!window.firebaseDb || !window.firebaseDoc || !window.firebaseSetDoc) return { ok:false, reason:'no-firebase' };
        const id = entry.uid ? entry.uid : `${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
        const docRef = window.firebaseDoc(window.firebaseDb, 'day5_scores', id);
        if(entry.uid && window.firebaseGetDoc){
          const existing = await window.firebaseGetDoc(docRef);
          if(existing && existing.exists && existing.exists()){
            const data = existing.data();
            if((data.score||0) < entry.score){
              await window.firebaseSetDoc(docRef, entry);
            }
          } else {
            await window.firebaseSetDoc(docRef, entry);
          }
        } else {
          await window.firebaseSetDoc(docRef, entry);
        }

        // update user's aggregated scores in users / scores.day5
        if(entry.uid && window.firebaseGetDoc && window.firebaseSetDoc){
          const userDocRef = window.firebaseDoc(window.firebaseDb, 'users', entry.uid);
          const snap = await window.firebaseGetDoc(userDocRef);
          let docData = {};
          if(snap && snap.exists && snap.exists()) docData = snap.data();
          else docData = { username: entry.playerName, email:'', createdAt:new Date(), scores:{ day1:0,day2:0,day3:0,day4:0,day5:0, total:0 } };
          docData.scores = docData.scores || {};
          docData.scores.day5 = Math.max(docData.scores.day5 || 0, entry.score);
          const s = docData.scores;
          docData.scores.total = (s.day1||0)+(s.day2||0)+(s.day3||0)+(s.day4||0)+(s.day5||0);
          await window.firebaseSetDoc(userDocRef, docData);
        }

        return { ok:true };
      } catch(err){
        console.error('save error', err);
        return { ok:false, reason: err && err.message || 'unknown' };
      }
    }

    async function handleSubmitScore(){
      if(!window.firebaseReady){ submitScoreBtn.textContent='No Firebase'; setTimeout(()=>submitScoreBtn.textContent='Save Score',900); return; }
      submitScoreBtn.disabled = true;
      submitScoreBtn.textContent = 'Saving...';
      try{
        const db = window.firebaseDb;
        const auth = window.firebaseAuth;
        const user = auth && auth.currentUser;
        let uid = user ? user.uid : null;
        let playerName = user ? (user.displayName||user.email||'Player') : 'Guest';
        const entry = { score, playerName, uid, ts: Date.now(), withinEvent: Date.now() <= GAME_END_TS };

        if(!uid){
          if(window.firebaseSignInWithPopup && window.firebaseAuth && window.googleProvider){
            try{
              const res = await window.firebaseSignInWithPopup(window.firebaseAuth, window.googleProvider);
              const u = res.user;
              uid = u.uid;
              playerName = u.displayName || (u.email ? u.email.split('@')[0] : 'User');
              entry.uid = uid; entry.playerName = playerName;
            } catch(e){
              submitScoreBtn.textContent = 'Sign-in failed';
              setTimeout(()=>{ submitScoreBtn.textContent='Save Score'; submitScoreBtn.disabled=false; }, 900);
              return;
            }
          } else {
            submitScoreBtn.textContent = 'Sign-in unavailable';
            setTimeout(()=>{ submitScoreBtn.textContent='Save Score'; submitScoreBtn.disabled=false; }, 900);
            return;
          }
        }

        const r = await submitScoreToFirestoreDocs(entry);
        if(!r.ok){
          submitScoreBtn.textContent = 'Error';
          setTimeout(()=>{ submitScoreBtn.textContent='Save Score'; submitScoreBtn.disabled=false; }, 900);
          return;
        }

        submitScoreBtn.textContent = 'Saved';
        // reset the game and immediately start a new run (per request)
        setTimeout(()=>{ gameOverModal.classList.add('hidden'); submitScoreBtn.textContent='Save Score'; submitScoreBtn.disabled=false; resetGame(); startGame(); }, 700);
      }catch(e){
        submitScoreBtn.textContent = 'Error';
        setTimeout(()=>{ submitScoreBtn.textContent='Save Score'; submitScoreBtn.disabled=false; }, 900);
      }
    }

    submitScoreBtn.addEventListener('click', handleSubmitScore);
  }

  // --- resize / background helpers (keeps aspect ratio inside playbound) ---
  function resizeCanvasToPlaybound(){
    if(!canvas || !playbound) return;
    const rect = playbound.getBoundingClientRect();
    const ratio = VIEW_W / VIEW_H;
    let maxW = rect.width, maxH = rect.height;
    let w = maxW, h = Math.round(w / ratio);
    if(h > maxH){ h = maxH; w = Math.round(h * ratio); }
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }
  window.addEventListener('resize', resizeCanvasToPlaybound);
  resizeCanvasToPlaybound();

  // init background decorations
  function initBackgroundElements(){
    if(!backgroundRoot) return;
    if(backgroundRoot.dataset.initted) return;
    backgroundRoot.dataset.initted = '1';
    for(let i=0;i<18;i++){
      const leaf = document.createElement('div'); leaf.className='leaf';
      leaf.style.left = `${Math.random()*100}%`; leaf.style.top = `${-10 - Math.random()*60}%`; leaf.style.animationDelay = `${Math.random()*10}s`; backgroundRoot.appendChild(leaf);
    }
    for(let i=0;i<8;i++){
      const pk = document.createElement('div'); pk.className='bg-pumpkin';
      pk.style.left = `${Math.random()*100}%`; pk.style.top = `${-20 - Math.random()*60}%`; pk.style.animationDelay = `${Math.random()*12}s`; backgroundRoot.appendChild(pk);
    }
  }
  initBackgroundElements();

  // --- end-game button (kills player) ---
  (function addEndGameButton(){
    const btn = document.createElement('button');
    btn.textContent = 'End Game';
    btn.title = 'Instantly end this run';
    btn.style.cssText = 'position:absolute;right:12px;bottom:12px;z-index:600; padding:6px 8px;border-radius:6px;background:rgba(0,0,0,0.6);color:#ffdca8;border:2px solid #ff6b35;cursor:pointer;';
    btn.addEventListener('click', ()=>{ if(player) player.takeDamage(player.hp + 9999, { x: player.x, y: player.y, type: 'end' }); });
    if(playbound) playbound.appendChild(btn);
  })();

  // expose API
  window.Day5Game = { startGame, resetGame, playerRef: ()=>player, GAME_NAME: 'Midnight Crossing', GAME_END_TS };

  // kickoff
  requestAnimationFrame(loop);
  resetGame();
  updateHud();
})();
