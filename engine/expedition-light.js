import {TILE} from './expedition-world.js';
export function playerLampPosition(player){
 const face=player.face||0;
 return {x:player.x-Math.sin(face)*11,y:player.y+Math.cos(face)*8-60};
}
export function playerLampActorAnchor(player,lean=0){
 const {x,y}=playerLampPosition(player),dx=x-player.x,dy=y-player.y;
 return {x:(dx*Math.cos(lean)+dy*Math.sin(lean))/2,y:(-dx*Math.sin(lean)+dy*Math.cos(lean))/2};
}
// Grid traversal finds the first wall, rather than projecting each tile into a wedge.
export function castLightRay(world,origin,angle,range){
 const dx=Math.cos(angle),dy=Math.sin(angle);let tx=Math.floor(origin.x/TILE),ty=Math.floor(origin.y/TILE);
 const sx=dx<0?-1:1,sy=dy<0?-1:1,deltaX=Math.abs(TILE/dx),deltaY=Math.abs(TILE/dy);
 let nextX=Math.abs(dx)<1e-9?Infinity:Math.abs(((dx<0?tx:tx+1)*TILE-origin.x)/dx),nextY=Math.abs(dy)<1e-9?Infinity:Math.abs(((dy<0?ty:ty+1)*TILE-origin.y)/dy),d=0;
 while(d<range){if(nextX<nextY){d=nextX;nextX+=deltaX;tx+=sx}else{d=nextY;nextY+=deltaY;ty+=sy}if(!world.walkable(tx*TILE+32,ty*TILE+32))break}
 d=Math.min(range,d+5);return {x:origin.x+dx*d,y:origin.y+dy*d};
}
export function lightBoundary(world,p,range,rays=360){return Array.from({length:rays},(_,i)=>castLightRay(world,p,i/rays*Math.PI*2,range))}
export function createLighting(W,H){
 const mask=document.createElement('canvas');mask.width=W;mask.height=H;const mc=mask.getContext('2d');
 const glow=document.createElement('canvas');glow.width=W;glow.height=H;const gc=glow.getContext('2d');
 function source(world,cam,p,power,face,cone=true){
 const x=p.x-cam.x,y=p.y-cam.y,reach=Math.max(power.radius,power.beamRange);gc.save();
 if(world){const boundary=lightBoundary(world,p,reach+10,360);gc.beginPath();boundary.forEach((v,i)=>i?gc.lineTo(v.x-cam.x,v.y-cam.y):gc.moveTo(v.x-cam.x,v.y-cam.y));gc.closePath();gc.clip()}
 const radial=gc.createRadialGradient(x,y,0,x,y,power.radius);radial.addColorStop(0,`rgba(255,255,255,${power.strength})`);radial.addColorStop(.4,`rgba(255,255,255,${power.strength*.8})`);radial.addColorStop(1,'#ffffff00');gc.fillStyle=radial;gc.fillRect(x-reach,y-reach,reach*2,reach*2);
 if(cone&&power.beamRange>0){gc.translate(x,y);gc.rotate(face);const g=gc.createRadialGradient(0,0,0,0,0,power.beamRange);g.addColorStop(0,`rgba(255,255,255,${power.strength})`);g.addColorStop(.65,`rgba(255,255,255,${power.strength*.55})`);g.addColorStop(1,'#ffffff00');gc.fillStyle=g;gc.beginPath();gc.moveTo(0,0);gc.arc(0,0,power.beamRange,-.52,.52);gc.closePath();gc.fill()}
 gc.restore();
 }
 return {draw(c,world,cam,p,power,sources=[]){gc.clearRect(0,0,W,H);source(world,cam,playerLampPosition(p),power,p.face);
 for(const torch of sources){if(torch.x<cam.x-180||torch.x>cam.x+W+180||torch.y<cam.y-180||torch.y>cam.y+H+180)continue;if(world&&!world.clear(p,torch))continue;source(world,cam,{x:torch.x,y:torch.y-(torch.r?55:0)},{radius:torch.r||62,beamRange:0,strength:torch.r?.95:.48},0,false)}
 mc.globalCompositeOperation='source-over';mc.fillStyle='#010208';mc.fillRect(0,0,W,H);mc.globalCompositeOperation='destination-out';mc.filter='blur(2px)';mc.drawImage(glow,0,0);mc.filter='none';mc.globalCompositeOperation='source-over';c.drawImage(mask,0,0)} };
}
