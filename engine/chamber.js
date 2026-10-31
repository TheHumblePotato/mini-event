import {createSpatialAudio} from './spatial-audio.js';
import {THREE,createStage,material,box,lantern,spirit,planeText} from './visuals.js';
import {damp,clamp} from './physics.js';
import {startMeltdown} from './site-meltdown.js';

export function createChamber(canvas,input,hooks){
 const stage=createStage(canvas,{fog:0x07070d,near:18,far:58}),{scene,camera,renderer}=stage,audio=createSpatialAudio(hooks,50);scene.add(camera);
 const stone=material(0x47434d,'stone'),iron=material(0x24212b,null,{metalness:.7,roughness:.36}),wood=material(0x30252a,'wood'),boardsWood=material(0x211719,'wood');
 const room=new THREE.Group();room.position.y=-.3;scene.add(room);
 box(room,0,-.35,-4,20,.7,34,stone);
 box(room,0,4,-20,20,8,.7,stone);
 box(room,-10,4,-4,.7,8,33,stone);box(room,10,4,-4,.7,8,33,stone);
 box(room,0,8,-4,20,.6,34,stone);
 for(let z=8;z>-19;z-=5){box(room,-9.6,4,z,.15,8,.3,wood);box(room,9.6,4,z,.15,8,.3,wood)}
 for(const x of [-7,7])for(const z of [-17,-10,-3,4]){box(room,x,3.8,z,.32,7.6,.4,iron);box(room,x,7.7,z,.7,.25,.7,wood)}
 for(const x of [-2.7,2.7])box(room,x,2.2,12.2,.22,4.4,.4,iron);
 box(room,0,4.5,12.2,5.6,.24,.4,wood);
 const exitDoor=new THREE.Group();room.add(exitDoor);exitDoor.position.set(-2.5,0,12);
 box(exitDoor,2.5,2.1,0,4.9,4.2,.2,wood);
 box(exitDoor,4.25,2.05,.14,.12,.55,.08,iron,false);
 exitDoor.rotation.y=1.1;
 const doorBoards=new THREE.Group();room.add(doorBoards);doorBoards.position.set(0,0,11.8);doorBoards.visible=false;
 for(const y of [1.1,2.1,3.1])box(doorBoards,0,y,0,5.4,.2,.18,boardsWood);
 const braceA=box(doorBoards,0,2.1,.12,5.8,.24,.2,boardsWood);braceA.rotation.z=.62;
 const braceB=box(doorBoards,0,2.1,.12,5.8,.24,.2,boardsWood);braceB.rotation.z=-.62;

 const mirrorFrame=material(0x6e5544,null,{metalness:.55,roughness:.38});
 for(const x of [-3.4,3.4])box(room,x,3.2,-17.5,.3,6.6,.5,mirrorFrame);
 for(const y of [.05,6.4])box(room,0,y,-17.5,6.9,.3,.5,mirrorFrame);
 const mirrorMat=new THREE.MeshStandardMaterial({color:0x101018,metalness:.86,roughness:.12,emissive:0x351b49,emissiveIntensity:.08});
 const mirror=new THREE.Mesh(new THREE.PlaneGeometry(6.5,6.1),mirrorMat);mirror.position.set(0,3.25,-17.22);room.add(mirror);
 const captive=spirit(room,0,.1,-15.8,5.1);captive.position.set(0,2.75,-15.6);captive.material.transparent=true;captive.material.opacity=0;captive.visible=false;
 const chainGroup=new THREE.Group();room.add(chainGroup);chainGroup.visible=false;
 for(const side of [-1,1])for(let n=0;n<13;n++){const link=box(chainGroup,side*(.8+n*.13),1+n*.29,-15.2-n*.08,.09,.38,.09,iron,false);link.rotation.z=(n%2?1:-1)*.35}
 const ambience=new THREE.PointLight(0x342c49,9,38);ambience.position.set(0,6,-5);room.add(ambience);
 const mirrorLight=new THREE.PointLight(0x642e83,0,22);mirrorLight.position.set(0,3.2,-15);room.add(mirrorLight);
 const cameraLight=new THREE.SpotLight(0x9b70cb,0,24,.34,.45,1.3);cameraLight.position.set(.56,-.12,-1.15);camera.add(cameraLight);
 const lightTarget=new THREE.Object3D();lightTarget.position.set(0,0,-16);camera.add(lightTarget);cameraLight.target=lightTarget;
 const heldLamp=new THREE.Group();camera.add(heldLamp);heldLamp.position.set(.66,-.42,-1.8);heldLamp.scale.setScalar(.55);
 const handheld=lantern(heldLamp,0,0,0,0x171323);handheld.scale.setScalar(.83);
 const glass=new THREE.Mesh(new THREE.BoxGeometry(.2,.3,.2),new THREE.MeshBasicMaterial({color:0x6c4a99}));
 handheld.add(glass);glass.position.set(0,0,0);
 const sleeve=material(0x211c28,'wood'),skin=material(0x9d8374);
 box(heldLamp,.02,-.48,.13,.29,.45,.48,sleeve,false);box(heldLamp,.02,-.24,-.02,.22,.21,.23,skin,false);
 const normalLamp=lantern(heldLamp,-.58,-.12,-1.23,0xa76539);normalLamp.scale.setScalar(.56);normalLamp.visible=false;

 const sparks=Array.from({length:28},()=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(.055,6,6),new THREE.MeshBasicMaterial({color:0xb88bff,transparent:true,opacity:.85}));scene.add(mesh);mesh.visible=false;return mesh});
 // A beam of light between the lit lamp and the mirror (both endings).
 const beamGeo=new THREE.CylinderGeometry(1,1,1,10,1,true);
 const beamCore=new THREE.Mesh(beamGeo,new THREE.MeshBasicMaterial({color:0xf0e4ff,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
 const beamGlow=new THREE.Mesh(beamGeo,new THREE.MeshBasicMaterial({color:0x8a4fe8,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
 const beam=new THREE.Group();beam.add(beamGlow,beamCore);beam.visible=false;scene.add(beam);
 // Ash that the ghost breaks into when the ordinary lamp is lit.
 const bits=Array.from({length:120},()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.1),new THREE.MeshBasicMaterial({color:0xcfe3ff,transparent:true,opacity:0,depthWrite:false}));m.visible=false;room.add(m);return {m,start:0,life:1,x:0,y:0,z:0,vx:0,vy:0,vz:0}});

 const hud=document.createElement('div');hud.className='world-hud chamber-hud final-chamber';
 hud.innerHTML='<div class="hud-top"><span>THE FOURTH GAME</span><span>THE RETURN CHAMBER</span></div><p class="world-whisper">“You brought it back. The mirror is listening. Choose which flame you trust.”</p><div class="final-choices"><button id="light-black" class="final-choice">LIGHT THE BLACK LAMP</button><button id="light-normal" class="final-choice">LIGHT THE NORMAL LAMP</button></div><div class="ending-corruption" aria-hidden="true"></div><div class="chamber-fade" style="position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;z-index:9"></div>';
 canvas.parentElement.append(hud);
 const whisper=hud.querySelector('.world-whisper'),choices=hud.querySelector('.final-choices'),staticLayer=hud.querySelector('.ending-corruption'),fadeEl=hud.querySelector('.chamber-fade');
 camera.position.set(0,2.05,3);camera.lookAt(0,2.1,-15);
 let ending=null,endingTime=0,pending=false,reported=false,audioClock=0,handedOff=false,meltdown=null;
 let beamSource=glass,baseLights=[],flickerables=[],flick=1,flickClock=0,cued=false,lastLine='';
 const hiddenUntil=new Map(),vA=new THREE.Vector3(),vB=new THREE.Vector3(),vD=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0);
 const setLine=s=>{if(s!==lastLine){whisper.textContent=s;lastLine=s}};

 function placeBeam(grow,width){
  camera.updateMatrixWorld(true);beamSource.getWorldPosition(vA);vB.set(0,2.9,-17.1);
  vD.copy(vB).sub(vA);const full=vD.length(),len=full*grow;
  if(len<.01){beam.visible=false;return}
  beam.visible=true;vD.normalize();beam.position.copy(vA).addScaledVector(vD,len/2);beam.quaternion.setFromUnitVectors(UP,vD);
  beamCore.scale.set(width*.35,len,width*.35);beamGlow.scale.set(width,len,width);
 }
 function startMeltdownSequence(){
  meltdown=startMeltdown({soundEnabled:()=>hooks.soundEnabled?.()!==false&&!hooks.paused?.(),motion:hooks.motion!==false,onComplete:finish});
 }
 async function choose(kind){
  if(pending||ending)return;
  pending=true;
  try{await hooks.onStory('entered');}
  catch(error){hooks.toast(error.message);pending=false;return}
  ending=kind;endingTime=0;choices.hidden=true;hud.classList.add('cinematic');
  scene.traverse(o=>{if(o.isLight&&o!==cameraLight&&o!==mirrorLight)baseLights.push({light:o,base:o.intensity})});
  flickerables=room.children.filter(o=>o!==mirror&&o!==doorBoards&&o!==captive&&o!==chainGroup&&!o.isLight&&!bits.some(b=>b.m===o));
  if(kind==='release'){
   chainGroup.visible=true;normalLamp.visible=false;beamSource=glass;
   glass.material.color.setHex(0xb98cff);cameraLight.color.setHex(0x9b70cb);cameraLight.intensity=0;
   beamCore.material.color.setHex(0xf0e4ff);beamGlow.material.color.setHex(0x8a4fe8);
   mirrorLight.color.setHex(0x9c5bea);mirrorLight.intensity=0;mirrorMat.emissive.setHex(0x8c4acb);mirrorMat.emissiveIntensity=.1;
   sparks.forEach(m=>m.visible=true);
   audio.cue('lantern',{x:0,y:-15},{volume:.85});
   setLine('The black flame pours into the mirror.');
   startMeltdownSequence();
  }else{
   normalLamp.visible=true;beamSource=normalLamp;
   glass.material.color.setHex(0xffc36c);cameraLight.color.setHex(0xf2bd79);cameraLight.intensity=0;
   beamCore.material.color.setHex(0xfff1d0);beamGlow.material.color.setHex(0xffa84a);
   mirrorLight.color.setHex(0xffd9a0);mirrorLight.intensity=0;mirrorMat.emissive.setHex(0xffc27a);mirrorMat.emissiveIntensity=.2;
   captive.visible=true;captive.material.opacity=0;captive.material.color.setHex(0xffffff);captive.position.set(0,2.75,-15.6);captive.scale.set(1,1,1);
   for(const b of bits){const y=.4+Math.random()*4.6,spread=.35+1.3*(1-Math.abs(y-2.6)/3.4);b.x=(Math.random()-.5)*2*spread;b.y=y;b.z=-15.6+(Math.random()-.5)*.5;b.vx=(Math.random()-.5)*1.2;b.vy=.4+Math.random()*1.6;b.vz=-.3-Math.random()*1.2;b.start=2+(1-y/5)*1.8+Math.random()*.2;b.life=1+Math.random()*1.2}
   audio.cue('lantern',{x:0,y:-15},{volume:.85});
   setLine('The mirror shows what it holds.');
  }
 }
 hud.querySelector('#light-black').onclick=()=>choose('release');
 hud.querySelector('#light-normal').onclick=()=>choose('contain');
 function finish(){if(reported)return;reported=true;handedOff=true;hooks.onEnd({won:true,score:0,ending})}

 // BLACK LAMP: the room's lights die, a beam links lamp and mirror, the room itself starts to fail, and the site breaks down.
 function releaseUpdate(dt){
  const t=endingTime,fade=clamp(1-(t-2.5)/11,.03,1);
  flickClock-=dt;
  if(flickClock<=0){
   flickClock=.03+Math.random()*.11;
   flick=Math.random()<clamp((t-.6)/5,0,.75)?.02+Math.random()*.5:1;
   if(t>3){const p=clamp((t-3)/8,0,.85);for(let i=0;i<3;i++)if(Math.random()<p&&flickerables.length){const o=flickerables[Math.floor(Math.random()*flickerables.length)];o.visible=false;hiddenUntil.set(o,t+.06+Math.random()*.22)}}
  }
  for(const [o,until] of hiddenUntil)if(t>=until){o.visible=true;hiddenUntil.delete(o)}
  for(const {light,base} of baseLights)light.intensity=base*fade*flick;
  cameraLight.intensity=damp(cameraLight.intensity,24*(Math.random()<.9?1:.4),3,dt);
  mirrorLight.intensity=damp(mirrorLight.intensity,t>1?(20+Math.sin(t*30)*7)*(Math.random()<.85?1:.3):0,3,dt);
  mirrorMat.emissiveIntensity=clamp(.2+t*.28,0,3.2)*(Math.random()<.9?1:.4);
  glass.material.color.setHex(Math.random()<.1?0xffffff:0xb98cff);
  placeBeam(clamp((t-1)/2.2,0,1),(.05+clamp(t-2,0,9)*.05)*(1+Math.sin(t*40)*.15));
  sparks.forEach((m,i)=>{const u=(t*.5+i/sparks.length)%1;m.position.lerpVectors(vA,vB,u);m.visible=t>1.5;m.scale.setScalar(.6+Math.sin(t*13+i)*.3)});
  chainGroup.rotation.x=Math.sin(t*18)*Math.min(.5,t*.05);
  staticLayer.style.opacity=String(Math.min(.55,Math.max(0,t-2)/12));
  const s=clamp((t-3)*.006,0,.07);
  camera.position.set(Math.sin(t*53)*s,2.05+Math.sin(t*67)*s,3+Math.sin(t*41)*s*.5);camera.lookAt(0,2.1,-15);camera.rotateZ(Math.sin(t*37)*s*.6);
  setLine(t<5?'The black flame pours into the mirror.':'');
 }
 // NORMAL LAMP: the warm flame hits the mirror and the ghost burns away inside it. Then back to the menu.
 function containUpdate(dt){
  const t=endingTime;
  cameraLight.intensity=damp(cameraLight.intensity,t<5?30:10,2,dt);
  const fadeOut=clamp(1-(t-4.4)/1.2,0,1);
  if(fadeOut>0){placeBeam(clamp((t-.4)/1.6,0,1),.22);beamCore.material.opacity=.95*fadeOut;beamGlow.material.opacity=.35*fadeOut}else beam.visible=false;
  mirrorLight.intensity=damp(mirrorLight.intensity,t<4.4?(t>1.6?28+Math.sin(t*25)*5:6):0,3,dt);
  mirrorMat.emissiveIntensity=damp(mirrorMat.emissiveIntensity,t<4.4?(t>1.6?3.5+Math.sin(t*30)*1.2:.8):.06,3,dt);
  if(t<2)captive.material.opacity=.86*clamp(t,0,1);
  else if(t<4.5){const u=(t-2)/2.5;captive.material.opacity=.86*(1-u);captive.material.color.setHex(0xff9a7a);captive.position.x=Math.sin(t*60)*.24*u;captive.scale.set(1+u*.35,1-u*.25,1)}
  else captive.visible=false;
  for(const b of bits){const u=t-b.start;if(u<0||u>b.life){b.m.visible=false;continue}const k=u/b.life;b.m.visible=true;b.m.position.set(b.x+b.vx*u,b.y+b.vy*u,b.z+b.vz*u);b.m.material.opacity=1-k;b.m.material.color.setHSL(.62-.55*k,.9,.72);b.m.scale.setScalar(1-.5*k)}
  if(t>=2&&!cued){cued=true;audio.cue('wail',{x:0,y:-16},{volume:.9});audio.cue('shatter',{x:0,y:-16},{volume:.8})}
  setLine(t<2?'The mirror shows what it holds.':t>4.8?'The glass is quiet.':'');
  fadeEl.style.opacity=String(clamp((t-6.2)/1.4,0,1));
  if(t>8)finish();
 }

 return {audio:true,unlockAudio:()=>audio.unlock(),title:'The Fourth Game',intro:'The five pages brought you back to the mirror. The ghost waits beside the black lamp. Choose which flame to light.',help:'Choose with the on-screen buttons · B: black lamp · N: normal lamp',buttons:[['KeyB','LIGHT BLACK LAMP'],['KeyN','LIGHT NORMAL LAMP']],
  update(dt,t){
   audio.unlock();audio.update({x:camera.position.x,y:camera.position.z,angle:0},dt);audioClock-=dt;
   if(audioClock<=0){if(ending!=='release')audio.cue('wind',{x:0,y:-15},{volume:.4});audioClock=ending==='release'?5:6}
   if(!ending){if(input.tap('KeyB'))choose('release');if(input.tap('KeyN'))choose('contain');return}
   endingTime+=dt;
   if(ending==='release')releaseUpdate(dt);else containUpdate(dt);
  },
  draw(){renderer.render(scene,camera)},
  destroy(){audio.destroy();hud.remove();stage.dispose();if(!handedOff)meltdown?.abort()}
 };
}
