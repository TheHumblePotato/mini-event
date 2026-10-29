import {THREE,box,lantern} from './visuals.js';
import {clamp,rng} from './physics.js';
// The terminal ghost cutscene: the cart rolls in, the camera turns to the station wall,
// the lights die, and something writes on the boards in blood.
const FONT="'Creepster','Nosifer',Impact,'Arial Black',fantasy";
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

function makeArm(parent,x,sleeve,skin,tip){
 const root=new THREE.Group();root.position.set(x,4.55,.05);parent.add(root);
 const geo=new THREE.CylinderGeometry(.05,.15,1,8);geo.rotateX(Math.PI/2);geo.translate(0,0,.5);const tube=new THREE.Mesh(geo,sleeve);root.add(tube);
 const hand=new THREE.Group();root.add(hand);const palm=new THREE.Mesh(new THREE.BoxGeometry(.34,.09,.36),skin);palm.position.z=.18;hand.add(palm);
 for(const [fx,len,curl] of [[-.125,.5,1.0],[-.045,.82,.04],[.045,.6,.9],[.125,.42,1.1]]){const f=new THREE.Group();f.position.set(fx,0,.36);hand.add(f);const a=new THREE.Mesh(new THREE.BoxGeometry(.05,.045,len*.55),skin);a.position.z=len*.275;f.add(a);const j=new THREE.Group();j.position.z=len*.55;j.rotation.x=curl;f.add(j);const b=new THREE.Mesh(new THREE.BoxGeometry(.042,.04,len*.45),skin);b.position.z=len*.225;j.add(b);const t=new THREE.Mesh(new THREE.BoxGeometry(.044,.042,.07),tip);t.position.z=len*.45;j.add(t)}
 const th=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,.3),skin);th.position.set(.2,0,.12);th.rotation.y=-.7;hand.add(th);
 return {root,tube,hand};
}
function buildGhost(mats,eyeMats){
 const r=rng(23),root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const dark=new THREE.MeshStandardMaterial({color:0x040308,roughness:1,transparent:true,opacity:0,side:THREE.DoubleSide}),mid=new THREE.MeshStandardMaterial({color:0x0b0810,roughness:1,transparent:true,opacity:0,side:THREE.DoubleSide});
 const skin=new THREE.MeshStandardMaterial({color:0x9b958a,roughness:.9,emissive:0x1d1514,transparent:true,opacity:0}),tip=new THREE.MeshStandardMaterial({color:0x5c070b,roughness:.6,emissive:0x2a0204,transparent:true,opacity:0});mats.push(dark,mid,skin,tip);
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
 const right=makeArm(body,.9,dark,skin,tip),left=makeArm(body,-.9,dark,skin,tip);
 return {root,body,head,tatters,hair,right,left,redLight,eyes};
}

