import {TILE,COLS,ROWS,EXPEDITION_ENTRY,nearestTreasure} from './expedition-world.js';
export function drawExpeditionMap(c,world,p,caches,visited,visitedTiles,enemies,mode,route,power={radius:300,beamRange:440,strength:1}){
 const scale=.106,ox=306,oy=126,pt=v=>({x:ox+v.x*scale,y:oy+v.y*scale});
 const text=(s,x,y,size=12,color='#c7bfae',align='left')=>{c.font=`${size}px "DM Sans",sans-serif`;c.textAlign=align;c.fillStyle=color;c.fillText(s,x,y)};
 c.fillStyle='#0b101bf7';c.fillRect(130,55,1020,620);c.strokeStyle='#756c59';c.strokeRect(130,55,1020,620);
 text('CEMETERY SURVEY',165,91,20);text('M / ESC · CLOSE    C · SWITCH DESTINATION',1115,91,12,'#c7bfae','right');
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const k=y*COLS+x;if(!world.floor[k])continue;c.fillStyle=visitedTiles.has(k)?'#656b73':'#29313f';c.fillRect(ox+x*TILE*scale,oy+y*TILE*scale,TILE*scale+.3,TILE*scale+.3)}
 for(const r of world.rooms){c.strokeStyle=r.type==='yard'?'#748162':'#7a7584';c.strokeRect(ox+r.x*scale,oy+r.y*scale,r.w*scale,r.h*scale);const v=pt({x:r.cx,y:r.cy});text(r.name.replace('The ',''),v.x,oy+(r.y+110)*scale,12,visited.has(r.id)?'#eee0c4':'#9b9eaa','center')}
 const dot=(v,color,r)=>{const q=pt(v);c.fillStyle=color;c.beginPath();c.arc(q.x,q.y,r,0,7);c.fill()};
 for(const door of world.doors)dot(door,'#a19a7944',2);
 c.strokeStyle='#d7b56b';c.lineWidth=2;c.setLineDash([4,4]);c.beginPath();const pos=pt(p);c.moveTo(pos.x,pos.y);for(const v of route){const q=pt(v);c.lineTo(q.x,q.y)}c.stroke();c.setLineDash([]);
 for(const cache of caches){if(cache.collected)continue;const v=pt(cache);c.fillStyle='#e7bc65';c.fillRect(v.x-3,v.y-3,6,6)}
 for(const e of enemies)if(e.alpha>.3&&power.strength>.2&&(Math.hypot(e.x-p.x,e.y-p.y)<power.radius*.7||(Math.cos(Math.atan2(e.y-p.y,e.x-p.x)-p.face)>Math.cos(.52)&&Math.hypot(e.x-p.x,e.y-p.y)<power.beamRange*.85))&&world.clear(p,e))dot(e,'#ca7177',3);
 const gate=pt(EXPEDITION_ENTRY);c.strokeStyle='#b6cf9d';c.lineWidth=2;c.strokeRect(gate.x-5,gate.y-5,10,10);text('EXIT',gate.x+10,gate.y+4,10,'#b6cf9d');
 dot(p,'#e4eced',5);c.save();c.translate(pos.x,pos.y);c.rotate(p.face);c.strokeStyle='#f1f6ed';c.beginPath();c.moveTo(3,-4);c.lineTo(13,0);c.lineTo(3,4);c.stroke();c.restore();
 text('N ↑',640,116,12,'#d7caaa','center');
 const target=mode==='exit'?EXPEDITION_ENTRY:nearestTreasure(caches,p);text(mode==='exit'?'ROUTE TO EXIT':'ROUTE TO NEAREST CACHE',165,620,12,'#e7bc65');text(target?Math.round(route.length*TILE/32)+' m by passage':'',165,641,11);
 text('Gold square · cache   /   Green gate · exit   /   Red · visible enemy',1115,620,11,'#d2c4ad','right');text('Pale floor · explored   /   Dark floor · unvisited   /   Dashed line · walkable route',1115,641,11,'#9eacb6','right');
}
