import {createSpatialAudio} from './spatial-audio.js';
import {THREE,createStage,material,box,lantern,spirit,planeText} from './visuals.js';
import {damp} from './physics.js';

export function createChamber(canvas,input,hooks){
 const stage=createStage(canvas,{fog:0x07070d,near:18,far:58}),{scene,camera,renderer}=stage,audio=createSpatialAudio(hooks,50);
 const stone=material(0x47434d,'stone'),iron=material(0x24212b,null,{metalness:.7,roughness:.36}),wood=material(0x30252a,'wood');
 box(scene,0,-.35,-4,20,.7,34,stone);
 box(scene,0,4,-20,20,8,.7,stone);
 box(scene,-10,4,-4,.7,8,33,stone);box(scene,10,4,-4,.7,8,33,stone);
 box(scene,0,8,-4,20,.6,34,stone);
 for(let z=8;z>-19;z-=5){box(scene,-9.6,4,z,.15,8,.3,wood);box(scene,9.6,4,z,.15,8,.3,wood)}
 for(const x of [-7,7])for(const z of [-17,-10,-3,4]){box(scene,x,3.8,z,.32,7.6,.4,iron);box(scene,x,7.7,z,.7,.25,.7,wood)}

 const mirrorFrame=material(0x6e5544,null,{metalness:.55,roughness:.38});
 for(const x of [-3.4,3.4])box(scene,x,3.2,-17.5,.3,6.6,.5,mirrorFrame);
 for(const y of [.05,6.4])box(scene,0,y,-17.5,6.9,.3,.5,mirrorFrame);
 const mirrorMat=new THREE.MeshStandardMaterial({color:0x101018,metalness:.86,roughness:.12,emissive:0x351b49,emissiveIntensity:.08});
 const mirror=new THREE.Mesh(new THREE.PlaneGeometry(6.5,6.1),mirrorMat);mirror.position.set(0,3.25,-17.22);scene.add(mirror);
 const warning=planeText(scene,'NEVER FREE HIM',0,3.2,-17.12,5.8,1.1,{font:'bold 76px Georgia',bg:'#180d14',color:'#e4cbb7'});warning.visible=false;
 const captive=spirit(scene,0,.1,-15.8,5.1);captive.position.set(0,.1,-15.8);captive.material.transparent=true;captive.material.opacity=.86;
 const chainGroup=new THREE.Group();scene.add(chainGroup);
 for(const side of [-1,1])for(let n=0;n<13;n++){const link=box(chainGroup,side*(.8+n*.13),1+n*.29,-15.2-n*.08,.09,.38,.09,iron,false);link.rotation.z=(n%2?1:-1)*.35}
 const ambience=new THREE.PointLight(0x342c49,9,38);ambience.position.set(0,6,-5);scene.add(ambience);
 const mirrorLight=new THREE.PointLight(0x642e83,0,22);mirrorLight.position.set(0,3.2,-15);scene.add(mirrorLight);
 const cameraLight=new THREE.SpotLight(0x9b70cb,0,24,.34,.45,1.3);cameraLight.position.set(.56,-.12,-1.15);camera.add(cameraLight);
 const lightTarget=new THREE.Object3D();lightTarget.position.set(0,0,-16);camera.add(lightTarget);cameraLight.target=lightTarget;
 const heldLamp=new THREE.Group();camera.add(heldLamp);heldLamp.position.set(.57,-.19,-1.25);
 const handheld=lantern(heldLamp,0,0,0,0x171323);handheld.scale.setScalar(.83);
 const glass=new THREE.Mesh(new THREE.BoxGeometry(.2,.3,.2),new THREE.MeshBasicMaterial({color:0x6c4a99}));
 handheld.add(glass);glass.position.set(0,0,0);
 const sleeve=material(0x211c28,'wood'),skin=material(0x9d8374);
 box(heldLamp,.02,-.48,.13,.29,.45,.48,sleeve,false);box(heldLamp,.02,-.24,-.02,.22,.21,.23,skin,false);
 const normalLamp=lantern(heldLamp,-.58,-.12,-1.23,0xa76539);normalLamp.scale.setScalar(.56);normalLamp.visible=false;

 const sparks=Array.from({length:28},()=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(.055,6,6),new THREE.MeshBasicMaterial({color:0xb88bff,transparent:true,opacity:.85}));scene.add(mesh);mesh.visible=false;return mesh});
 const hud=document.createElement('div');hud.className='world-hud chamber-hud final-chamber';
 hud.innerHTML='<div class="hud-top"><span>THE FOURTH GAME</span><span>THE RETURN CHAMBER</span></div><p class="world-whisper">“You brought it back. The mirror is listening. Choose which flame you trust.”</p><div class="final-choices"><button id="light-black" class="final-choice">LIGHT THE BLACK LAMP</button><button id="light-normal" class="final-choice">LIGHT THE NORMAL LAMP</button></div><div class="ending-corruption" aria-hidden="true"></div>';
 canvas.parentElement.append(hud);
 const whisper=hud.querySelector('.world-whisper'),choices=hud.querySelector('.final-choices'),staticLayer=hud.querySelector('.ending-corruption');
 camera.position.set(0,1.65,7.5);camera.lookAt(0,1.65,-15);
 let ending=null,endingTime=0,pending=false,reported=false,audioClock=0;
 async function choose(kind){
  if(pending||ending)return;
  pending=true;
  try{await hooks.onStory('entered');}
  catch(error){hooks.toast(error.message);pending=false;return}
  ending=kind;endingTime=0;choices.hidden=true;hud.classList.add('cinematic');
  cameraLight.color.setHex(kind==='release'?0x9b70cb:0xf2bd79);
  cameraLight.intensity=kind==='release'?0:0;
  normalLamp.visible=kind==='contain';
  glass.material.color.setHex(kind==='release'?0x9d70e4:0xffc36c);
  audio.cue(kind==='release'?'ghost':'lantern',{x:0,y:-15},{volume:.85});
  if(kind==='release')audio.horrorBed(true,{intensity:.92});
  if(kind==='contain'){
   whisper.textContent='The mirror catches the warmer flame. The words appear.';
   warning.visible=true;mirrorLight.color.setHex(0xd44b4e);mirrorLight.intensity=8;
   mirrorMat.emissive.setHex(0xa63038);mirrorMat.emissiveIntensity=1.5;
  }else{
   whisper.textContent='The black flame pours into the mirror. Something is coming through.';
   sparks.forEach(mesh=>mesh.visible=true);
   mirrorLight.color.setHex(0x9c5bea);mirrorLight.intensity=0;
   mirrorMat.emissive.setHex(0x8c4acb);mirrorMat.emissiveIntensity=.1;
  }
 }
 hud.querySelector('#light-black').onclick=()=>choose('release');
 hud.querySelector('#light-normal').onclick=()=>choose('contain');
 function finish(){if(reported)return;reported=true;hooks.onEnd({won:true,score:0,ending})}
 return {audio:true,unlockAudio:()=>audio.unlock(),title:'The Fourth Game',intro:'The five pages brought you back to the mirror. The ghost waits beside the black lamp. Choose which flame to light.',help:'Choose with the on-screen buttons · B: black lamp · N: normal lamp',buttons:[['KeyB','LIGHT BLACK LAMP'],['KeyN','LIGHT NORMAL LAMP']],
  update(dt,t){
   audio.unlock();audio.update({x:camera.position.x,y:camera.position.z,angle:0},dt);audioClock-=dt;
   if(audioClock<=0){if(ending!=='release')audio.cue('wind',{x:0,y:-15},{volume:.4});audioClock=ending==='release'?5:6}
   if(!ending){if(input.tap('KeyB'))choose('release');if(input.tap('KeyN'))choose('contain');return}
   endingTime+=dt;
   if(ending==='release'){
    cameraLight.intensity=damp(cameraLight.intensity,55,2.1,dt);
    mirrorLight.intensity=damp(mirrorLight.intensity,70,1.8,dt);
    mirrorMat.emissiveIntensity=damp(mirrorMat.emissiveIntensity,3.5,1.5,dt);
    chainGroup.rotation.x=Math.sin(endingTime*18)*Math.min(.5,endingTime*.05);
    const from=new THREE.Vector3();camera.getWorldPosition(from);from.add(new THREE.Vector3(.57,-.2,-1.5).applyQuaternion(camera.quaternion));
    const to=new THREE.Vector3(0,3.1,-17.05);
    sparks.forEach((mesh,i)=>{const u=(endingTime*.42+i/sparks.length)%1;mesh.position.lerpVectors(from,to,u);mesh.scale.setScalar(.7+Math.sin(endingTime*13+i)*.3)});
    if(endingTime>1.8){captive.visible=true;captive.position.x=damp(captive.position.x,0,1.1,dt);captive.position.z=damp(captive.position.z,3.1,1.1,dt);captive.scale.setScalar(1+Math.min(1.5,(endingTime-1.8)*.16));captive.material.opacity=Math.min(1,.7+(endingTime-1.8)*.12)}
    if(endingTime>4){staticLayer.style.opacity=String(Math.min(1,(endingTime-4)/2.2));}
    if(endingTime>7.5){staticLayer.classList.add('pure');whisper.textContent='';}
    if(endingTime>9.2)finish();
   }else{
    cameraLight.intensity=damp(cameraLight.intensity,34,2,dt);mirrorLight.intensity=damp(mirrorLight.intensity,0,2.8,dt);
    if(endingTime>1.3){camera.position.z=damp(camera.position.z,22,1.1,dt);camera.position.y=1.65+Math.sin(endingTime*8)*.07;camera.lookAt(0,1.65,-16)}
    if(endingTime>3.2)whisper.textContent='“I can wait.”';
    if(endingTime>6.1)finish();
   }
  },
  draw(){renderer.render(scene,camera)},
  destroy(){audio.destroy();hud.remove();stage.dispose()}
 };
}
