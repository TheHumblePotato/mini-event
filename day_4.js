// ...existing code...
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const restartBtn = document.getElementById('restart');

const TILE = 60;
const COLS = 7;
const VISIBLE_ROWS = Math.floor(canvas.height / TILE); // ~12
const START_ROWS = VISIBLE_ROWS + 6;

canvas.width = COLS * TILE;

let rows = []; // array of row objects from bottom (0) upward
let player;
let keys = {};
let running = true;
let score = 0;
let rowsPassed = 0;
let highRowReached = 0; // highest row index the player has reached overall (for scoring)
let tick = 0;

const BASE_POINTS = 10;
const BASE_CAR_SPEED = 1.2;
const BASE_CAR_COUNT = 1;
const ISLAND_PROB = 0.12; // chance a new row is an island

function randRange(a,b){ return a + Math.random()*(b-a); }

function makeRow(indexFromBottom){
    // random row generator with types: 'road', 'grass', 'island'
    let type;
    if (Math.random() < ISLAND_PROB) type = 'island';
    else {
        type = Math.random() < 0.55 ? 'road' : 'grass';
    }
    const level = Math.max(1, Math.floor(rowsPassed / 8) + 1);
    const carCount = type === 'road'
        ? BASE_CAR_COUNT + Math.floor(Math.random()* (1 + level))
        : 0;
    const speed = BASE_CAR_SPEED + level * 0.25 + Math.random() * 0.6;
    const direction = Math.random() < 0.5 ? 1 : -1; // 1 -> right, -1 -> left
    const cars = [];
    if (type === 'road') {
        for (let i=0;i<carCount;i++){
            const w = TILE * (0.8 + Math.random()*0.8); // car width
            const h = TILE * 0.6;
            const x = Math.random() * (canvas.width + 200) - 100;
            const y = 0;
            cars.push({x,w,h,y, speed: speed * (0.7 + Math.random()*0.8), dir: direction});
        }
    }
    return {type, cars, speed, dir: direction, indexFromBottom};
}

function init(){
    rows = [];
    score = 0;
    rowsPassed = 0;
    highRowReached = 0;
    running = true;
    tick = 0;
    // create starting rows
    for (let i=0;i<START_ROWS;i++){
        rows.push(makeRow(i));
    }
    // place player on bottom-middle tile
    player = {
        col: Math.floor(COLS/2),
        row: 0,
        x: Math.floor(COLS/2) * TILE + TILE*0.15,
        y: canvas.height - TILE + TILE*0.1,
        w: TILE*0.7,
        h: TILE*0.8,
        alive: true
    };
    updateHUD();
    restartBtn.hidden = true;
    loop();
}

function updateHUD(){
    scoreEl.textContent = `Score: ${score}`;
    const level = Math.max(1, Math.floor(rowsPassed/8)+1);
    levelEl.textContent = `Level: ${level}`;
}

function worldYForRow(rowIndex){
    // rowIndex 0 = bottom row. We draw rows stacked from bottom.
    const offset = canvas.height - TILE * (rowIndex + 1);
    return offset;
}

function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // draw rows from bottom visible portion upwards
    for (let i=0;i<rows.length;i++){
        const r = rows[i];
        const y = worldYForRow(i);
        // background for row
        if (r.type === 'road'){
            ctx.fillStyle = '#4b4b4b';
            ctx.fillRect(0,y,canvas.width,TILE);
            // lane stripes
            ctx.fillStyle = '#f0d000';
            for (let s=0;s<8;s++){
                const stripeW = 30;
                const gap = 50;
                const x = (s * (stripeW + gap) + ((tick* r.speed * r.dir) % (stripeW+gap)));
                ctx.fillRect((x+canvas.width*10) % canvas.width, y + TILE*0.45, stripeW, 6);
            }
        } else if (r.type === 'island'){
            ctx.fillStyle = '#88e08b';
            ctx.fillRect(0,y,canvas.width,TILE);
            // small palm shapes (simple)
            ctx.fillStyle = '#056d16';
            for (let p=0;p<3;p++){
                const px = 20 + p*140;
                ctx.beginPath();
                ctx.ellipse(px,y+TILE*0.4,10,22, -0.4 + p*0.2, 0, Math.PI*2);
                ctx.fill();
            }
        } else { // grass
            ctx.fillStyle = '#6cc24a';
            ctx.fillRect(0,y,canvas.width,TILE);
        }

        // draw cars
        if (r.type === 'road'){
            for (let c of r.cars){
                const cy = y + (TILE - c.h)/2;
                ctx.fillStyle = '#c22a2a';
                ctx.fillRect(c.x, cy, c.w, c.h);
                // windows
                ctx.fillStyle = '#e6f7ff';
                ctx.fillRect(c.x + c.w*0.12, cy + c.h*0.25, c.w*0.35, c.h*0.25);
            }
        }
    }

    // draw grid lines (optional subtle)
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    for (let c=0;c<=COLS;c++){
        ctx.beginPath();
        ctx.moveTo(c*TILE,0);
        ctx.lineTo(c*TILE,canvas.height);
        ctx.stroke();
    }
    for (let r=0;r<=rows.length;r++){
        ctx.beginPath();
        ctx.moveTo(0, worldYForRow(r));
        ctx.lineTo(canvas.width, worldYForRow(r));
        ctx.stroke();
    }

    // draw player
    const playerScreenY = worldYForRow(player.row) + (TILE - player.h)/2;
    const playerScreenX = player.col * TILE + (TILE - player.w)/2;
    ctx.fillStyle = player.alive ? '#ffd166' : '#a0a0a0';
    ctx.fillRect(playerScreenX, playerScreenY, player.w, player.h);
    // simple face
    ctx.fillStyle = '#4b2e83';
    ctx.fillRect(playerScreenX + player.w*0.18, playerScreenY + player.h*0.25, player.w*0.12, player.h*0.12);
    ctx.fillRect(playerScreenX + player.w*0.6, playerScreenY + player.h*0.25, player.w*0.12, player.h*0.12);
}

