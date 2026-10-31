import {createSpatialAudio} from './spatial-audio.js';
import {THREE,createStage,material,box,cylinder,lantern,textTexture,planeText} from './visuals.js';
import {makeRider,buildMine,makePickup,makeHazard} from './ride-models.js';
import {newRideRun,stepRide,WORD,darkness,fogIntensity,LOOP,trackCountAt,trackHeight,trackOffset} from './ride-run.js';
import {buildRideTracks} from './ride-track.js';
import {createCutscene} from './ride-cutscene.js';
import {clamp,damp} from './physics.js';
const curve=d=>Math.sin(d/LOOP*Math.PI*2)*5+Math.sin(d/LOOP*Math.PI*6)*2.5;
export function createRide(canvas,input,hooks,options={}){
 const stage=createStage(canvas,{fog:0x151620,near:82,far:270,antialias:true}),{scene,camera,renderer}=stage,audio=createSpatialAudio(hooks,85);renderer.shadowMap.enabled=false;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.toneMappingExposure=1.25;
 const mine=buildMine(scene,curve,LOOP),{iron,wood}=mine;
 for(const object of scene.children)if(object.isInstancedMesh)object.visible=false;
 buildRideTracks(scene,curve,LOOP,iron,wood);
 const run=options.testRun??newRideRun({seed:options.seed??Math.floor(Math.random()*2147483647),letters:options.letters,contactMet:options.contactMet,startDistance:options.testDistance||0,paperHunt:options.paperHunt,papers:options.papers});
 const cart=new THREE.Group(),wheels=[];box(cart,0,1,0,2.5,.8,3.3,material(0x665047,'wood'));for(const side of [-1,1]){box(cart,side*1.23,1.5,0,.16,.8,3.5,iron);for(const z of [-1.25,1.25]){const w=cylinder(cart,side*1.3,.5,z,.48,.48,.25,iron,12);w.rotation.z=Math.PI/2;wheels.push(w)}for(let i=0;i<5;i++)box(cart,side*1.34,1.4,-1.3+i*.65,.065,.065,.065,material(0xb39370),false)}box(cart,0,1.5,-1.6,2.6,.9,.15,iron);box(cart,0,1.4,1.6,2.6,.7,.15,iron);lantern(cart,.9,1.8,-1.4);const wheelPivots=wheels.map(w=>{const pv=new THREE.Group();pv.position.copy(w.position);w.position.set(0,0,0);cart.add(pv);pv.add(w);return pv});const rider=makeRider(cart);rider.position.y=1.05;scene.add(cart);
 const shield=new THREE.Mesh(new THREE.IcosahedronGeometry(2.5,1),new THREE.MeshBasicMaterial({color:0x9dc5ed,transparent:true,opacity:.12,wireframe:true,depthWrite:false}));shield.position.y=1.5;shield.visible=false;cart.add(shield);
 const lamp=new THREE.SpotLight(0xffd39b,100,85,.48,.65,1.5),lampTarget=new THREE.Object3D();scene.add(lamp,lampTarget);lamp.target=lampTarget;const lights=Array.from({length:4},(_,n)=>{const l=new THREE.PointLight(n%2?0xd69756:0x8b91b9,20,28,1.7);scene.add(l);return l});
 const hud=document.createElement('div');hud.className='world-hud ride-hud';hud.innerHTML='<div class="hud-top"><span id="ride-progress"></span><span id="ride-stats"></span></div><div class="ride-hearts" aria-label="Health"></div><div class="ride-word"></div><div class="ride-powers"></div><div class="world-prompt"></div><div class="world-whisper"></div><div class="ride-duck"><span>DUCKING LOCKS YOUR TRACK</span></div><div class="ride-vignette"></div><div class="ride-fade"></div><div class="cinema-bars"></div>';canvas.parentElement.append(hud);
 let ended=false,lastHearts=-1,railClock=0,ambientClock=3,noticeTime=0,cinematic=-1,cinematicBase=0,roll=0,suspension=0,impactTime=0,lastWrite=-1,theme=-1;const hazardMeshes=new Map(),pickupMeshes=new Map();
 const terminal=new THREE.Group();terminal.visible=false;terminal.position.set(curve(420),0,-446);scene.add(terminal);box(terminal,8,.1,-14,11,.8,55,material(0x65616b,'stone'));box(terminal,12,4,-14,.4,8,55,wood);box(terminal,8,8.3,-14,12,.5,55,wood);for(let i=0;i<5;i++)if(i!==1)box(terminal,3,4,-i*12,.3,8,.3,wood);planeText(terminal,'END OF THE LINE',8,5,9,8,1.7,{bg:'#1b1824',color:'#d9bc91',font:'bold 68px Georgia'});const scoreBoard=planeText(terminal,'LAST RIDE',8,3.2,7,7,3.4,{font:'48px Georgia'});lantern(terminal,4,5,2);
 const oldBoard=new THREE.Group();terminal.add(oldBoard);box(oldBoard,5.2,4,-15.3,6.5,4.5,.4,material(0x151922));for(const side of [-1,1]){box(oldBoard,5.2+side*3.3,3,-15.2,.16,6,.5,wood);box(oldBoard,5.2,4+side*2.3,-15.2,6.8,.15,.5,wood)}let cutscene=null;
 function notice(text){hud.querySelector('.world-whisper').textContent=text.includes('Find the papers scattered along this track.')?'The ghost: “The package was sent into this game. There are five papers to collect along the track.”':text;noticeTime=3}
 function finish(won,message,extra={}){if(ended)return;ended=true;audio.pause(true);hooks.onEnd({won,score:Math.round(run.score),message,distance:run.distance,...extra})}
 function arrive(){if(cinematic>=0)return;cinematic=0;cinematicBase=run.distance%LOOP;terminal.position.set(curve(cinematicBase),0,-cinematicBase-26);terminal.visible=true;oldBoard.visible=false;for(const g of [...hazardMeshes.values(),...pickupMeshes.values()])g.visible=false;const old=scoreBoard.material.map;scoreBoard.material.map=textTexture('LAST RIDE\n'+Math.round(run.score)+' VALUABLES',{font:'bold 60px Georgia'});old.dispose();audio.cue('bell',{x:run.lanePosition,y:-run.distance},{volume:.7});const word=hud.querySelector('.ride-word');word.innerHTML=[...'GHOST'].map((letter,i)=>`<span class="found" style="--d:${i*.08}s">${letter}</span>`).join('');word.classList.add('complete');word.hidden=false;hud.classList.add('word-revelation')}
 function disposeNode(g,ownMaterial=false){scene.remove(g);g.traverse(o=>{o.geometry?.dispose();if(ownMaterial)o.material?.dispose()})}
 function renderObjects(t){
  const origin=Math.floor(run.distance/LOOP)*LOOP,activeHazards=new Set();
  for(const row of run.rows)for(const h of row.hazards){
   activeHazards.add(h);
   let g=hazardMeshes.get(h);
   if(!g){g=makeHazard(scene,h,wood,iron);hazardMeshes.set(h,g)}
   const d=row.distance-origin,count=row.tracks||trackCountAt(row.distance);
   let laneF=h.lane;
   if(h.toLane!==undefined){const k=clamp(1-(row.distance-run.distance)/38,0,1);laneF=h.lane+(h.toLane-h.lane)*k*k*(3-2*k)}
   const height=trackHeight(laneF,count);
   g.position.set(curve(d)+trackOffset(laneF,count),height,-d);
   if(h.type==='boulder'){const k=clamp((row.distance-run.distance-8)/30,0,1);g.position.y=height+k*k*16;if(g.userData.mark){g.userData.mark.position.y=.06-g.position.y;g.userData.mark.material.opacity=.3+.25*Math.sin(t*10)}}
   g.visible=!h.broken&&row.distance>run.distance-7;
  }
  for(const [h,g]of hazardMeshes)if(!activeHazards.has(h)){disposeNode(g);hazardMeshes.delete(h)}
  const activePickups=new Set(run.pickups);
  for(const p of run.pickups){
   let g=pickupMeshes.get(p);
   if(!g){g=makePickup(scene,p);pickupMeshes.set(p,g)}
   const d=p.distance-origin,count=trackCountAt(p.distance);
   g.position.set(curve(d)+trackOffset(p.lane,count),trackHeight(p.lane,count)+1.8+Math.sin(t*3+d)*.12,-d);
   g.rotation.y=p.type==='letter'?Math.sin(t*2)*.2:t*2;g.visible=!p.taken;
  }
  for(const [p,g]of pickupMeshes)if(!activePickups.has(p)){disposeNode(g,true);pickupMeshes.delete(p)}
 }
 function view(dt,t){
  const d=run.distance%LOOP,x=curve(d),height=trackHeight(run.lane,run.trackCount);
  cart.position.set(x+run.lanePosition,height+.1+run.jump+suspension,-d);
  cart.rotation.y=-Math.atan(curve(d+1)-x);
  roll=damp(roll,(trackOffset(run.lane,run.trackCount)-run.lanePosition)*-.045,12,dt);
  cart.rotation.z=roll;
  cart.rotation.x=damp(cart.rotation.x,run.jumpAge>=0?-Math.cos(run.jumpAge/.94*Math.PI)*.16:suspension*.8,12,dt);
  wheelPivots.forEach(w=>w.rotation.x-=run.speed*dt/.48);
  rider.scale.y=1-run.duck*.55;rider.position.y=1.05-run.duck*.12;rider.rotation.x=-cart.rotation.x*.5;
  rider.userData.arms.forEach((a,i)=>a.rotation.x=-.4+Math.sin(t*9+i)*.035);
  const turbo=run.powers.turbo>0,phase=run.powers.phase>0;
  shield.visible=run.powers.shield>0||turbo||phase;
  shield.material.color.setHex(turbo?0xff9a4a:phase?0xb285eb:0x9dc5ed);
  shield.material.opacity=turbo||phase?.28:.12;shield.rotation.y=t*(turbo?3:.5);
  camera.position.x=damp(camera.position.x,x+run.lanePosition*.5,7,dt);
  camera.position.y=damp(camera.position.y,height+6.1+run.jump*.15,9,dt);
  camera.position.z=-d+13;
  camera.lookAt(curve(d+28)+run.lanePosition*.2,height+2.5,-d-28);
  camera.fov=damp(camera.fov,61+Math.max(0,run.speed-30)*.22,3,dt);camera.updateProjectionMatrix();
  if(hooks.motion!==false)camera.rotation.z=roll*.15;
  lamp.position.set(cart.position.x,height+2.4+run.jump,-d-1.7);
  lampTarget.position.set(curve(d+35),1,-d-42);
  stage.moon.position.set(x-25,40,-d+10);stage.moon.target.position.set(x,0,-d-30);
  if(!stage.moon.target.parent)scene.add(stage.moon.target);
  lights.forEach((l,n)=>{const at=Math.floor(d/22)*22+n*22-8;l.position.set(curve(at)+(n%2?11:-11),5,-at)});
 const zone=Math.floor(run.distance/600)%3;if(zone!==theme){theme=zone;mine.floor.color.setHex([0x373b3d,0x253a3b,0x43332f][zone]);scene.fog.color.setHex([0x151620,0x15262c,0x291b24][zone]);scene.background.copy(scene.fog.color)}const dk=darkness(run.distance),fog=fogIntensity(run.distance);scene.fog.near=82-fog*48;scene.fog.far=270-fog*125;lamp.intensity=100+dk*60;
 }
 camera.position.set(0,6.1,13);camera.lookAt(0,2.5,-28);
 if(options.cutscene){for(const l of WORD)run.letters.add(l);run.score=options.score||0;arrive()}
 return {maxStep:.08,audio:true,unlockAudio:()=>audio.unlock(),title:'Last Ride',intro:options.paperHunt?'Find the five scattered pages. The rails grow faster and more dangerous while the ghost searches the mine.':options.cutscene?'The track runs out. Something is waiting on the platform.':'An endless mine run with three tracks that open into five routes. Switch tracks, jump broken rails and crates, and duck beneath beams. Ducking never slows the cart, but locks you to your current track until you stand. Collect gold, brake with Shift/B, and use the Veil Lantern to phase through one collision.',help:'← → / A D change track · SPACE jump · ↓ / S duck or quick land · SHIFT / B brake',buttons:[['ArrowLeft','← TRACK'],['ArrowRight','TRACK →'],['ArrowDown','DUCK'],['Space','JUMP'],['ShiftLeft','BRAKE']],
 update(dt,t){if(ended)return;audio.unlock();audio.update({x:run.lanePosition,y:-run.distance,angle:0},dt);if(cinematic>=0){cinematic+=dt;if(!cutscene&&cinematic>=4.2){hud.classList.remove('word-revelation');hud.classList.add('cinematic');hud.querySelector('.ride-word').hidden=true;hud.querySelector('.ride-powers').hidden=true;cutscene=createCutscene({scene,camera,terminal,cart,wheels:wheelPivots,lamp,lampTarget,audio,fadeEl:hud.querySelector('.ride-fade'),vignetteEl:hud.querySelector('.ride-vignette'),onDone:()=>finish(true,'The figure fades into the dark.',{contact:true,letters:[...run.letters]})});cutscene.start()}if(cutscene)cutscene.update(dt);return}
 const events=stepRide(run,{left:input.tap('ArrowLeft','KeyA'),right:input.tap('ArrowRight','KeyD'),jump:input.tap('Space'),duck:input.held('ArrowDown','KeyS'),brake:input.held('ShiftLeft','ShiftRight','KeyB')},dt);for(const e of events){const at={x:e.lane===undefined?run.lanePosition:(e.lane-(run.trackCount-1)/2)*4.1,y:-run.distance};if(e.type==='coin')audio.cue('pickup',at,{volume:.23});if(e.type==='jump')audio.cue('step',at,{volume:.65});if(e.type==='land'){suspension=-.12;audio.cue('armor',at,{volume:.28})}if(e.type==='hit'){audio.cue('crash',at);impactTime=.25;suspension=-.2;notice('Cart hit! −1 chance')}if(e.type==='shield-break'||e.type==='phase-save'){audio.cue('shatter',at);notice(e.type==='phase-save'?'Veil Lantern used: the collision passed through you.':'Shield used!')}if(e.type==='letter'){audio.cue('letter',at);hooks.onLetter?.(e.letter,[...run.letters])}if(e.type==='paper'){audio.cue('paper',at);notice(`PAPER ${e.count} OF 5 RECOVERED`);hooks.onPaper?.(e.page,[...run.papers])}if(e.type==='paper-hint')notice('The ghost: “The package was sent here. Find the papers scattered along this track.”');if(e.type==='paper-stack'){hooks.onPaperStack?.([...run.papers]);finish(true,'All five papers gathered. They are now saved as one stack.',{paperStack:true,papers:[...run.papers],letters:[...run.letters]});return}if(e.type==='power'){audio.cue('power',at);notice(({shield:'SHIELD · ABSORBS ONE HIT',phase:'VEIL LANTERN · NEXT HIT PHASES THROUGH YOU',magnet:'MAGNET',double:'DOUBLE GOLD',turbo:'TURBO CART',jackpot:'JACKPOT',battery:'BRAKE BATTERY',heart:'EXTRA HEART'}[e.power]||e.power.toUpperCase())+'!')}if(e.type==='smash')audio.cue('crash',at,{volume:.3});if(e.type==='milestone'){audio.cue('letter',at,{volume:.4});notice(e.meters+' m')}if(e.type==='dark')notice(e.on?'The lamps are dying…':'');if(e.type==='end'){finish(false,'The cart derailed after '+Math.floor(run.distance)+' metres. Start a new run.',{letters:[...run.letters],wordComplete:run.wordComplete,papers:[...run.papers],paperHunt:run.paperHunt});return}}
 railClock-=dt;if(railClock<=0){audio.cue('rail',{x:run.lanePosition+(Math.sin(t*2)>0?1:-1),y:-run.distance},{volume:.45});railClock=Math.max(.09,3.5/run.speed)}ambientClock-=dt;if(ambientClock<=0){audio.cue(t%2<1?'wind':'echo',{x:Math.sin(t)*12,y:-run.distance-18},{volume:.42});ambientClock=5}noticeTime-=dt;if(noticeTime<=0)hud.querySelector('.world-whisper').textContent='';impactTime=Math.max(0,impactTime-dt);hud.classList.toggle('impact',impactTime>0);suspension=damp(suspension,0,14,dt);renderObjects(t);view(dt,t);
 hud.querySelector('#ride-progress').textContent='LAST RIDE · '+Math.floor(run.distance)+'m · '+run.trackCount+' TRACKS'+(run.paperHunt?` · PAPERS ${run.papers.size}/5`:'');hud.querySelector('#ride-stats').textContent=Math.round(run.score)+' · ×'+run.combo.toFixed(1);if(lastHearts!==run.health){lastHearts=run.health;hud.querySelector('.ride-hearts').innerHTML=[0,1,2].map(i=>`<span class="${i<run.health?'full':'empty'}">♥</span>`).join('')}hud.querySelector('.ride-duck').classList.toggle('dragging',run.duckTime>0);hud.querySelector('.ride-powers').textContent=Object.entries(run.powers).filter(([,v])=>v>0).map(([k,v])=>({double:'DOUBLE GOLD',phase:'VEIL LANTERN · NEXT HIT PHASES THROUGH'}[k]||k.toUpperCase())+' '+Math.ceil(v)+'s').join(' · ');hud.querySelector('.world-prompt').textContent=run.distance<120?'SPACE · JUMP    ↓ · DUCK / DUCKING LOCKS YOUR TRACK':'';if(run.arriving)arrive();
 },draw(){renderer.render(scene,camera)},destroy(){audio.destroy();hud.remove();stage.dispose()}};
}
