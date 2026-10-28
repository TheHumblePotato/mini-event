import {dist,clamp,rng} from './physics.js';
import {interceptionTarget,EXPEDITION_ENTRY} from './expedition-world.js';
export const isGhost=e=>e.type==='hunter'||e.type==='interceptor';
export const ENEMY_HELP={hunter:'Light stops ghosts briefly. When they turn red, break sight or use a flare.',interceptor:'It heads for junctions ahead of you. Use the beam briefly, then take another passage.',zombie:'Zombies ignore light. Walk around them, break sight, or use a flare.',bellringer:'Break sight before the bell rings. Its alarm draws nearby enemies.',mimic:'The soil was breathing. Back away before the grave opens!',gravebound:'Step sideways when its eyes flash. Bait its charge into stone to stun it.'};
export function createThreats(world,seed=71){
 const random=rng(seed),enemies=[];let serial=0;
 function make(type,p){return {id:++serial,type,x:p.x,y:p.y,face:0,step:0,age:0,life:type==='hunter'?38:type==='interceptor'?48:Infinity,alpha:isGhost({type})?0:1,state:'patrol',target:{...p},memory:0,path:[],pathTimer:0,stun:0,patrolTimer:0,attack:0,cooldown:0,lastVelocity:{x:0,y:0}}}
 const remote=world.open.filter(v=>dist(v,EXPEDITION_ENTRY)>1500&&dist(v,world.caches[0])>500&&world.roomAt(v)?.id!==1);for(let n=0;n<2;n++)enemies.push(make('zombie',remote[Math.floor(random()*remote.length)]));
 function spawn(player,type,budget=3){type=type||(random()>.5?'hunter':'interceptor');if(!['hunter','interceptor','zombie','gravebound','bellringer','mimic'].includes(type))return null;if(isGhost({type})&&enemies.filter(e=>isGhost(e)&&e.age<e.life).length>=budget)return null;const spots=world.open.filter(v=>dist(v,player)>(isGhost({type})?360:550)&&dist(v,player)<950&&dist(v,EXPEDITION_ENTRY)>400);if(!spots.length)return null;const e=make(type,spots[Math.floor(random()*spots.length)]);e.target={...player};e.memory=0;enemies.push(e);return e}
 function update(dt,player,{lit=true,beamRange=440,sprinting=false,noise=null,velocity={x:0,y:0},wards=[]}={}){
 const hits=[];const alarms=[];
 for(const e of enemies){
  e.step??=0;e.attack??=0;e.beamHold??=0;e.surge=Math.max(0,(e.surge||0)-dt);e.cooldown=Math.max(0,(e.cooldown||0)-dt);e.age+=dt;e.stun=Math.max(0,e.stun-dt);if(e.age>e.life)continue;
  const ghost=isGhost(e),d=dist(e,player),clear=world.clear(e,player),inBeam=lit&&Math.cos(Math.atan2(e.y-player.y,e.x-player.x)-player.face)>Math.cos(.52)&&d<beamRange&&clear;
  e.alpha=ghost?clamp(e.age/1.5,0,1)*clamp((e.life-e.age)/5,0,1):1;
  if(e.type==='mimic'&&e.state==='buried')continue;
  const ward=wards.find(w=>w.life>0&&dist(e,w)<w.r);
  if(ward){e.stun=Math.max(e.stun,.3);e.state='stunned';e.attack=0;e.charge=null;e.surge=0;e.beamHold=0;if(ghost&&!e.warded){e.life=Math.max(e.age+5,e.life-13);e.warded=true}}
  if(ghost&&inBeam&&!ward&&e.surge===0){e.beamHold+=dt;e.state='held';e.stun=Math.max(e.stun,.12);e.attack=0;if(e.beamHold>=2.2){e.surge=4.1;e.stun=.7;e.state='resisting';e.beamHold=0}}else if(!inBeam)e.beamHold=Math.max(0,e.beamHold-dt*.35);
  if(dist(e,EXPEDITION_ENTRY)<140&&ghost){e.life=Math.min(e.life,e.age+2);e.stun=2}
  if(ghost&&e.state==='held'&&!inBeam)e.state='search';
  if(e.stun>0||ghost&&e.age<1.5)continue;
  if(e.type==='mimic'&&e.state==='buried')continue;
  if(e.type==='mimic'&&e.state==='awakening'){e.wake=(e.wake||0)-dt;if(e.wake>0)continue;e.state='chase';e.lastKnown={...player};e.memory=7}
  if(e.type==='bellringer'){
   e.bellCooldown=Math.max(0,(e.bellCooldown||0)-dt);
   if(clear&&d<510&&e.bellCooldown===0){e.ringing=(e.ringing||0)+dt;e.state='ringing';if(e.ringing>=2.2){alarms.push({x:player.x,y:player.y,source:{x:e.x,y:e.y}});e.ringing=0;e.bellCooldown=8;e.state='watch'}}else{e.ringing=0;e.state='watch'}
   continue;
  }
  // A charge commits to its warning line. It cannot steer after the windup.
  if(e.type==='gravebound'&&e.charge){
   e.charge.windup-=dt;e.state=e.charge.windup>0?'winding':'charging';
   if(e.charge.windup<=0){const ox=e.x,oy=e.y;world.move(e,e.charge.dx*410*dt,e.charge.dy*410*dt,21);e.step+=dist(e,{x:ox,y:oy})/13;e.charge.remaining-=dt;
    if(Math.hypot(e.x-ox-e.charge.dx*410*dt,e.y-oy-e.charge.dy*410*dt)>Math.max(.1,410*dt*.12)){e.stun=2.6;e.state='stunned';e.charge=null;e.cooldown=3}
    else if(dist(e,player)<45){hits.push({enemy:e,damage:30});e.charge=null;e.stun=.8;e.cooldown=3}
    else if(e.charge.remaining<=0){e.charge=null;e.stun=.8;e.cooldown=3}
   }continue;
  }
  const hearing=e.type==='interceptor'?1450:850;
  const heardNoise=noise&&dist(e,noise)<hearing,heardSprint=sprinting&&d<300;
  const sight=clear&&d<(lit?450:130);
  if(sight||heardSprint){e.memory=e.type==='zombie'?3:7;e.lastKnown={x:player.x,y:player.y};e.state=e.type==='interceptor'?'intercept':'chase';e.target=e.type==='interceptor'&&d>180?interceptionTarget(world,e,player,velocity):{...player}}
  else if(heardNoise){e.memory=5;e.target={x:noise.x,y:noise.y};e.lastKnown={...e.target};e.state='investigate'}
  else if(e.memory>0){e.memory-=dt;e.state='search';if(e.lastKnown)e.target={...e.lastKnown}}
  else{e.state='patrol';e.patrolTimer-=dt;if(e.patrolTimer<0||dist(e,e.target)<35){const local=world.open.filter(v=>dist(v,e)<450);e.target={...(local[Math.floor(random()*local.length)]||world.nearestOpen(e))};e.patrolTimer=4+random()*5}}
  if(e.type==='zombie'&&d>650&&e.age>(e.alertedUntil||0)){e.memory=0;e.state='patrol'}
  if(e.type==='gravebound'&&clear&&d>110&&d<400&&e.cooldown===0){e.charge={dx:(player.x-e.x)/d,dy:(player.y-e.y)/d,windup:1.05,remaining:1.15};e.face=Math.atan2(e.charge.dy,e.charge.dx);e.state='winding';continue}
  if(d<65&&clear&&e.cooldown===0){e.attack+=dt;e.state='attacking';if(e.attack>=.65){if(d<70)hits.push({enemy:e,damage:e.type==='zombie'?16:27});e.attack=0;e.cooldown=1.5}continue}else e.attack=0;
  e.pathTimer-=dt;const direct=world.clear(e,e.target);if(!direct&&e.pathTimer<=0){e.path=world.pathfind(e,e.target);e.pathTimer=e.type==='interceptor'?.7:1.1}let target=direct?e.target:e.path[0];if(!target)continue;if(dist(e,target)<22&&e.path.length){e.path.shift();target=e.path[0]||e.target}
  const length=dist(e,target)||1,engaged=e.state!=='patrol',speed=e.type==='zombie'?(engaged?105:65):e.surge>0?235:e.type==='hunter'?(engaged?190:130):e.type==='interceptor'?180:e.type==='mimic'?170:85;
  const ox=e.x,oy=e.y;e.face=Math.atan2(target.y-e.y,target.x-e.x);world.move(e,(target.x-e.x)/length*speed*dt,(target.y-e.y)/length*speed*dt,e.type==='gravebound'?21:e.type==='zombie'?19:14);e.step+=dist(e,{x:ox,y:oy})/14;
 }
 for(const alarm of alarms)for(const e of enemies)if(e.type!=='bellringer'&&!['buried','awakening'].includes(e.state)&&dist(e,alarm)<1500){e.lastKnown={x:alarm.x,y:alarm.y};e.target={...e.lastKnown};e.memory=10;e.alertedUntil=e.age+10;e.state='investigate'}
 for(let n=enemies.length-1;n>=0;n--)if(enemies[n].age>enemies[n].life)enemies.splice(n,1);hits.alarms=alarms;return hits;
 }
 return {enemies,spawn,update,plantMimic(cache){if(enemies.some(e=>e.cacheId===cache.id))return null;const e=make('mimic',cache);e.state='buried';e.cacheId=cache.id;e.life=Infinity;e.alpha=1;enemies.push(e);return e}};
}
