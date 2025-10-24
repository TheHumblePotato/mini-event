
/* Minimal Halloween Crossy Road — Phaser 3, single file game logic */
(() => {
  const W = 480, H = 720;
  const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: W,
    height: H,
    backgroundColor: 0x14081a,
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: { preload, create, update }
  };
  const game = new Phaser.Game(config);

  function preload() {
    // no external assets; create textures in create()
  }

  function create() {
    const s = this;
    // UI overlay (outside canvas)
    const ui = document.createElement('div'); ui.className = 'ui';
    ui.innerHTML = `<div class="score">Score: <span id="score">0</span></div>`;
    document.body.appendChild(ui);
    const inst = document.createElement('div'); inst.className='instructions';
    inst.textContent = 'Arrows / WASD or tap to move. Reach the top to score.';
    document.body.appendChild(inst);
    const footer = document.createElement('div'); footer.className='footer';
    footer.textContent = 'Day 4 — Halloween MiniGame';
    document.body.appendChild(footer);

    // generate simple sprites
    const g = s.add.graphics();
    // pumpkin player
    g.fillStyle(0xff8c00,1); g.fillCircle(24,24,20);
    g.fillStyle(0x000000,0.2); g.fillCircle(18,22,3);
    g.generateTexture('pumpkin',48,48); g.clear();
    // car textures
    g.fillStyle(0xccccff,1); g.fillRoundedRect(0,0,64,32,6); g.generateTexture('car1',64,32); g.clear();
    g.fillStyle(0x99ffcc,1); g.fillRoundedRect(0,0,64,32,6); g.generateTexture('car2',64,32); g.clear();
    // lane decorations (grave)
    g.fillStyle(0x444444,1); g.fillRect(0,0,20,28); g.generateTexture('grave',20,28); g.clear();

    // player
    s.player = s.physics.add.sprite(W/2, H-56, 'pumpkin').setDepth(3).setCollideWorldBounds(true);
    s.player.setSize(30,30);
    // grid and movement
    s.grid = { xStep: 80, yStep: 80 };
    s.moveLock = false;
    s.moveTo = (dx,dy) => {
      if (s.moveLock) return;
      const tx = Phaser.Math.Clamp(s.player.x + dx*s.grid.xStep, 40, W-40);
      const ty = Phaser.Math.Clamp(s.player.y + dy*s.grid.yStep, 40, H-40);
      if (tx === s.player.x && ty === s.player.y) return;
      s.moveLock = true;
      s.tweens.add({ targets: s.player, x: tx, y: ty, ease:'Quad.easeOut', duration:120, onComplete:()=> s.moveLock=false });
    };

    // lanes
    s.lanesY = [560,500,440,380,320,260];
    s.cars = s.physics.add.group();
    s.carSpeed = 140;
    s.spawnInterval = 900;
    s.time.addEvent({ delay: s.spawnInterval, loop:true, callback: spawnCar, callbackScope: s });

    // spawn some graves for visuals
    s.lanesY.forEach(y => {
      const gcount = 3;
      for (let i=0;i<gcount;i++){
        const gx = 40 + i*(W-80)/(gcount-1);
        s.add.image(gx, y+18, 'grave').setAlpha(0.9).setDepth(0.5).setScale(0.9);
      }
    });

    // collisions
    s.physics.add.overlap(s.player, s.cars, playerHit, null, s);

    // input: keyboard and pointer
    s.cursors = s.input.keyboard.createCursorKeys();
    s.keys = s.input.keyboard.addKeys({ W:Phaser.Input.Keyboard.KeyCodes.W, A:Phaser.Input.Keyboard.KeyCodes.A, S:Phaser.Input.Keyboard.KeyCodes.S, D:Phaser.Input.Keyboard.KeyCodes.D });
    s.input.on('pointerup', ptr => {
      const dx = ptr.x - s.player.x, dy = ptr.y - s.player.y;
      if (Math.abs(dx) > Math.abs(dy)) s.moveTo(dx>0?1:-1,0); else s.moveTo(0, dy>0?1:-1);
    });

    // score & reset
    s.score = 0;
    s.updateScore = () => { document.getElementById('score').textContent = String(s.score); };

    // difficulty ramp
    s.time.addEvent({ delay: 8000, loop:true, callback: ()=>{ s.carSpeed += 18; s.spawnInterval = Math.max(360, s.spawnInterval-60); }, callbackScope: s });

    function spawnCar() {
      const lane = Phaser.Math.RND.pick(s.lanesY);
      const dir = Phaser.Math.Between(0,1) ? 1 : -1;
      const x = dir === 1 ? -80 : W+80;
      const tex = Phaser.Math.Between(0,1)?'car1':'car2';
      const car = s.cars.create(x, lane, tex).setImmovable(true).setDepth(1);
      car.body.allowGravity = false;
      const v = s.carSpeed + Phaser.Math.Between(-40,40);
      car.setVelocityX(v*dir);
      car.setScale(1);
      car.checkWorldBounds = true;
    }

    function playerHit(player, car) {
      s.cameras.main.shake(160, 0.01);
      s.score = Math.max(0, s.score - 1);
      s.updateScore();
      // reset
      s.player.x = W/2; s.player.y = H-56;
    }
  }

  function update(time, dt) {
    const s = this;
    // keyboard single press movement
    if (Phaser.Input.Keyboard.JustDown(s.cursors.left) || Phaser.Input.Keyboard.JustDown(s.keys.A)) s.moveTo(-1,0);
    if (Phaser.Input.Keyboard.JustDown(s.cursors.right) || Phaser.Input.Keyboard.JustDown(s.keys.D)) s.moveTo(1,0);
    if (Phaser.Input.Keyboard.JustDown(s.cursors.up) || Phaser.Input.Keyboard.JustDown(s.keys.W)) s.moveTo(0,-1);
    if (Phaser.Input.Keyboard.JustDown(s.cursors.down) || Phaser.Input.Keyboard.JustDown(s.keys.S)) s.moveTo(0,1);

    // remove off-screen cars
    if (s && s.cars) {
      s.cars.getChildren().forEach(c => {
        if (c.x < -120 || c.x > W+120) c.destroy();
      });
    }

    // reached top?
    if (s && s.player && s.player.y < 80) {
      s.score += 1; s.updateScore();
      // give small celebratory tween and reset
      s.tweens.add({ targets: s.player, y: H-56, duration: 300, ease: 'Power2' });
    }
  }
})();