export function createCutscene({scene,camera,terminal,cart,wheels,lamp,lampTarget,audio,fadeEl,vignetteEl,onDone}){
 const T=terminal.position.clone(),R=rng(91),mats=[],eyeMats=[],dimmed=[];
 const station=new THREE.Group();terminal.add(station);
 const wallTex=tex(plankCanvas(),[5,2.6]),wallMat=new THREE.MeshStandardMaterial({map:wallTex,color:0xb9a9a0,roughness:1});
 const wall=new THREE.Mesh(new THREE.PlaneGeometry(46,18),wallMat);wall.position.set(11.4,4.5,-8);wall.rotation.y=-Math.PI/2;station.add(wall);
 const beamMat=new THREE.MeshStandardMaterial({color:0x1d120f,roughness:1});
 for(const z of [-26,-16,-1.5,9,19])box(station,11.1,4.5,z,.6,18,.7,beamMat,false);
 box(station,11.1,9.5,-8,.5,.5,48,beamMat,false);box(station,11.1,.9,-8,.5,.5,48,beamMat,false);
 const chainMat=new THREE.MeshStandardMaterial({color:0x2b2b30,roughness:.6,metalness:.7});
 for(const z of [-13.5,-2.5,5])for(let k=0;k<9;k++)box(station,10.2,9.2-k*.42,z+Math.sin(k)*.05,.09,.3,.09,chainMat,false);
 const clock=new THREE.Mesh(new THREE.CircleGeometry(.9,24),new THREE.MeshStandardMaterial({color:0x3b3a34,roughness:.8}));clock.rotation.y=-Math.PI/2;clock.position.set(11.05,7.6,-15.5);station.add(clock);
 for(const [len,rot] of [[.65,.4],[.45,3.7]]){const hnd=box(station,11.0,7.6,-15.5,.03,len,.05,beamMat,false);hnd.rotation.x=rot;hnd.position.z+=Math.sin(rot)*len/2*-.0}
 const boardCv=mk(BW,BH),bc=boardCv.getContext('2d'),boardTex=tex(boardCv),boardMat=new THREE.MeshBasicMaterial({map:boardTex,transparent:true,depthWrite:false});
 const board=new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w,BOARD.h),boardMat);board.position.set(BOARD.cx,BOARD.cy,BOARD.cz);board.rotation.y=-Math.PI/2;station.add(board);
 const lampGroup=lantern(station,10.3,6.4,-5.5,0xffa24a),deadGroup=lantern(station,10.3,6.4,-13.8,0x6a4a2a),stationLight=new THREE.PointLight(0xffa24a,0,24,1.5);stationLight.position.set(9.6,6.2,-5.5);station.add(stationLight);
 const ghost=buildGhost(mats,eyeMats);ghost.root.rotation.y=-Math.PI/2;ghost.root.position.set(7.6,.5,-11.3);ghost.root.visible=false;station.add(ghost.root);
 // ---- timeline
 const A=5.4,B=2.6,FLICKER=8.9,BLACKOUT=10.4,GHOST0=11.6;
 const steps=[{type:'appear',d:2.8},
  {type:'write',lines:['YOU CAN','HEAR ME NOW'],font:230,gap:1.02,cy:470,char:.15,hold:2.2,drip:2.7},
  {type:'write',lines:['FREE ME'],font:340,gap:1,cy:500,char:.3,hold:1.7,drip:2.4},
  {type:'write',lines:['RETURN TO WHERE','YOU STARTED','','FIND THE ROOM','UNCHARTED'],font:132,gap:1.02,cy:365,char:.085,hold:.5,symbol:2.8,endHold:4.8,drip:0},
  {type:'leave',d:3.4},{type:'roll',d:5.8}];
 let acc=GHOST0;for(const s of steps){s.t0=acc;if(s.type==='write'){s.letters=null;s.writeTime=0}acc+=(s.d||0);if(s.type==='write'){s.count=s.lines.join('').length;s.writeTime=s.count*s.char;s.d=s.writeTime+s.hold+(s.symbol||0)+(s.endHold||0)+s.drip+.5;acc+=s.d}}
 const END=acc;
 let t=0,started=false,done=false,lastBoard='',dripClock=0,windClock=3,blackoutPlayed=false,ghostAppeared=false,leaveFlag=0,flares=0;
 const dim0=[];
 const tmp=new THREE.Vector3(),handPos=new THREE.Vector3(),worldT=new THREE.Vector3();
 // ---- board writing
 function layout(step){const ctx=bc;ctx.font=`100px ${FONT}`;const widest=Math.max(...step.lines.map(l=>ctx.measureText(l).width||1));const cx=1320,maxW=1380;let size=Math.min(step.font,step.font*(maxW/(widest*step.font/100)));size=Math.min(step.font,size);ctx.font=`${size}px ${FONT}`;const out=[];let yy=step.cy-((step.lines.length-1)*size*step.gap)/2;let idx=0;for(const line of step.lines){let w=0;const ws=[];for(const ch of line){const cw=ctx.measureText(ch).width+size*.04;ws.push(cw);w+=cw}let x=cx-w/2,i=0;for(const ch of line){if(ch!==' '){out.push({ch,x,y:yy,size,w:ws[i],rot:(R()-.5)*.14,jy:(R()-.5)*size*.08,delay:R()*1.1,seed:R(),i:idx++})}x+=ws[i++]}yy+=size*step.gap}step.letters=out;step.size=size}
 const SYM=[[0,-1],[1,0],[0,1],[-1,0],[0,-1],[0,1]];
 const symPoint=(f)=>{const n=SYM.length-1,k=Math.min(n-1,Math.floor(f*n)),u=f*n-k,cx=1320,cy=880,w=105,h=140,a=SYM[k],b=SYM[k+1];return {x:cx+(a[0]+(b[0]-a[0])*u)*w,y:cy+(a[1]+(b[1]-a[1])*u)*h}};
 let aimTarget=null;
 function drawBoard(step,local){const c=bc;c.clearRect(0,0,BW,BH);if(!step||step.type!=='write'){boardTex.needsUpdate=true;return}
  if(!step.letters)layout(step);const wt=step.writeTime,shown=local/step.char,symStart=wt+step.hold,dripStart=wt+step.hold+(step.symbol||0)+(step.endHold||0);const dripT=local-dripStart;aimTarget=null;
  c.textBaseline='alphabetic';c.font=`${step.size}px ${FONT}`;c.lineJoin='round';
  for(const L of step.letters){const born=L.i*step.char;const age=local-born;if(age<0)continue;const pop=clamp(age/.28,0,1);let off=0,alpha=pop,stretch=1;
   const idle=clamp((local-wt)/4,0,1);let streak=L.size*(.05+.22*L.seed)*idle*(dripT>0?0:1)+(age>.3?L.size*.04*pop:0);
   if(dripT>0){const p=Math.max(0,dripT-L.delay);off=p*p*340+p*34;stretch=1+p*.9;alpha=clamp(1-p/1.5,0,1)*pop;streak=Math.max(streak,off+L.size*.28)}
   if(alpha<=0)continue;
   c.save();c.globalAlpha=alpha;
   if(streak>2){const sx=L.x+L.w*.45,sy=L.y+L.jy,g=c.createLinearGradient(0,sy,0,sy+streak);g.addColorStop(0,'#8f0a12');g.addColorStop(1,'#5a060b');c.strokeStyle=g;c.lineCap='round';c.lineWidth=Math.max(5,L.size*.045);c.beginPath();c.moveTo(sx,sy-L.size*.1);c.lineTo(sx,sy+streak);c.stroke();c.fillStyle='#6d0709';c.beginPath();c.arc(sx,sy+streak+2,Math.max(5,L.size*.035),0,Math.PI*2);c.fill()}
   c.translate(L.x+L.w/2,L.y+L.jy+off);c.rotate(L.rot);c.scale(1+(1-pop)*.2,(.8+pop*.2)*stretch);
   c.shadowColor='#ff1b1b';c.shadowBlur=pop<1?28:16;c.lineWidth=L.size*.05;c.strokeStyle='#2c0205';c.strokeText(L.ch,-L.w/2,0);c.fillStyle='#a30a12';c.fillText(L.ch,-L.w/2,0);c.shadowBlur=0;c.fillStyle='#d83a36';c.globalAlpha=alpha*.28;c.fillText(L.ch,-L.w/2-L.size*.012,-L.size*.012);
   c.restore();
   if(shown>=L.i&&shown<L.i+1&&dripT<=0)aimTarget={x:L.x+L.w/2,y:L.y-L.size*.35};
  }
  if(step.symbol){const f=clamp((local-symStart)/step.symbol,0,1),p=(local>=symStart)?symPoint(f):null;
   if(local>=symStart){const total=SYM.length-1,full=Math.floor(f*total);c.save();c.strokeStyle='#a30a12';c.lineWidth=15;c.lineCap='round';c.lineJoin='round';c.shadowColor='#ff1b1b';c.shadowBlur=22;c.beginPath();let a=symPoint(0);c.moveTo(a.x,a.y);for(let k=1;k<=full;k++){const q=symPoint(k/total);c.lineTo(q.x,q.y)}c.lineTo(p.x,p.y);c.stroke();c.restore();
    if(f<1)aimTarget={x:p.x,y:p.y};else{const dl=clamp((local-symStart-step.symbol)/2.5,0,1);c.save();c.strokeStyle='#6d0709';c.lineWidth=9;c.lineCap='round';for(const [dx,dy,k] of [[0,-1,.9],[1,0,1.4],[0,1,1.1],[-1,0,.7]]){const q=symPoint(0);const px=1320+dx*105,py=880+dy*140;c.beginPath();c.moveTo(px,py);c.lineTo(px,py+dl*70*k);c.stroke()}c.restore()}}}
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
  start(){started=true;collectLights();for(const d of dimmed)dim0.push(d);scene.fog.color.setHex(0x050407);scene.background.setHex(0x050407);document.fonts?.load?.(`120px Creepster`)?.catch?.(()=>{});if(vignetteEl)vignetteEl.style.opacity='1';cart.position.set(T.x,.1,T.z+cartStartZ);cart.rotation.y=0},
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
   if(t>FLICKER&&Math.random()<.04)audio.cue('armor',undefined,{volume:.2});
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
    else if(cur.type==='leave'){const u=t-cur.t0;alpha=1;eyes=1;red=26+Math.sin(u*30)*6;stare=clamp(u/.8,0,1);if(u>1.4)lunge=clamp((u-1.4)/.38,0,1);if(u>1.8){alpha=0;eyes=0;red=0;lunge=1}}
    else if(cur.type==='roll'){alpha=0}
    else{alpha=1;eyes=1;red=24+Math.sin(t*3.1)*3+(Math.random()<.03?10:0)}
   }else if(t>=GHOST0)alpha=0;
   fadeGhost(alpha);eyeLevel(eyes);g.redLight.intensity=red;
   const near=Math.max(0,t-GHOST0);const gx=7.6-Math.min(.9,near*.02)-lunge*lunge*4.2;g.root.position.set(gx+(Math.random()<.01?.08:0),.5+Math.sin(t*1.3)*.12,-11.3+lunge*2.6);g.root.rotation.y=-Math.PI/2+Math.sin(t*.5)*.05;g.root.scale.setScalar(1+lunge*.25);
   for(const tt of g.tatters){tt.m.rotation.x=Math.sin(t*1.3+tt.phase)*tt.amp+.05;tt.m.rotation.z=Math.cos(t*1.1+tt.phase)*tt.amp*.6}
   for(const h of g.hair){h.m.rotation.z=Math.sin(t*1.4+h.phase)*.1;h.m.rotation.x=Math.cos(t*1.1+h.phase)*.07}
   // head: tilt, creep toward camera
   const twitch=Math.random()<.012?(Math.random()-.5)*.4:0;g.head.rotation.z=.2+Math.sin(t*.9)*.05+twitch;g.head.rotation.x=.12+stare*.1;g.head.rotation.y=(1-stare)*(-.35+Math.sin(t*.6)*.1);
   // arms
   ghost.root.updateMatrixWorld(true);
   const local=cur&&cur.type==='write'?t-cur.t0:0;
   if(cur?.type==='write'){drawBoard(cur,local);const q=aimTarget;if(q){worldT.copy(toLocal(q.x,q.y));worldT.x=BOARD.cx-.5;worldT.y+=Math.sin(t*23)*.03;worldT.z+=Math.sin(t*17)*.03;terminal.localToWorld(worldT);handPos.lerp(worldT,1-Math.exp(-dt*10))}
    else{worldT.set(10.0,2.6,-6);terminal.localToWorld(worldT);handPos.lerp(worldT,1-Math.exp(-dt*3))}}
   else{if(cur?.type==='leave'&&t-cur.t0>1.8&&lastBoard!=='cleared'){bc.clearRect(0,0,BW,BH);boardTex.needsUpdate=true;lastBoard='cleared'}
    ghost.root.localToWorld(worldT.set(1.4,2.6,1.4));handPos.lerp(worldT,1-Math.exp(-dt*3))}
   {g.right.root.parent.updateWorldMatrix(true,false);g.right.root.lookAt(handPos);g.right.root.getWorldPosition(tmp);const d=tmp.distanceTo(handPos),len=Math.max(.7,d-1.18);g.right.tube.scale.z=len;g.right.hand.position.z=len;g.right.hand.rotation.z=Math.sin(t*7)*.08}
   g.left.root.rotation.x=Math.PI/2*.93+Math.sin(t*.8)*.05;g.left.root.rotation.z=.12;g.left.tube.scale.z=3.3;g.left.hand.position.z=3.3;
   // writing & drip sounds
   if(cur?.type==='write'){const dripT=local-(cur.writeTime+cur.hold+(cur.symbol||0)+(cur.endHold||0));if(dripT>0&&dripT<cur.drip){dripClock-=dt;if(dripClock<=0){audio.cue('drip',undefined,{volume:.8});dripClock=.3}}
    if(!cur.started){cur.started=true;audio.cue('mimic',undefined,{volume:.5})}}
   if(cur?.type==='appear'&&!ghostAppeared&&t-cur.t0>1.0){ghostAppeared=true;audio.cue('boss',undefined,{volume:.9});audio.cue('ghost',undefined,{volume:.9})}
   if(cur?.type==='leave'&&!leaveFlag&&t-cur.t0>1.4){leaveFlag=1;audio.cue('crash',undefined,{volume:.8});audio.cue('ghost',undefined,{volume:1})}
   if(cur&&cur.type!=='write'&&cur.type!=='leave'&&lastBoard!=='blank'&&cur.type==='appear'){drawBoard(null);lastBoard='blank'}
   if(t>=END&&!done){done=true;onDone()}
  },
  debug:{board:boardCv,ghost},
  dispose(){scene.remove(station);terminal.remove(station)}};
}
