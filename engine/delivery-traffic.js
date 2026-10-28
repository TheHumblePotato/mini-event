import {makeTrafficCar} from './traffic-car.js';
import {ROAD_NODES,ROAD_SEGMENTS,ADJACENCY,segmentBlocked} from './delivery-network.js';
import {rng,dist,damp,carForward,carModelYaw,moveCircle} from './physics.js';
import {createGhostChase,bodyContact} from './ghost-chase.js';
export {inHauntZone,ghostSees,pursuitState,ramPlayer} from './ghost-chase.js';
export function createDeliveryTraffic(scene,world,audio,onCrash,onNotice,seed,onNear=()=>{},onGhostHit=()=>{}){const random=rng(seed^791),ordinary=[];
 const allowed=e=>e.district!=='rookhaven'&&e.width>=13;
 for(let i=0;i<18;i++){const district=i<6?'hollow':i<12?'briarwick':null,choices=district?ROAD_NODES.filter(n=>n.district===district&&dist(n,{x:district==='hollow'?2:1102,y:225})>35):ROAD_SEGMENTS.filter(e=>!e.district&&dist(e.a,{x:2,y:225})>35),pick=choices[Math.floor(random()*choices.length)],node=district?pick:pick.a,model=makeTrafficCar(scene,[0x4c5764,0x656154,0x684d60,0x657369,0x8a614c][i%5]);ordinary.push({model,ghost:false,x:node.x,y:node.y,node,previous:null,goal:null,angle:0,speed:0,stopped:0,cooldown:0})}
 const ghosts=createGhostChase(scene,world,audio,onNotice,random,onGhostHit),cars=[...ordinary,...ghosts.cars];
 function update(dt,t,p,beforePlayer,closures){for(const c of ordinary){c.stopped=Math.max(0,c.stopped-dt);c.cooldown=Math.max(0,c.cooldown-dt);if(!c.goal||dist(c,c.goal)<4){if(c.goal)c.node=c.goal.node;const links=ADJACENCY.get(c.node.id).filter(v=>allowed(v.edge)),choices=links.filter(v=>v.node.id!==c.previous?.id),pool=choices.length?choices:links,next=pool[Math.floor(random()*pool.length)];if(!next)continue;c.previous=c.node;const dx=next.node.x-c.node.x,dy=next.node.y-c.node.y,len=Math.hypot(dx,dy),offset=next.edge.width>=20?3.5:2.3;c.goal={x:next.node.x-dy/len*offset,y:next.node.y+dx/len*offset,node:next.node};c.edge=next.edge}
 const old={x:c.x,y:c.y},dx=c.goal.x-c.x,dy=c.goal.y-c.y,d=Math.hypot(dx,dy)||1,blocked=segmentBlocked(c,{x:c.x+dx/d*22,y:c.y+dy/d*22},closures),f={x:dx/d,y:dy/d},near=dist(c,p)<12&&(p.x-c.x)*f.x+(p.y-c.y)*f.y>0,max=c.edge.type==='highway'?31:!c.edge.district?24:10+Math.abs(Math.sin(c.x)) *3;c.speed=damp(c.speed,c.stopped||blocked||near?0:max,3,dt);moveCircle(c,f.x*Math.min(d,c.speed*dt),f.y*Math.min(d,c.speed*dt),1.1,world.solids);const wanted=Math.atan2(dx,-dy);c.angle+=Math.atan2(Math.sin(wanted-c.angle),Math.cos(wanted-c.angle))*Math.min(1,dt*5);c.model.position.set(c.x,0,c.y);c.model.rotation.y=carModelYaw(c.angle);
 if(!c.passed&&Math.hypot(p.vx,p.vy)>18&&dist(c,p)>3.5&&dist(c,p)<5){c.passed=true;onNear(c)}
 if(c.cooldown===0&&bodyContact(beforePlayer,p,old,c)){const len=dist(c,p)||1,nx=(p.x-c.x)/len,ny=(p.y-c.y)/len,closing=Math.max(0,-(p.vx-f.x*c.speed)*nx-(p.vy-f.y*c.speed)*ny);onCrash(closing,c);p.vx+=nx*(closing+2);p.vy+=ny*(closing+2);c.cooldown=1;c.stopped=1.3}
 }return ghosts.update(dt,t,p,beforePlayer)}
 return {cars,get ghostStats(){return ghosts.stats},update,horn(p){for(const c of ordinary)if(dist(c,p)<35)c.stopped=2.5},destroy(){ghosts.destroy();for(const c of ordinary){scene.remove(c.model);c.model.geometry.dispose()}}};
}
