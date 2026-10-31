import {THREE,createStage,material,box,makeCar} from './visuals.js';
import {rng,clamp,damp,dist,updateCar,carForward,carModelYaw,vehicleImpactDamage} from './physics.js';
import {createDeliveryCity,DISTRICTS,GHOST_CITY,ROAD_NODES,ROAD_SEGMENTS,nearestRoad,districtFor,deliveryRoute,handoffAllowed} from './delivery-world.js';
import {buildDeliveryScenery} from './delivery-scenery.js';
import {createGhostChase} from './ghost-chase.js';
import {createSpatialAudio} from './spatial-audio.js';
export const GLOAMING_GHOSTS={count:9,maxConcurrent:3,dashCooldown:10};
import {DELIVERY_CARS,deliveryCar} from './delivery-balance.js';

const BRIDGE_TARGET={...ROAD_NODES.find(node=>node.id==='rookhaven-10'),name:'Rookhaven’s Eastern Corner',district:'rookhaven',districtName:'Rookhaven',address:'Eastern Rookhaven'};
const CITY_ENTRY=ROAD_NODES.find(node=>node.id==='gloaming-grid-3-0');
const CITY_DELIVERIES=stops=>stops.filter(stop=>stop.district===GHOST_CITY.id&&stop.task==='delivery').slice(0,3);

export function isGhostSideImpact(player,ghost,playerBefore,ghostBefore){
 const speed=Math.hypot(player.vx||0,player.vy||0);
 if(speed<5)return false;
 const forward=carForward(ghost.angle||0);
 if((player.vx*forward.x+player.vy*forward.y)/speed<=-.55)return false;
 if(playerBefore&&ghostBefore){const d=dist(player,ghost)||1,nx=(player.x-ghost.x)/d,ny=(player.y-ghost.y)/d,playerClosing=-((player.x-playerBefore.x)*nx+(player.y-playerBefore.y)*ny),ghostClosing=(ghost.x-ghostBefore.x)*nx+(ghost.y-ghostBefore.y)*ny;if(ghostClosing>playerClosing)return false}
 return true;
}