function update(dt){
    tick++;
    // update cars
    for (let i=0;i<rows.length;i++){
        const r = rows[i];
        if (r.type !== 'road') continue;
        for (let c of r.cars){
            c.x += c.speed * c.dir * (dt*0.06);
            // wrap around nicely
            if (c.dir > 0 && c.x > canvas.width + 150) c.x = -c.w - Math.random()*80;
            if (c.dir < 0 && c.x < -c.w - 150) c.x = canvas.width + Math.random()*80;
        }
    }

    // collision detection: check cars on player's row
    if (player.alive){
        const prow = rows[player.row];
        if (prow && prow.type === 'road'){
            for (let c of prow.cars){
                const carX = c.x;
                const carY = worldYForRow(player.row) + (TILE - c.h)/2;
                const px = player.col * TILE + (TILE - player.w)/2;
                const py = worldYForRow(player.row) + (TILE - player.h)/2;
                if (rectIntersect(px,py,player.w,player.h, carX, carY, c.w, c.h)){
                    player.alive = false;
                    running = false;
                    restartBtn.hidden = false;
                }
            }
        }
    }

    // if player moved up past highest row reached, award points and generate more rows if needed
    if (player.row > highRowReached){
        // player moved down (shouldn't happen normally), ignore
        highRowReached = player.row;
    }
    if (player.row > rows.length - 3){
        // ensure buffer
        while (rows.length < START_ROWS + rowsPassed + 6){
            rows.push(makeRow(rows.length));
        }
    }

    if (player.row > highRowReached) {
        highRowReached = player.row;
    }

    // scoring: when player moves up relative to previous best (rowsPassed tracks total passed)
    if (player.row > rowsPassed){
        // player progressed to a new row index value (passed another row)
        rowsPassed = player.row;
        const level = Math.max(1, Math.floor(rowsPassed/8)+1);
        const pointsGained = Math.floor(BASE_POINTS * (1 + rowsPassed*0.08) * level);
        score += pointsGained;
        // if we want to increase difficulty more explicitly, modify existing roads near top
        // also when passing rows we can spawn more cars in upcoming roads by simply letting makeRow use rowsPassed
        updateHUD();
    }
}

function rectIntersect(x1,y1,w1,h1,x2,y2,w2,h2){
    return !(x1 + w1 < x2 || x1 > x2 + w2 || y1 + h1 < y2 || y1 > y2 + h2);
}

// input handling
window.addEventListener('keydown', (e)=>{
    if (!player.alive) return;
    if (keys[e.key]) return;
    keys[e.key] = true;
    if (e.key === 'ArrowUp'){
        if (player.row < rows.length - 1){
            player.row += 1;
        } else {
            // extend rows and move
            rows.push(makeRow(rows.length));
            player.row += 1;
        }
    } else if (e.key === 'ArrowDown'){
        if (player.row > 0) player.row -= 1;
    } else if (e.key === 'ArrowLeft'){
        if (player.col > 0) player.col -= 1;
    } else if (e.key === 'ArrowRight'){
        if (player.col < COLS-1) player.col += 1;
    }
    // clamp player position update into screen coordinates
});

window.addEventListener('keyup', (e)=>{
    keys[e.key] = false;
});

// simple game loop
let last = performance.now();
function loop(now){
    const dt = now - last;
    last = now;
    if (running){
        update(dt);
        draw();
        requestAnimationFrame(loop);
    } else {
        draw();
        // show "dead" overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('You Died', canvas.width/2, canvas.height/2 - 20);
        ctx.font = '16px sans-serif';
        ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 6);
    }
}

restartBtn.addEventListener('click', ()=>{
    init();
});

init();
// ...existing code...
