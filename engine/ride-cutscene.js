import {THREE,box,lantern} from './visuals.js';
import {clamp,rng} from './physics.js';
// The terminal ghost cutscene: a fragment appears, leaves a clue, then shows the cart a way out.
const FONT="'IM Fell English','Creepster',Georgia,serif";
const BW=2048,BH=1024,BOARD={cx:11.25,cy:4.5,cz:-5.5,w:18,h:9};
const ease=u=>{u=clamp(u,0,1);return u*u*(3-2*u)},easeOut=u=>1-Math.pow(1-clamp(u,0,1),2.2);
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const tex=(c,repeat)=>{const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat[0],repeat[1])}return t};
const toLocal=(px,py)=>new THREE.Vector3(BOARD.cx-.25,BOARD.cy+BOARD.h/2-py/BH*BOARD.h,BOARD.cz-BOARD.w/2+px/BW*BOARD.w);

export function faceCanvas(){
 const cv=mk(256,320),c=cv.getContext('2d'),r=rng(11);c.fillStyle='#000';c.fillRect(0,0,256,320);
 const sk=c.createLinearGradient(0,40,0,290);sk.addColorStop(0,'#85837c');sk.addColorStop(.5,'#5d5b57');sk.addColorStop(1,'#1c1b1b');
 c.fillStyle=sk;c.beginPath();c.ellipse(128,152,66,110,0,0,Math.PI*2);c.fill();
 for(const x of [84,172]){const g=c.createRadialGradient(x,188,2,x,188,40);g.addColorStop(0,'#000000d0');g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(x-42,146,84,84)}
 const brow=c.createLinearGradient(0,78,0,132);brow.addColorStop(0,'#00000000');brow.addColorStop(.6,'#000000b0');brow.addColorStop(1,'#00000000');c.fillStyle=brow;c.fillRect(60,78,136,56);
 for(const [x,rot] of [[94,.25],[162,-.25]]){c.save();c.translate(x,122);c.rotate(rot);const g=c.createRadialGradient(0,0,2,0,0,32);g.addColorStop(0,'#000');g.addColorStop(.75,'#050303');g.addColorStop(1,'#120c0c');c.fillStyle=g;c.beginPath();c.ellipse(0,0,23,32,0,0,Math.PI*2);c.fill();c.restore()}
 c.fillStyle='#000';c.beginPath();c.moveTo(128,158);c.lineTo(117,192);c.lineTo(128,185);c.lineTo(139,192);c.closePath();c.fill();
 c.beginPath();c.moveTo(86,214);c.quadraticCurveTo(128,198,170,214);c.quadraticCurveTo(186,264,128,296);c.quadraticCurveTo(70,264,86,214);c.fill();
 c.fillStyle='#bcb7a6';
 for(let i=0;i<9;i++){const x=91+i*9.6;c.beginPath();c.moveTo(x,208);c.lineTo(x+4.8,226+r()*12);c.lineTo(x+9.6,208);c.fill()}
 for(let i=0;i<7;i++){const x=99+i*10;c.beginPath();c.moveTo(x,288-i%3*3);c.lineTo(x+5,266-r()*9);c.lineTo(x+10,288-i%3*3);c.fill()}
 c.strokeStyle='#9a9486';c.lineWidth=1.6;for(let i=0;i<7;i++){const x=92+i*12;c.beginPath();c.moveTo(x,200);c.lineTo(x+3,216);c.stroke()}
 c.strokeStyle='#000000a0';c.lineWidth=1.5;for(let i=0;i<7;i++){let x=70+r()*116,y=52+r()*20;c.beginPath();c.moveTo(x,y);for(let k=0;k<5;k++){x+=r()*14-7;y+=12+r()*10;c.lineTo(x,y)}c.stroke()}
 c.globalCompositeOperation='destination-in';const m=c.createRadialGradient(128,165,40,128,165,150);m.addColorStop(0,'#fff');m.addColorStop(.72,'#ffffffd0');m.addColorStop(1,'#fff0');c.fillStyle=m;c.fillRect(0,0,256,320);
 return cv;
}
export function plankCanvas(){
 const cv=mk(512,512),c=cv.getContext('2d'),r=rng(5);c.fillStyle='#120b0a';c.fillRect(0,0,512,512);
 for(let x=0;x<512;x+=64){c.fillStyle=`hsl(18,24%,${9+r()*9}%)`;c.fillRect(x+2,0,60,512);c.fillStyle='#050302';c.fillRect(x,0,3,512);
  for(let i=0;i<36;i++){c.strokeStyle=`hsla(20,20%,${4+r()*9}%,.55)`;const gx=x+4+r()*56;c.beginPath();c.moveTo(gx,0);c.bezierCurveTo(gx+r()*8-4,170,gx+r()*8-4,340,gx+r()*6-3,512);c.stroke()}
  if(r()<.7){c.fillStyle='#060302';c.beginPath();c.ellipse(x+32,r()*512,7,12,0,0,Math.PI*2);c.fill()}}
 for(let i=0;i<10;i++){const x=r()*512,len=80+r()*320,g=c.createLinearGradient(0,0,0,len);g.addColorStop(0,'#3c0a0d90');g.addColorStop(1,'#3c0a0d00');c.fillStyle=g;c.fillRect(x,0,3+r()*5,len)}
 c.strokeStyle='#00000099';c.lineWidth=2;for(let i=0;i<14;i++){let x=r()*512,y=r()*512;c.beginPath();c.moveTo(x,y);for(let k=0;k<4;k++){x+=r()*30-15;y+=r()*40-10;c.lineTo(x,y)}c.stroke()}
 return cv;
}