export function createDeliveryInvestigation(canvas,input,hooks,options={}){
 const stage=createStage(canvas,{fog:0x111725,near:90,far:235,antialias:false}),{scene,camera,renderer}=stage;
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.shadowMap.enabled=false;renderer.toneMappingExposure=1.25;
 for(const light of scene.children){if(light.isHemisphereLight)light.intensity=1.25;if(light.isDirectionalLight)light.intensity=light===stage.moon?1.3:.65}
 const seed=options.seed??431,world=createDeliveryCity(seed),scenery=buildDeliveryScenery(scene,world),audio=createSpatialAudio(hooks,85),random=rng(seed);
 let vehicle=deliveryCar(options.vehicle),ended=false,blackHeadlights=false,bridgeRevealed=options.stage>6,integrity=100,score=0,stageNumber=options.stage===8?8:options.stage===7?7:6,deliveryIndex=0,failed=false,carriedParcel=stageNumber===8,shiftAge=0,hit=0,shake=0,handoff=0,handoffDuration=.85,handoffTarget=null,route=[],routeClock=0,messageUntil=0,message='',mapOpen=false,bridgeHinted=false;
 const p={x:stageNumber===6?2:CITY_ENTRY.x,y:stageNumber===6?225:CITY_ENTRY.y,vx:0,vy:0,angle:stageNumber===6?0:Math.PI/2};
 const car=makeCar(scene,vehicle.color),paint=[];
 car.traverse(object=>{if(object.isMesh&&object.material?.metalness===.35&&object.material?.roughness===.35){object.material=object.material.clone();paint.push(object.material)}});
 function setVehicleChoice(id){vehicle=deliveryCar(id);car.scale.set(...vehicle.scale);for(const mat of paint)mat.color.setHex(vehicle.color);return vehicle.id}
 setVehicleChoice(vehicle.id);
 const headlights=[];
 for(const side of [-1,1]){const head=new THREE.SpotLight(0xffdfb1,135,65,.37,.6,1.5),target=new THREE.Object3D();scene.add(head,target);head.target=target;headlights.push({head,target,side})}
 const hostileRoadNodes=[...new Map(ROAD_SEGMENTS.filter(edge=>edge.district===GHOST_CITY.id).flatMap(edge=>[edge.a,edge.b]).map(node=>[node.id,node])).values()];
 const ghostTraffic=createGhostChase(scene,world,audio,()=>{},random,ghost=>ghostImpact(ghost),{
  ...GLOAMING_GHOSTS,spawnDelay:.15,respawnDelay:1.5,speedScale:1.45,chaseDistance:650,lostSight:24,maxAge:150,impactQuiet:.2,evasionQuiet:.1,ramForce:26,persistentImpact:true,zone:position=>districtFor(position)?.id===GHOST_CITY.id,
  spawn:(player,cars,pick)=>{const active=cars.filter(car=>car.chasing),spots=hostileRoadNodes.filter(node=>dist(node,player)>260&&dist(node,player)<610&&active.every(car=>dist(node,car)>175));const node=spots[Math.floor(pick()*spots.length)];return node?{x:node.x,y:node.y,angle:Math.atan2(player.x-node.x,-(player.y-node.y))}:null},
  sideImpact:(player,ghost,playerBefore,ghostBefore)=>isGhostSideImpact(player,ghost,playerBefore,ghostBefore),onSideImpact:ghost=>ghostSideHit(ghost)
 });
 const cityStops=CITY_DELIVERIES(world.stops);
 const hud=document.createElement('div');hud.className='world-hud delivery-hud';canvas.parentElement.append(hud);
 hud.innerHTML='<div class="hud-top"><span class="delivery-goal"></span><span class="delivery-stats"></span></div><div class="dispatch-note"><small class="delivery-clue"></small><p class="delivery-reason"></p></div><div class="minimap-wrap"></div><div class="world-prompt"></div><div class="world-whisper"></div>';
 const minimap=document.createElement('canvas');minimap.width=minimap.height=224;hud.querySelector('.minimap-wrap').append(minimap);
 const mapPanel=document.createElement('canvas');mapPanel.width=1024;mapPanel.height=720;mapPanel.className='delivery-map';mapPanel.hidden=true;canvas.parentElement.append(mapPanel);
 const failure=document.createElement('section');failure.className='delivery-failure';failure.hidden=true;failure.innerHTML='<h2>The car is wrecked.</h2><p>The Gloaming’s dead traffic has stopped your run. The three deliveries must be completed again.</p><div class="button-row"><button type="button" data-restart-road>RESTART FROM HOLLOW</button><button type="button" data-restart-city>RESTART AT CITY ENTRANCE</button></div>';canvas.parentElement.append(failure);
 const marker=new THREE.Group(),ring=new THREE.Mesh(new THREE.TorusGeometry(3.4,.12,8,40),new THREE.MeshBasicMaterial({color:0xe4b968})),arrow=new THREE.Mesh(new THREE.ConeGeometry(.65,1.2,4),new THREE.MeshBasicMaterial({color:0xf3c77b}));
 ring.rotation.x=Math.PI/2;marker.add(ring);arrow.rotation.z=Math.PI;arrow.position.y=4;marker.add(arrow);scene.add(marker);
 const parcel=box(scene,0,1.5,0,.9,.65,.65,material(0xb38f61,'wood'));parcel.visible=carriedParcel;
 const bridgeMeshes=scenery.bridges;
 function setBridgeVisible(value){for(const bridge of bridgeMeshes)bridge.visible=value;ghostTraffic.setVisible(value)}
 setBridgeVisible(stageNumber>6||bridgeRevealed);
 camera.position.set(p.x,52,p.y+36);camera.lookAt(p.x,0,p.y-8);
 function destination(){if(carriedParcel)return world.post;if(stageNumber===6)return bridgeRevealed?CITY_ENTRY:BRIDGE_TARGET;return cityStops[deliveryIndex]||world.post}
 function say(text,seconds=4){message=text;messageUntil=shiftAge+seconds}
 function setStage(next){stageNumber=next;options.stage=next;routeClock=0;handoff=0;parcel.visible=next===8;refresh()}
 function refresh(speed=Math.hypot(p.vx,p.vy)){
  const target=destination(),goal=hud.querySelector('.delivery-goal');
  goal.textContent=carriedParcel?'RAILWAY PARCEL → NORTH STREET POST OFFICE':stageNumber===6?bridgeRevealed?'ENTER GLOAMING':'FIND ROOKHAVEN’S EASTERN CORNER':`GLOAMING DELIVERIES · ${Math.min(deliveryIndex+1,3)} / 3`;
  hud.querySelector('.delivery-stats').textContent=`${Math.round(speed*2.237)} MPH · CAR ${Math.ceil(integrity)}% · ${carriedParcel?'PARCEL SECURED':`DELIVERIES ${deliveryIndex}/3`}`;
  hud.querySelector('.delivery-clue').textContent=carriedParcel?'SEALED RAILWAY PARCEL':stageNumber===6?'THE GHOST’S COMPASS POINTS EAST':`CUSTOMER ${deliveryIndex+1} OF 3 · ${target.name}`;
  hud.querySelector('.delivery-reason').textContent=carriedParcel?'Deliver the parcel to Hollow’s North Street Post Office.':stageNumber===6?'The old map ends at Rookhaven’s eastern corner. Find the road beyond it.':'Gloaming’s hostile ghost cars pursue along the city streets and bridge. Strike their sides or rear to recover car condition.';
 }
 function drawMap(ctx,full=false){
  const w=ctx.canvas.width,h=ctx.canvas.height;ctx.fillStyle='#101824';ctx.fillRect(0,0,w,h);
  const left=-320,top=-485,scale=Math.min((w-32)/3600,(h-70)/2100),xy=v=>({x:16+(v.x-left)*scale,y:20+(v.y-top)*scale});
  const cityRevealed=stageNumber!==6||bridgeRevealed;
  for(const edge of world.roads){if(edge.type==='shadow-bridge'&&!cityRevealed||edge.district===GHOST_CITY.id&&!cityRevealed)continue;const a=xy(edge.a),b=xy(edge.b);ctx.strokeStyle=edge.type==='shadow-bridge'?'#706854':edge.district===GHOST_CITY.id?'#657078':'#454958';ctx.lineWidth=Math.max(1,edge.width*scale);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
  for(const stop of world.stops){if(stop.district===GHOST_CITY.id&&!cityRevealed||stop.district!==GHOST_CITY.id&&!stop.storyOnly)continue;const pos=xy(stop);ctx.fillStyle=stop.id===destination().id?'#f2c56e':'#8e8176';ctx.beginPath();ctx.arc(pos.x,pos.y,stop.id===destination().id?4:2,0,Math.PI*2);ctx.fill()}
  for(const district of cityRevealed?[...DISTRICTS,GHOST_CITY]:DISTRICTS){const pos=xy({x:district.cx,y:district.cy-275});ctx.fillStyle='#d9ccac';ctx.font=`${full?14:9}px Georgia`;ctx.textAlign='center';ctx.fillText(district.name.toUpperCase(),pos.x,pos.y)}
  const player=xy(p),target=xy(destination());ctx.fillStyle='#f0eeee';ctx.beginPath();ctx.arc(player.x,player.y,4,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#f5d9a2';ctx.lineWidth=2;ctx.strokeRect(target.x-5,target.y-5,10,10);
 }
 function updateCarView(dt,speed,t){
  const forward=carForward(p.angle),right={x:Math.cos(p.angle),y:Math.sin(p.angle)};
  car.position.set(p.x,0,p.y);car.rotation.y=carModelYaw(p.angle);car.rotation.z=damp(car.rotation.z,clamp(-p.yawRate*speed*.004,-.12,.12)||0,7,dt);
  for(const wheel of car.userData.wheels){wheel.mesh.rotation.x-=(p.vx*forward.x+p.vy*forward.y)*dt/.44;wheel.mesh.rotation.y=wheel.front?-(p.steering||0):0}
  for(const {head,target,side} of headlights){head.color.setHex(blackHeadlights?0x9d87ed:0xffdfb1);head.intensity=blackHeadlights?190:135;head.position.set(p.x+forward.x*2.05+right.x*side*.72,1.05,p.y+forward.y*2.05+right.y*side*.72);target.position.set(p.x+forward.x*35+right.x*side*.7,.15,p.y+forward.y*35+right.y*side*.7)}
  camera.position.x=damp(camera.position.x,p.x+forward.x*6,4,dt);camera.position.y=damp(camera.position.y,52+speed*.5,3,dt);camera.position.z=damp(camera.position.z,p.y+36+forward.y*3,4,dt);if(hooks.motion!==false&&shake)camera.position.x+=Math.sin(t*70)*shake*.12;camera.lookAt(p.x+forward.x*Math.min(26,8+speed*.25),0,p.y+forward.y*Math.min(26,8+speed*.25));
  stage.moon.position.set(p.x-30,65,p.y+15);stage.moon.target.position.set(p.x,0,p.y);
 }
 function crash(impact){
  if(impact<3||hit>0)return;
  const damage=Math.min(integrity,vehicleImpactDamage(impact)/vehicle.resistance);integrity-=damage;hit=.6;shake=Math.min(1,impact/20);audio.cue('crash',p);say(`Crash · −${Math.ceil(damage)}% car condition`,2);
 }
 function ghostSideHit(){integrity=Math.min(100,integrity+24);score+=40;audio.cue('pickup',p,{volume:.65})}
 function ghostImpact(ghost){const damage=Math.min(integrity,8/vehicle.resistance);integrity-=damage;const d=dist(p,ghost)||1;p.vx+=(p.x-ghost.x)/d*20;p.vy+=(p.y-ghost.y)/d*20;hit=.8;shake=.45;audio.cue('crash',ghost,{volume:.55})}
 function restart(atCity){
  failed=false;failure.hidden=true;integrity=100;score=0;deliveryIndex=0;carriedParcel=false;blackHeadlights=atCity;bridgeRevealed=atCity;bridgeHinted=false;handoff=0;hit=0;shake=0;
  p.x=atCity?CITY_ENTRY.x:2;p.y=atCity?CITY_ENTRY.y:225;p.vx=0;p.vy=0;p.angle=atCity?Math.PI/2:0;
  if(atCity){setStage(7);setBridgeVisible(true);hooks.onStory?.('road',{crossedBridge:true}).catch(error=>hooks.toast?.(error.message))}
  else{setStage(6);setBridgeVisible(false)}
  say(atCity?'The route resets at Gloaming’s entrance. All three deliveries must be made again.':'The run restarts in Hollow. Find Rookhaven’s hidden bridge again.',5);
  updateCarView(.016,0,0);refresh();
 }
 failure.querySelector('[data-restart-road]').onclick=()=>restart(false);
 failure.querySelector('[data-restart-city]').onclick=()=>restart(true);
 async function advance(action,payload){
  try{const next=await hooks.onStory?.(action,payload);if(typeof next==='number')options.stage=next;return true}
  catch(error){hooks.toast?.(error.message);return false}
 }
 async function enterCity(){
  if(stageNumber!==6||!bridgeRevealed||p.x<CITY_ENTRY.x-25||Math.abs(p.y-CITY_ENTRY.y)>75)return;
  if(!await advance('road',{crossedBridge:true}))return;
  setStage(7);setBridgeVisible(true);say('The ghost: “The bridge has no return address. Three parcels are waiting in Gloaming. Keep moving; those cars remember the living.”',12);
 }
 async function handoffAt(target){
  if(carriedParcel){if(!await advance('delivered',{postOffice:true}))return;ended=true;audio.pause(true);hooks.onEnd({won:true,score,message:'The parcel is delivered to Hollow’s North Street Post Office.',delivered:true});return}
  if(stageNumber!==7)return;
  deliveryIndex++;score+=150;audio.cue('pickup',target);
  if(deliveryIndex<3){say(`Delivery ${deliveryIndex} of 3 complete. The next address is marked on your map.`,5);routeClock=0;refresh();return}
  if(!await advance('package',{deliveries:3})){deliveryIndex=2;return}
  carriedParcel=true;setStage(8);setBridgeVisible(true);say('Three deliveries complete. The final railway parcel is sealed; take it to North Street Post Office in Hollow.',12);
 }
 function getPrompt(){
  const target=destination(),near=dist(p,target)<6,speed=Math.hypot(p.vx,p.vy);
  if(stageNumber===6)return blackHeadlights?'CROSS THE REVEALED BRIDGE':'DRIVE TOWARD ROOKHAVEN’S EASTERN CORNER';
  if(near)return handoffAllowed(p,target)?'E · '+(carriedParcel?'DELIVER PARCEL':'MAKE DELIVERY'):'BRAKE AND STOP AT THE ADDRESS';
  return nearestRoad(p).edge.type==='alley'?'NARROW ALLEY · BRAKE EARLY':speed>50?'BRAKE BEFORE THE NEXT TURN':'M · REGIONAL MAP';
 }
 function mapToggle(){mapOpen=!mapOpen;mapPanel.hidden=!mapOpen;hud.classList.toggle('delivery-survey-open',mapOpen);audio.pause(mapOpen);if(mapOpen)drawMap(mapPanel.getContext('2d'),true)}
 if(stageNumber===6)say('The ghost: “The old map ends at Rookhaven’s eastern corner. I can make the hidden road visible.”',12);
 if(stageNumber===7){setBridgeVisible(true);say('Gloaming lies beyond the bridge. Three deliveries stand between you and the sealed parcel.',8)}
 if(stageNumber===8){setBridgeVisible(true);say('The parcel is secured. Take it to North Street Post Office in Hollow.',8)}
 updateCarView(.016,0,0);drawMap(minimap.getContext('2d'));refresh();
 return {
  maxStep:.1,audio:true,unlockAudio:()=>audio.unlock(),handlesEscape:()=>mapOpen,title:'Midnight Delivery',
  vehicleChoices:DELIVERY_CARS.map(({id,name,description,speed,handling,resistance,points})=>({id,name,description,speed,handling,resistance,points})),selectedVehicle:vehicle.id,setVehicleChoice,
  intro:stageNumber===6?'Drive east through Rookhaven. The ghost’s compass points toward the far edge of the city.':stageNumber===7?'Complete three deliveries in Gloaming. Ghost cars roam its streets; hit their sides or rear to shatter them and recover car condition.':'Take the sealed railway parcel to Hollow’s North Street Post Office.',
  help:'W / ↑ accelerate · S / ↓ brake, then reverse · A D steer · SPACE handbrake · E deliver · M regional map'+(stageNumber===6?' · L black headlights':''),
  buttons:[['KeyW','ACCELERATE'],['KeyA','←'],['KeyD','→'],['KeyS','BRAKE'],['Space','HANDBRAKE'],['KeyE','DELIVER'],['KeyM','MAP'],...(stageNumber===6?[['KeyL','BLACK LIGHT']]:[])],
  update(dt,t){
   if(ended)return;audio.unlock();audio.update({...p,angle:0},dt);shiftAge+=dt;hit=Math.max(0,hit-dt);shake=Math.max(0,shake-dt*4);
   if(input.tap('KeyM')){mapToggle();return}if(input.tap('Escape')&&mapOpen){mapToggle();return}if(mapOpen)return;
   if(!failed&&stageNumber===6&&input.tap('KeyL')){blackHeadlights=!blackHeadlights;if(blackHeadlights)bridgeRevealed=true;setBridgeVisible(bridgeRevealed);audio.cue('lantern',p);say(blackHeadlights?'BLACK HEADLIGHTS · A full bridge appears east of Rookhaven.':'WARM HEADLIGHTS · The revealed bridge remains visible.',4)}
   if(failed)return;
   const throttle=(input.held('KeyW','ArrowUp')?1:0)-(input.held('KeyS','ArrowDown')?1:0),steer=(input.held('KeyD','ArrowRight')?1:0)-(input.held('KeyA','ArrowLeft')?1:0),road=nearestRoad(p),highway=['highway','shadow-bridge','coast','marsh'].includes(road.edge.type),offroad=road.distance>road.edge.width/2+.8,before={x:p.x,y:p.y},impact=updateCar(p,{throttle,steer,handbrake:input.held('Space'),highway,roadAngle:Math.atan2(road.edge.b.x-road.edge.a.x,-(road.edge.b.y-road.edge.a.y)),speedLimit:highway?112:road.edge.type==='alley'?27:48,speedScale:vehicle.speed,accelerationScale:vehicle.acceleration,handlingScale:vehicle.handling,gripScale:vehicle.grip,offroad},dt,world.solids);
   if(stageNumber===6&&!bridgeRevealed&&nearestRoad(p).edge.type==='shadow-bridge'){p.x=before.x;p.y=before.y;p.vx=0;p.vy=0;say('The hidden bridge will not hold the car without black headlights.',4)}
   crash(impact);ghostTraffic.update(dt,shiftAge,p,before);
   if(stageNumber===6&&!bridgeHinted&&dist(p,BRIDGE_TARGET)<95){bridgeHinted=true;say('The ghost: “The bridge is here. Press L to switch headlamps.”',10)}
   if(input.tap('KeyE')&&handoff===0&&handoffAllowed(p,destination())){handoff=.85;handoffDuration=.85;handoffTarget=destination()}
   if(handoff>0){if(!handoffAllowed(p,handoffTarget)){handoff=0;say('Delivery interrupted. Stop at the address.',3)}else{handoff=Math.max(0,handoff-dt);if(handoff===0)handoffAt(handoffTarget)}}
   if(stageNumber===6&&bridgeRevealed)enterCity();
   if(integrity<=0&&!failed){failed=true;handoff=0;failure.hidden=false;audio.pause(true);p.vx=0;p.vy=0}
   const speed=Math.hypot(p.vx,p.vy);updateCarView(dt,speed,t);marker.visible=!failed;marker.position.set(destination().x,.2,destination().y);arrow.position.y=4+Math.sin(t*3)*.3;
   routeClock-=dt;if(routeClock<=0){routeClock=.55;route=deliveryRoute(p,destination())}
   drawMap(minimap.getContext('2d'));refresh(speed);hud.querySelector('.world-prompt').textContent=getPrompt();hud.querySelector('.world-whisper').textContent=shiftAge<messageUntil?message:'';
  },
  draw(){renderer.render(scene,camera)},
  destroy(){audio.destroy();ghostTraffic.destroy();for(const mesh of marker.children){mesh.geometry.dispose();mesh.material.dispose()}hud.remove();mapPanel.remove();failure.remove();stage.dispose()}
 };
}
