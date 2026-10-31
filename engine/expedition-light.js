import {TILE} from './expedition-world.js';
export function playerLampPosition(player){
 const face=player.face||0;
 return {x:player.x-Math.sin(face)*11,y:player.y+Math.cos(face)*8-60};
}
export function visiblePlayerLightPosition(world,player){const lamp=playerLampPosition(player);return world&&(!world.walkable(lamp.x,lamp.y)||!world.clear(player,lamp))?{x:player.x,y:player.y}:lamp}
export function playerLampActorAnchor(player,lean=0){
 const {x,y}=playerLampPosition(player),dx=x-player.x,dy=y-player.y;
 return {x:(dx*Math.cos(lean)+dy*Math.sin(lean))/2,y:(-dx*Math.sin(lean)+dy*Math.cos(lean))/2};
}
// Grid traversal finds the first wall, rather than projecting each tile into a wedge.
export function castLightRay(world,origin,angle,range){
 const dx=Math.cos(angle),dy=Math.sin(angle);let tx=Math.floor(origin.x/TILE),ty=Math.floor(origin.y/TILE);
 const sx=dx<0?-1:1,sy=dy<0?-1:1,deltaX=Math.abs(TILE/dx),deltaY=Math.abs(TILE/dy);
 let nextX=Math.abs(dx)<1e-9?Infinity:Math.abs(((dx<0?tx:tx+1)*TILE-origin.x)/dx),nextY=Math.abs(dy)<1e-9?Infinity:Math.abs(((dy<0?ty:ty+1)*TILE-origin.y)/dy),d=0;
 while(d<range){if(Math.abs(nextX-nextY)<1e-7&&(!world.walkable((tx+sx)*TILE+32,ty*TILE+32)||!world.walkable(tx*TILE+32,(ty+sy)*TILE+32))){d=nextX;break}if(nextX<nextY){d=nextX;nextX+=deltaX;tx+=sx}else{d=nextY;nextY+=deltaY;ty+=sy}if(!world.walkable(tx*TILE+32,ty*TILE+32))break}
 d=Math.max(0,Math.min(range,d-.25));return {x:origin.x+dx*d,y:origin.y+dy*d};
}
export function lightBoundary(world,p,range,rays=360){return Array.from({length:rays},(_,i)=>castLightRay(world,p,i/rays*Math.PI*2,range))}
// Cast on both sides of tile corners so the visibility polygon never bridges a wall edge.
export function wallLightBoundary(world,p,range){
 const angles=Array.from({length:180},(_,i)=>i/180*Math.PI*2);
 for(let y=Math.floor((p.y-range)/TILE);y<=Math.ceil((p.y+range)/TILE);y++)for(let x=Math.floor((p.x-range)/TILE);x<=Math.ceil((p.x+range)/TILE);x++){
  const dx=x*TILE-p.x,dy=y*TILE-p.y;if(dx*dx+dy*dy>range*range)continue;
  const cells=[world.walkable(x*TILE-1,y*TILE-1),world.walkable(x*TILE+1,y*TILE-1),world.walkable(x*TILE-1,y*TILE+1),world.walkable(x*TILE+1,y*TILE+1)];
  if(cells.every(Boolean)||cells.every(v=>!v))continue;
  const a=Math.atan2(dy,dx);angles.push(a-.00001,a,a+.00001);
 }
 return angles.map(a=>(a+Math.PI*2)%(Math.PI*2)).sort((a,b)=>a-b).map(a=>castLightRay(world,p,a,range));
}
export function createLighting(W,H){
 const mask=document.createElement('canvas');mask.width=W;mask.height=H;const mc=mask.getContext('2d');
 const glow=document.createElement('canvas');glow.width=W;glow.height=H;const gc=glow.getContext('2d');
 function source(world,cam,p,power,face,cone=true){
 const x=p.x-cam.x,y=p.y-cam.y,reach=Math.max(power.radius,power.beamRange);gc.save();
 if(world){const boundary=wallLightBoundary(world,p,reach+10);gc.beginPath();boundary.forEach((v,i)=>i?gc.lineTo(v.x-cam.x,v.y-cam.y):gc.moveTo(v.x-cam.x,v.y-cam.y));gc.closePath();gc.clip()}
 const radial=gc.createRadialGradient(x,y,0,x,y,power.radius);radial.addColorStop(0,`rgba(255,255,255,${power.strength})`);radial.addColorStop(.4,`rgba(255,255,255,${power.strength*.8})`);radial.addColorStop(1,'#ffffff00');gc.fillStyle=radial;gc.fillRect(x-reach,y-reach,reach*2,reach*2);
 if(cone&&power.beamRange>0){gc.translate(x,y);gc.rotate(face);const g=gc.createRadialGradient(0,0,0,0,0,power.beamRange);g.addColorStop(0,`rgba(255,255,255,${power.strength})`);g.addColorStop(.65,`rgba(255,255,255,${power.strength*.55})`);g.addColorStop(1,'#ffffff00');gc.fillStyle=g;gc.beginPath();gc.moveTo(0,0);gc.arc(0,0,power.beamRange,-.52,.52);gc.closePath();gc.fill()}
 gc.restore();
 }
 return {draw(c,world,cam,p,power,sources=[],{playerLight=true,ambient=playerLight?0:.4}={}){gc.clearRect(0,0,W,H);if(playerLight)source(world,cam,visiblePlayerLightPosition(world,p),power,p.face);
 for(const torch of sources){if(torch.x<cam.x-180||torch.x>cam.x+W+180||torch.y<cam.y-180||torch.y>cam.y+H+180)continue;if(world&&!world.clear(p,torch))continue;source(world,cam,(world?visiblePlayerLightPosition(world,{x:torch.x,y:torch.y,face:0}):{x:torch.x,y:torch.y-(torch.r?55:0)}),{radius:torch.r||62,beamRange:0,strength:torch.intensity??(torch.r?.95:.48)},0,false)}
 mc.globalCompositeOperation='source-over';mc.fillStyle=`rgba(1,2,8,${1-Math.max(0,Math.min(1,ambient))})`;mc.fillRect(0,0,W,H);mc.globalCompositeOperation='destination-out';mc.filter='none';mc.drawImage(glow,0,0);mc.filter='none';mc.globalCompositeOperation='source-over';c.drawImage(mask,0,0)} };
}