function buildGhost(mats,eyeMats){
 const r=rng(23),root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const dark=new THREE.MeshStandardMaterial({color:0x040308,roughness:1,transparent:true,opacity:0,side:THREE.DoubleSide}),mid=new THREE.MeshStandardMaterial({color:0x0b0810,roughness:1,transparent:true,opacity:0,side:THREE.DoubleSide});mats.push(dark,mid);
 const prof=[[.45,5.25],[.8,4.75],[.95,3.6],[1.15,2.4],[1.5,1.2],[1.95,.1]].map(([x,y])=>new THREE.Vector2(x,y));
 body.add(new THREE.Mesh(new THREE.LatheGeometry(prof,18),dark));
 const outer=new THREE.Mesh(new THREE.LatheGeometry(prof.map(v=>new THREE.Vector2(v.x*1.07,v.y*.99)),14),mid);outer.rotation.y=.2;body.add(outer);
 const tatters=[];for(let i=0;i<28;i++){const a=i/28*Math.PI*2,h=1.2+r()*2.1,sh=new THREE.Shape();sh.moveTo(-.2,0);sh.lineTo(.2,0);sh.lineTo(.12,-h*.7);sh.lineTo(.03,-h);sh.lineTo(-.05,-h*.8);sh.lineTo(-.15,-h*.95);sh.closePath();const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),i%2?dark:mid),rad=1.3+r()*.55;m.position.set(Math.sin(a)*rad,1.55+r()*.5,Math.cos(a)*rad);m.rotation.y=a;tatters.push({m,phase:r()*6,amp:.1+r()*.14});body.add(m)}
 for(const s of [-1,1]){const sh=new THREE.Mesh(new THREE.SphereGeometry(.55,10,8),dark);sh.scale.set(1,.55,.9);sh.position.set(s*.85,4.6,0);body.add(sh)}
 const head=new THREE.Group();head.position.set(0,5.6,.1);body.add(head);
 const hood=new THREE.Mesh(new THREE.SphereGeometry(.98,22,16,Math.PI/2+.75,Math.PI*2-1.5,0,Math.PI*.78),dark);hood.scale.set(1,1.3,1.1);head.add(hood);
 const faceMat=new THREE.MeshBasicMaterial({map:tex(faceCanvas()),transparent:true,opacity:0,depthWrite:false,color:0xd9d0d0});mats.push(faceMat);
 const face=new THREE.Mesh(new THREE.PlaneGeometry(1.15,1.45),faceMat);face.position.set(0,0,.5);head.add(face);
 const eyes=[];for(const s of [-1,1]){const core=new THREE.MeshBasicMaterial({color:0xff2a1a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}),halo=new THREE.MeshBasicMaterial({color:0xff1208,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});eyeMats.push({core,halo});const e=new THREE.Mesh(new THREE.CircleGeometry(.07,14),core),h=new THREE.Mesh(new THREE.CircleGeometry(.26,16),halo);e.position.set(s*.155,.15,.53);h.position.set(s*.155,.15,.525);head.add(h,e);eyes.push(e,h)}
 const hair=[];for(let i=0;i<14;i++){const h=1.6+r()*1.9,g=new THREE.BoxGeometry(.035,h,.035);g.translate(0,-h/2,0);const m=new THREE.Mesh(g,dark);const a=(i/13-.5)*2.4;m.position.set(Math.sin(a)*.78,.55,Math.cos(a)*.35+.1);head.add(m);hair.push({m,phase:r()*6})}
 const redLight=new THREE.PointLight(0xff1a10,0,26,1.4);redLight.position.set(0,-.2,1.5);head.add(redLight);
 return {root,body,head,tatters,hair,redLight,eyes};
}

