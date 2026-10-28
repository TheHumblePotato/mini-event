import {rollTreasure,rollSupply} from './expedition-treasure.js';
import {rng,clamp,dist,moveCircle} from './physics.js';
export const TILE=64,COLS=80,ROWS=70,WORLD_WIDTH=COLS*TILE,WORLD_HEIGHT=ROWS*TILE;
export const EXPEDITION_ENTRY={x:40*TILE+32,y:64*TILE+32};
export const EXPEDITION_STAND={x:40*TILE+32,y:61*TILE+32};
export const EXPEDITION_HATCH={x:37*TILE+32,y:62*TILE+32};
const layouts=[
 ['Gatehouse Court',32,54,16,13,'yard'],['The Bell Court',29,33,22,15,'yard'],
 ['West Burial Hall',7,36,14,12,'crypt'],['East Mausoleum',59,34,14,14,'crypt'],
 ['The Sunken Chapel',32,8,16,13,'chapel'],['The Ossuary',8,9,15,13,'crypt'],
 ['The Sealed Vault',57,8,16,15,'vault'],['Lower Catacombs',7,53,13,11,'crypt'],
 ['The Withered Garden',59,54,14,12,'yard'],['West Passage',22,25,9,6,'crypt'],
 ['East Passage',50,25,9,6,'crypt']
];
export function createExpedition(seed=1031){
 const random=rng(seed),floor=new Uint8Array(COLS*ROWS),rooms=layouts.map(([name,x,y,w,h,type],id)=>({id,name,x:x*TILE,y:y*TILE,w:w*TILE,h:h*TILE,type,cx:(x+w/2)*TILE,cy:(y+h/2)*TILE})),doors=[];
 function carve(x,y,w,h){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(xx>=0&&xx<COLS&&yy>=0&&yy<ROWS)floor[yy*COLS+xx]=1}
 layouts.forEach(([,x,y,w,h])=>carve(x,y,w,h));
 function passage(ax,ay,bx,by){if(ax===bx)carve(ax-1,Math.min(ay,by),3,Math.abs(by-ay)+1);else carve(Math.min(ax,bx),ay-1,Math.abs(bx-ax)+1,3);doors.push({x:ax*TILE+32,y:ay*TILE+32},{x:bx*TILE+32,y:by*TILE+32})}
 // Loops allow a pursuer to cut you off, and provide genuine alternate escape routes.
 [[40,54,40,47],[20,42,29,42],[50,41,59,41],[40,20,40,33],[15,21,15,36],[22,15,32,15],[47,15,57,15],[65,22,65,34],[14,47,14,53],[65,47,65,54],[19,59,32,59],[47,60,59,60],[15,28,22,28],[15,21,15,28],[26,30,26,38],[26,38,29,38],[54,28,65,28],[54,30,54,38],[50,38,54,38]].forEach(p=>passage(...p));
 for(const room of rooms){if(room.type==='yard')continue;const cx=Math.floor(room.cx/TILE),cy=Math.floor(room.cy/TILE);for(const dx of [-3,3])for(const dy of [-2,2]){const x=cx+dx,y=cy+dy;if(x>room.x/TILE+1&&x<(room.x+room.w)/TILE-1&&y>room.y/TILE+1&&y<(room.y+room.h)/TILE-1)floor[y*COLS+x]=0}}const open=[];for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)if(floor[y*COLS+x])open.push({x:x*TILE+32,y:y*TILE+32});
 let obstacles=[];const blocked=p=>obstacles.some(b=>p.x>b.x-15&&p.x<b.x+b.w+15&&p.y>b.y-15&&p.y<b.y+b.h+15);const walkable=(x,y)=>{const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return tx>=0&&tx<COLS&&ty>=0&&ty<ROWS&&floor[ty*COLS+tx]===1};
 const roomAt=p=>rooms.find(r=>p.x>=r.x&&p.x<r.x+r.w&&p.y>=r.y&&p.y<r.y+r.h);
 function wallBoxes(x,y,range=100){const boxes=[];for(let ty=Math.max(0,Math.floor((y-range)/TILE));ty<=Math.min(ROWS-1,Math.floor((y+range)/TILE));ty++)for(let tx=Math.max(0,Math.floor((x-range)/TILE));tx<=Math.min(COLS-1,Math.floor((x+range)/TILE));tx++)if(!floor[ty*COLS+tx])boxes.push({x:tx*TILE,y:ty*TILE,w:TILE,h:TILE});return boxes}
 function move(body,dx,dy,r=17,props=obstacles){return moveCircle(body,dx,dy,r,[...wallBoxes(body.x,body.y,Math.max(100,Math.hypot(dx,dy)+r+10)),...props.filter(b=>body.x>b.x-120&&body.x<b.x+b.w+120&&body.y>b.y-120&&body.y<b.y+b.h+120)])}
 function clear(a,b){const d=dist(a,b),steps=Math.ceil(d/18);for(let n=1;n<steps;n++)if(!walkable(a.x+(b.x-a.x)*n/steps,a.y+(b.y-a.y)*n/steps)||blocked({x:a.x+(b.x-a.x)*n/steps,y:a.y+(b.y-a.y)*n/steps}))return false;return true}
 function nearestOpen(p){if(walkable(p.x,p.y)&&!blocked(p))return p;let best=open[0],score=Infinity;for(const v of open){if(blocked(v))continue;const d=(v.x-p.x)**2+(v.y-p.y)**2;if(d<score){score=d;best=v}}return {...best}}
 function pathfind(start,goal){const g=nearestOpen(goal),sx=Math.floor(start.x/TILE),sy=Math.floor(start.y/TILE),gx=Math.floor(g.x/TILE),gy=Math.floor(g.y/TILE),sk=sy*COLS+sx,gk=gy*COLS+gx;if(!floor[sk])return[];const heap=[],cost=new Float64Array(COLS*ROWS).fill(Infinity),parent=new Int32Array(COLS*ROWS).fill(-1);cost[sk]=0;
 const push=v=>{heap.push(v);let n=heap.length-1;while(n){const p=(n-1)>>1;if(heap[p].f<=v.f)break;heap[n]=heap[p];n=p}heap[n]=v};
 const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let n=0;while(n*2+1<heap.length){let c=n*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[n]=heap[c];n=c}heap[n]=last}return first};push({k:sk,f:0,g:0});let found=false;
 while(heap.length){const cur=pop();if(cur.g!==cost[cur.k])continue;if(cur.k===gk){found=true;break}const x=cur.k%COLS,y=Math.floor(cur.k/COLS);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,nk=ny*COLS+nx;if(nx<0||ny<0||nx>=COLS||ny>=ROWS||!floor[nk]||blocked({x:nx*TILE+32,y:ny*TILE+32}))continue;const next=cur.g+1;if(next<cost[nk]){cost[nk]=next;parent[nk]=cur.k;push({k:nk,g:next,f:next+Math.abs(nx-gx)+Math.abs(ny-gy)})}}}
 if(!found)return[];const result=[];let k=gk;while(k!==sk&&k!==-1){result.unshift({x:k%COLS*TILE+32,y:Math.floor(k/COLS)*TILE+32});k=parent[k]}return result;
 }
 let nextCacheId=0;
 function spawnCache(player=EXPEDITION_ENTRY){
 const active=caches.filter(c=>!c.collected),spots=open.filter(v=>{const r=roomAt(v);return r&&r.id!==0&&dist(v,player)>300&&!blocked(v)&&active.every(c=>dist(c,v)>180)&&[-32,32].every(dx=>[-32,32].every(dy=>walkable(v.x+dx,v.y+dy)))});
 if(!spots.length)return null;const spot=spots[Math.floor(random()*spots.length)],id=nextCacheId++,roll=random(),treasure=rollTreasure(random);
 const cache={id,x:spot.x,y:spot.y,room:roomAt(spot).name,type:random()<.7?'buried':random()<.65?'coffin':'relic',supply:rollSupply(roll),treasure:treasure.id,value:treasure.value+Math.floor(random()*25),collected:false,hits:0,opened:false,opening:0};caches.push(cache);return cache;
 }
 const caches=[];const count=5+Math.floor(random()*6);for(let i=0;i<count;i++)spawnCache();
 function restoreCaches(saved){caches.splice(0,caches.length,...saved);nextCacheId=Math.max(0,...saved.map(c=>c.id+1))}

 return {seed,floor,rooms,doors,open,caches,spawnCache,restoreCaches,setObstacles:boxes=>{obstacles=boxes},walkable,roomAt,wallBoxes,move,clear,nearestOpen,pathfind,width:WORLD_WIDTH,height:WORLD_HEIGHT};
}
export function nearestTreasure(caches,p){let best=null,d=Infinity;for(const c of caches){if(c.collected)continue;const next=dist(c,p);if(next<d){d=next;best=c}}return best}
export function interceptionTarget(world,enemy,player,velocity){const speed=Math.hypot(velocity.x,velocity.y);if(speed<25)return {...player};const direction={x:velocity.x/speed,y:velocity.y/speed},ahead=world.nearestOpen({x:player.x+direction.x*360,y:player.y+direction.y*360});let target=ahead,best=-Infinity;for(const door of world.doors){const d=dist(door,player);if(d<100||d>800)continue;const forward=((door.x-player.x)*direction.x+(door.y-player.y)*direction.y)/d;if(forward<.15)continue;const score=forward*350-dist(door,enemy)*.18-d*.08;if(score>best){best=score;target=door}}return {...target}}