export function createCutscene({scene,camera,terminal,cart,wheels,lamp,lampTarget,audio,fadeEl,vignetteEl,onDone}){
 const T=terminal.position.clone(),R=rng(91),mats=[],eyeMats=[],dimmed=[];
 const station=new THREE.Group();terminal.add(station);
 const wallTex=tex(plankCanvas(),[5,2.6]),wallMat=new THREE.MeshStandardMaterial({map:wallTex,color:0xb9a9a0,roughness:1});
 const wall=new THREE.Mesh(new THREE.PlaneGeometry(46,18),wallMat);wall.position.set(11.4,4.5,-8);wall.rotation.y=-Math.PI/2;station.add(wall);
 const beamMat=new THREE.MeshStandardMaterial({color:0x1d120f,roughness:1});
 for(const z of [-26,-16,9,19])box(station,11.1,4.5,z,.6,18,.7,beamMat,false);
 box(station,11.1,9.5,-8,.5,.5,48,beamMat,false);box(station,11.1,.9,-8,.5,.5,48,beamMat,false);
 const chainMat=new THREE.MeshStandardMaterial({color:0x2b2b30,roughness:.6,metalness:.7});
 for(const z of [-13.5,-2.5,5])for(let k=0;k<9;k++)box(station,10.2,9.2-k*.42,z+Math.sin(k)*.05,.09,.3,.09,chainMat,false);
 const clock=new THREE.Mesh(new THREE.CircleGeometry(.9,24),new THREE.MeshStandardMaterial({color:0x3b3a34,roughness:.8}));clock.rotation.y=-Math.PI/2;clock.position.set(11.05,7.6,-15.5);station.add(clock);
 for(const [len,rot] of [[.65,.4],[.45,3.7]]){const hnd=box(station,11.0,7.6,-15.5,.03,len,.05,beamMat,false);hnd.rotation.x=rot;hnd.position.z+=Math.sin(rot)*len/2*-.0}
 const boardCv=mk(BW,BH),bc=boardCv.getContext('2d'),boardTex=tex(boardCv),boardMat=new THREE.MeshBasicMaterial({map:boardTex,transparent:true,depthWrite:false});
 const board=new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w,BOARD.h),boardMat);board.position.set(BOARD.cx,BOARD.cy,BOARD.cz);board.rotation.y=-Math.PI/2;station.add(board);
 const lampGroup=lantern(station,10.3,6.4,-5.5,0xffa24a),deadGroup=lantern(station,10.3,6.4,-13.8,0x6a4a2a),stationLight=new THREE.PointLight(0xffa24a,0,24,1.5);stationLight.position.set(9.6,6.2,-5.5);station.add(stationLight);
 const ghost=buildGhost(mats,eyeMats);ghost.root.rotation.y=-Math.PI/2;ghost.root.position.set(3,-2.8,-9);ghost.root.scale.setScalar(.52);ghost.root.visible=false;camera.add(ghost.root);
 // ---- timeline
 const A=5.4,B=2.6,FLICKER=8.9,BLACKOUT=10.4,GHOST0=11.6;
 const steps=[
  {type:'appear',d:2.8},
  {type:'reveal',lines:['YOU CAN','HEAR ME NOW'],d:3.2},
  {type:'reveal',lines:['FREE ME'],d:3},
  {type:'reveal',lines:['THE KEY','IS BENEATH THE EARTH','IN THE WEST HALL'],d:4},
  {type:'paper',d:5.2},
  {type:'leave',d:3.4},
  {type:'roll',d:5.8}
 ];
 let acc=GHOST0;for(const s of steps){s.t0=acc;acc+=s.d}
 const END=acc;
 let t=0,started=false,done=false,lastBoard='',windClock=3,blackoutPlayed=false,ghostAppeared=false,staticStarted=false,leaveFlag=0,paperShown=false;
 const dim0=[];
 const paperCanvas=mk(720,960),paperContext=paperCanvas.getContext('2d');
 paperContext.fillStyle='#ded0b1';paperContext.fillRect(0,0,720,960);
 paperContext.fillStyle='#b8aa8e';paperContext.fillRect(25,25,670,910);
 paperContext.fillStyle='#e7dec7';paperContext.fillRect(35,35,650,890);
 paperContext.strokeStyle='#7b6c58';paperContext.lineWidth=3;paperContext.strokeRect(54,54,612,852);
 paperContext.textAlign='center';paperContext.textBaseline='middle';paperContext.fillStyle='#211a1b';
 paperContext.font='400 43px "IM Fell English", Georgia, serif';paperContext.fillText('A NOTE FROM THE DARK',360,160);
 paperContext.font='italic 39px "IM Fell English", Georgia, serif';
 ['Return where first you raised your light;','Turn its beam from left to right.','The shadow that refuses flight','Marks the earth to dig tonight.'].forEach((line,i)=>paperContext.fillText(line,360,330+i*105));
 const paperTexture=tex(paperCanvas),paperMat=new THREE.MeshBasicMaterial({map:paperTexture,transparent:true,side:THREE.DoubleSide});
 const paper=new THREE.Mesh(new THREE.PlaneGeometry(1.62,2.16),paperMat);paper.position.set(.35,-2.5,-4);paper.rotation.z=-.12;paper.visible=false;camera.add(paper);
 // Board messages appear all at once; no writing hand or drip effect.
 function drawBoard(step){
  bc.clearRect(0,0,BW,BH);
  if(step?.type==='reveal'){
   const lines=step.lines,font=lines.length>2?148:lines.length===1?260:220;
   bc.textAlign='center';bc.textBaseline='middle';bc.font=`${font}px ${FONT}`;
   bc.shadowColor='#ff2118';bc.shadowBlur=16;bc.lineWidth=4;bc.strokeStyle='#300507';bc.fillStyle='#a30a12';
   lines.forEach((line,i)=>{const y=BH/2+(i-(lines.length-1)/2)*font*1.12;bc.strokeText(line,BW/2,y);bc.fillText(line,BW/2,y)});
  }
  boardTex.needsUpdate=true;
 }
 // ---- lighting helpers
 function collectLights(){scene.traverse(o=>{if(o.isLight&&o!==stationLight&&o!==ghost.redLight)dimmed.push({o,base:o.intensity})})}
 function setDim(k,lampK){for(const d of dimmed)d.o.intensity=d.base*(d.o===lamp?lampK:k)}
 function fadeGhost(a){for(const m of mats)m.opacity=a}
 function eyeLevel(a){for(const e of eyeMats){e.core.opacity=a;e.halo.opacity=a*.4}}
 // ---- camera
 const cam=new THREE.Vector3();
 function look(pos,yaw,pitchY,shake){camera.position.copy(pos);camera.lookAt(pos.x+Math.sin(yaw)*20,pos.y+pitchY,pos.z-Math.cos(yaw)*20);if(shake)camera.rotateZ(shake)}
 const cartLocalX=0,cartStartZ=26,cartStopZ=-8;
 function cartLocal(z){return new THREE.Vector3(cartLocalX,0,z)}
 const offA=new THREE.Vector3(-.7,3.9,9.5),offB=new THREE.Vector3(-.3,4.3,2.1);
 let cartZ=cartStartZ,speed=0,yaw=0,camLocal=new THREE.Vector3(),dolly=0,shakeAmp=0;
 return {end:END,
  start(){started=true;collectLights();for(const d of dimmed)dim0.push(d);scene.fog.color.setHex(0x050407);scene.background.setHex(0x050407);document.fonts?.load?.(`120px "IM Fell English"`)?.catch?.(()=>{});if(vignetteEl)vignetteEl.style.opacity='1';cart.position.set(T.x,.1,T.z+cartStartZ);cart.rotation.y=0},
  update(dt){if(!started||done)return;t+=dt;
   // dim lights
   let dim=1,lampK=1,lampFlick=1;
   if(t>FLICKER&&t<BLACKOUT){const f=Math.sin(t*41)+Math.sin(t*23.3)+Math.sin(t*9.1);lampFlick=f>.6?1:.1;dim=lampFlick>.5?1:.18;lampK=lampFlick}
   else if(t>=BLACKOUT){dim=.025;lampK=.18;lampFlick=0}
   const cur=steps.find(s=>t>=s.t0&&t<s.t0+s.d)||null;
   if(cur?.type==='leave'&&t-cur.t0>1.8&&t-cur.t0<2.3){dim=0;lampK=0}
   if(cur?.type==='roll'){dim=.03;lampK=1.0}
   setDim(dim,lampK);
   stationLight.intensity=34*lampFlick;lampGroup.children[0].material.color.setHex(lampFlick>.5?0xffa24a:0x2a1a10);
   if(t>=BLACKOUT&&!blackoutPlayed){blackoutPlayed=true;audio.cue('shatter',undefined,{volume:.8})}
   windClock-=dt;if(windClock<=0){audio.cue('wind',undefined,{volume:.9});windClock=6}
   // cart + camera
   const camBase=new THREE.Vector3();
   if(t<A){const u=t/A;cartZ=cartStartZ+(cartStopZ-cartStartZ)*easeOut(u);speed=(cartStartZ-cartStopZ)*2.2*Math.pow(1-clamp(u,0,1),1.2)/A;yaw=0;camLocal.set(cartLocalX+offA.x,offA.y,cartZ+offA.z);look(camLocal.clone().add(T),0,-1.7+Math.sin(t*3)*.03,0);camera.position.y+=Math.sin(t*14)*.01}
   else if(t<A+B){const u=ease((t-A)/B);cartZ=cartStopZ;speed=0;camLocal.set(cartLocalX+offA.x+(offB.x-offA.x)*u,offA.y+(offB.y-offA.y)*u,cartZ+offA.z+(offB.z-offA.z)*u);yaw=u*Math.PI/2;look(camLocal.clone().add(T),yaw,-1.7+1.55*u,0)}
   else if(cur?.type!=='roll'){cartZ=cartStopZ;speed=0;dolly=Math.min(1.7,(t-A-B)*.12);shakeAmp=t>=GHOST0?.004:0;camLocal.set(cartLocalX+offB.x+dolly,offB.y,cartZ+offB.z);const sh=shakeAmp?Math.sin(t*61)*shakeAmp+Math.sin(t*37)*shakeAmp:0;look(camLocal.clone().add(T).add(new THREE.Vector3(Math.sin(t*1.3)*.03,Math.sin(t*1.9)*.025,0)),Math.PI/2,-.15+Math.sin(t*.7)*.01,sh)}
   if(cur?.type==='roll'){const u=t-cur.t0;speed=Math.max(0,u-.6)*7.5;cartZ-=speed*dt;yaw=Math.PI/2*(1-ease(u/1.8));camLocal.set(cartLocalX+offB.x+1.7,offB.y,cartStopZ+offB.z);look(camLocal.clone().add(T),yaw,-.15*(1-ease(u/1.8))-.05,0);scene.fog.near=2;scene.fog.far=Math.max(26,95-u*14);if(fadeEl)fadeEl.style.opacity=String(clamp((u-3.6)/1.7,0,1));lampTarget.position.set(T.x,1,T.z+cartZ-40);lamp.position.set(T.x,2.4,T.z+cartZ-1.7)}
   cart.position.set(T.x,.1+(speed>.2?Math.sin(t*16)*.012:0),T.z+cartZ);
   for(const w of wheels)w.rotation.x-=speed*dt/.48;
   if(cur?.type!=='roll'){lampTarget.position.set(T.x+8,1,T.z+cartZ-30);lamp.position.set(T.x,2.4,T.z+cartZ-1.7)}
   // ghost
   const g=ghost;let alpha=0,eyes=0,red=0,stare=0,lunge=0;
   if(t>=GHOST0&&cur){ghost.root.visible=true;const ls=t-steps[0].t0;
    if(cur.type==='appear'){const u=t-cur.t0;eyes=u<.25?0:(u<.6?1:(Math.sin(u*40)>.2?1:.2));red=u<.25?0:6;alpha=u<1?0:u<1.15?.8:u<1.3?0:u<1.45?.6:u<1.6?0:clamp((u-1.6)/1.2,0,1);if(alpha>0)red=22}
    else if(cur.type==='leave'){const u=t-cur.t0;alpha=1;eyes=1;red=22+Math.sin(u*11)*4;stare=clamp(u/.8,0,1);lunge=clamp((u-1.4)/1.8,0,.7)}
    else if(cur.type==='roll'){alpha=.9}
    else{alpha=1;eyes=1;red=24+Math.sin(t*3.1)*3+(Math.random()<.03?10:0)}
   }else if(t>=GHOST0)alpha=0;
   fadeGhost(alpha);eyeLevel(eyes);g.redLight.intensity=red;
   const near=Math.max(0,t-GHOST0);g.root.position.set(3+Math.sin(t*.7)*.06,-2.8+Math.sin(t*1.3)*.06,-9+lunge*.35);g.root.rotation.y=-Math.PI/2+Math.sin(t*.5)*.035;g.root.scale.setScalar(.52);
   for(const tt of g.tatters){tt.m.rotation.x=Math.sin(t*1.3+tt.phase)*tt.amp+.05;tt.m.rotation.z=Math.cos(t*1.1+tt.phase)*tt.amp*.6}
   for(const h of g.hair){h.m.rotation.z=Math.sin(t*1.4+h.phase)*.1;h.m.rotation.x=Math.cos(t*1.1+h.phase)*.07}
   // head: tilt, creep toward camera
   const twitch=Math.random()<.012?(Math.random()-.5)*.4:0;g.head.rotation.z=.2+Math.sin(t*.9)*.05+twitch;g.head.rotation.x=.12+stare*.1;g.head.rotation.y=(1-stare)*(-.35+Math.sin(t*.6)*.1);
   if(cur?.type==='reveal'&&lastBoard!==cur.lines.join('|')){drawBoard(cur);lastBoard=cur.lines.join('|')}
   if(cur?.type==='paper'&&!paperShown){paperShown=true;paper.visible=true;audio.cue('paper',undefined,{volume:.9})}
   if(paperShown){const u=clamp((t-steps.find(s=>s.type==='paper').t0)/1.2,0,1);paper.position.y=-1.5+easeOut(u)*1.5+Math.sin(t*9)*.025;paper.position.x=.35+Math.sin(t*3.1)*.08;paper.rotation.z=-.12+Math.sin(t*5.7)*.035}
   if(cur?.type==='leave'&&lastBoard!=='cleared'){drawBoard(null);lastBoard='cleared'}
   if(cur?.type==='appear'&&!ghostAppeared&&t-cur.t0>1.0){ghostAppeared=true;audio.cue('keeper',undefined,{volume:.9});audio.cue('ghost',undefined,{volume:.9})}
   if(cur?.type==='appear'&&!staticStarted&&t-cur.t0>=1.6){staticStarted=true;audio.horrorBed(true,{intensity:.52})}
   if(cur?.type==='leave'&&!leaveFlag&&t-cur.t0>1.4){leaveFlag=1;audio.cue('door',undefined,{volume:.8});audio.cue('ghost',undefined,{volume:1})}
   if(t>=END&&!done){done=true;audio.horrorBed(false);paper.visible=false;onDone()}
  },
  debug:{board:boardCv,ghost},
  dispose(){audio.horrorBed(false);camera.remove(paper);paper.geometry.dispose();paperTexture.dispose();paperMat.dispose();scene.remove(station);terminal.remove(station)}};
}
