// The black-lamp ending, outside the game canvas: the real website breaks down, goes dark,
// says GOOD CHOICE, and is then destroyed by the ghost. Purely visual and temporary:
// every page change is recorded and restored by release() / abort().
// Reduced-motion players get a calm variant: no strobing flashes, shaking or white-out.
import {faceCanvas} from './ride-cutscene.js';

// Timeline (seconds from start). The 3D chamber scene runs its own flicker/beam show for the first ~20s.
const T_A=9,T_BLACK=20,T_GOOD=21.8,T_C=25.5;      // breakdown / blackout / GOOD CHOICE / takeover
const C_WHITE=11.7,C_END=13.4;                      // takeover-relative: white-out, completion
const FLASHES=[{at:1.0,d:.08},{at:1.75,d:.14},{at:2.5,d:.3}];
const FALLS=[[3.3,'.brand'],[3.7,'#sound-button'],[4.0,'#settings-button'],[4.3,'#casebook-button'],[4.6,'#account-button'],[5.6,'.game-toolbar'],[7.4,'.canvas-wrap'],[8.8,'.game-help'],[9.2,'.touch-controls'],[9.6,'#app'],[10,'.night-scene','fade'],[10,'.site-header','fade']];
const CRACKS=[3.6,4.5,5.2,5.9,6.5,7.0,7.5,7.9,8.3,8.7,9.1,9.5,9.9,10.3];
const LINES=[[4.0,'YOU LET ME OUT'],[6.3,'THANK YOU'],[8.3,'I CAN SEE YOU'],[10.1,'NOW IT IS MINE']];
const GLYPHS='░▒▓█▚▞#%&ǂ¦§†‡Ø';
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const corrupt=(s,p)=>[...s].map(ch=>ch!==' '&&Math.random()<p?GLYPHS[Math.floor(Math.random()*GLYPHS.length)]:ch).join('');
const vibrate=p=>{try{navigator.vibrate?.(p)}catch{}};
let current=null;

const CSS=`
#mx-root{position:fixed;inset:0;z-index:2147483000;pointer-events:none;overflow:hidden}
#mx-root.block{pointer-events:auto;cursor:none}
#mx-root>*{position:absolute;inset:0}
#mx-dark{background:radial-gradient(ellipse at 50% 46%,#0000 0,#000e 62%,#000 100%);opacity:0}
#mx-canvas{width:100%;height:100%;image-rendering:pixelated;opacity:0}
#mx-black{background:#000;opacity:0}
#mx-text{display:grid;place-items:center;text-align:center;color:#b0000d;font:600 clamp(40px,10vw,150px)/1 'Cormorant Garamond',Georgia,serif;letter-spacing:.12em;text-shadow:0 0 30px #f00,0 0 90px #700;opacity:0;white-space:pre-line;padding:5vw}
#mx-text.on{opacity:1}
#mx-text.small{font-size:clamp(26px,6vw,88px);place-items:end center;padding-bottom:12vh;color:#d3101c}
#mx-text.jit{animation:mx-jit .09s steps(2) infinite}
@keyframes mx-jit{0%{transform:translate(-3px,2px)}50%{transform:translate(4px,-3px) skewX(3deg)}100%{transform:translate(-2px,-1px)}}
.mx-shake1{animation:mx-s1 .11s steps(2) infinite}
.mx-shake2{animation:mx-s2 .07s steps(2) infinite}
@keyframes mx-s1{0%{transform:translate(0,0)}50%{transform:translate(-2px,1px)}100%{transform:translate(2px,-1px)}}
@keyframes mx-s2{0%{transform:translate(-6px,3px) rotate(-.3deg)}50%{transform:translate(5px,-4px) skewX(1.5deg)}100%{transform:translate(-3px,-5px) rotate(.4deg)}}
`;
function injectStyle(){if(document.getElementById('mx-style'))return;const s=document.createElement('style');s.id='mx-style';s.textContent=CSS;document.head.append(s)}

// ---------- harsh synthesized audio (own AudioContext, honours the site sound toggle) ----------
function makeAudio(enabled){
 const none={setLevel(){},silence(){},unmute(){},thud(){},scream(){},crack(){},stop(){}};
 if(!enabled())return none;
 let ctx;try{ctx=new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume()}catch{return none}
 const curve=new Float32Array(512);for(let i=0;i<512;i++)curve[i]=Math.tanh((i/256-1)*6);
 const master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
 const fx=ctx.createGain();fx.gain.value=.7;fx.connect(ctx.destination);
 const shaper=ctx.createWaveShaper();shaper.curve=curve;shaper.connect(master);
 const fxShaper=ctx.createWaveShaper();fxShaper.curve=curve;fxShaper.connect(fx);
 const buf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
 const noise=(dest,type,freq,q)=>{const s=ctx.createBufferSource();s.buffer=buf;s.loop=true;const f=ctx.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;const g=ctx.createGain();g.gain.value=0;s.connect(f);f.connect(g);g.connect(dest);s.start();return {f,g}};
 const body=noise(shaper,'bandpass',1200,.6),hiss=noise(master,'highpass',5200,1);
 const sub=ctx.createOscillator();sub.type='sawtooth';sub.frequency.value=41;const subLp=ctx.createBiquadFilter();subLp.type='lowpass';subLp.frequency.value=130;const subG=ctx.createGain();subG.gain.value=0;sub.connect(subLp);subLp.connect(subG);subG.connect(master);sub.start();
 const sc=ctx.createGain();sc.gain.value=0;sc.connect(shaper);
 for(const [type,f] of [['sawtooth',1720],['square',1763]]){const o=ctx.createOscillator();o.type=type;o.frequency.value=f;o.connect(sc);o.start()}
 const lfo=ctx.createOscillator();lfo.frequency.value=9;const lfoG=ctx.createGain();lfoG.gain.value=0;lfo.connect(lfoG);lfoG.connect(sc.gain);lfo.start();
 let muted=false;
 const noiseBurst=(dur,vol,hp)=>{const s=ctx.createBufferSource();s.buffer=buf;const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=hp;const g=ctx.createGain(),n=ctx.currentTime;g.gain.setValueAtTime(vol,n);g.gain.exponentialRampToValueAtTime(.001,n+dur);s.connect(f);f.connect(g);g.connect(fx);s.start(n);s.stop(n+dur+.05)};
 const thud=(v=1)=>{const o=ctx.createOscillator(),g=ctx.createGain(),n=ctx.currentTime;o.type='sine';o.frequency.setValueAtTime(95,n);o.frequency.exponentialRampToValueAtTime(28,n+.55);g.gain.setValueAtTime(.9*v,n);g.gain.exponentialRampToValueAtTime(.001,n+.6);o.connect(g);g.connect(fx);o.start(n);o.stop(n+.65);noiseBurst(.18,.35*v,60)};
 return {
  setLevel(l){if(muted)return;const n=ctx.currentTime,s=Math.max(0,l-.35)*.07;master.gain.setTargetAtTime(.5*Math.min(1,l*1.15),n,.05);body.g.gain.setTargetAtTime(.3+.7*l,n,.06);hiss.g.gain.setTargetAtTime(l*.5,n,.06);subG.gain.setTargetAtTime(l*.55,n,.1);sc.gain.setTargetAtTime(s,n,.1);lfoG.gain.setTargetAtTime(s*.8,n,.1);body.f.frequency.setTargetAtTime(400+Math.random()*3800,n,.03)},
  silence(){muted=true;const n=ctx.currentTime;master.gain.cancelScheduledValues(n);master.gain.setValueAtTime(0,n)},
  unmute(){muted=false},
  thud,
  crack(){noiseBurst(.28,.7,1400);thud(.5)},
  scream(d=1){const n=ctx.currentTime;for(const [type,mult] of [['sawtooth',1],['square',1.5]]){const o=ctx.createOscillator(),g=ctx.createGain(),vib=ctx.createOscillator(),vg=ctx.createGain();o.type=type;o.frequency.setValueAtTime(260*mult,n);o.frequency.linearRampToValueAtTime(1500*mult,n+d);vib.frequency.value=7;vg.gain.value=70;vib.connect(vg);vg.connect(o.frequency);g.gain.setValueAtTime(.38,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g);g.connect(fxShaper);o.start(n);vib.start(n);o.stop(n+d+.05);vib.stop(n+d+.05)}noiseBurst(d,.5,2500)},
  stop(){const n=ctx.currentTime;master.gain.cancelScheduledValues(n);master.gain.setTargetAtTime(0,n,.1);fx.gain.setTargetAtTime(0,n,.1);setTimeout(()=>ctx.close().catch(()=>{}),900)}
 };
}

// ---------- controller ----------
export function releaseMeltdown(){current?.release()}

export function startMeltdown({soundEnabled=()=>true,motion=true,onComplete=()=>{}}={}){
 current?.abort();injectStyle();
 if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});
 const calm=!motion,audio=makeAudio(soundEnabled),face=faceCanvas(),origTitle=document.title,W=640,H=360;
 const root=document.createElement('div');root.id='mx-root';
 const mk=id=>{const e=document.createElement('div');e.id=id;return e};
 const dark=mk('mx-dark'),black=mk('mx-black'),text=mk('mx-text'),canvas=document.createElement('canvas');canvas.id='mx-canvas';canvas.width=W;canvas.height=H;
 root.append(dark,canvas,black,text);document.documentElement.append(root);
 const cx=canvas.getContext('2d'),nz=document.createElement('canvas');nz.width=160;nz.height=90;const nzc=nz.getContext('2d'),nzi=nzc.createImageData(160,90);
 let t=0,last=performance.now(),raf=0,dead=false,completed=false,completeAt=0,blocking=false,targets=[],targetClock=0,fxClock=0,audioClock=0,titleClock=0,jitClock=0;
 let black1=false,good=false,goodOff=false,revealed=false,lastHit=-9,mouse={x:.5,y:.5};
 const saved=new Map(),texts=new Map(),reverts=[],fired=new Set(),cracks=[];
 const onMove=e=>{mouse={x:e.clientX/innerWidth,y:e.clientY/innerHeight}};window.addEventListener('pointermove',onMove);

 const remember=el=>{if(!saved.has(el))saved.set(el,el.getAttribute('style'))};
 const collect=()=>[...document.querySelectorAll('body *')].filter(e=>!root.contains(e)&&!e.closest('.world-hud')&&!['SCRIPT','STYLE','CANVAS'].includes(e.tagName)&&e.childNodes.length===1&&e.firstChild.nodeType===3&&e.textContent.trim().length>1);
 function restorePage(){
  for(const [el,v] of saved){if(v===null)el.removeAttribute('style');else el.setAttribute('style',v)}saved.clear();
  for(const [el,txt] of texts)el.textContent=txt;texts.clear();
  for(const sel of ['#app','.site-header'])document.querySelector(sel)?.classList.remove('mx-shake1','mx-shake2');
  document.title=origTitle;
 }
 function cleanupListeners(){window.removeEventListener('pointermove',onMove)}
 function redFlick(u){
  const el=targets[Math.floor(Math.random()*targets.length)];
  if(!el||!el.isConnected||reverts.some(r=>r.el===el))return;
  remember(el);el.style.color='#ff1a1a';el.style.textShadow='0 0 10px #f00';
  if(!calm&&Math.random()<.2+.5*u){texts.set(el,el.textContent);el.textContent=corrupt(el.textContent,.15+.45*u)}
  reverts.push({el,at:t+rand(.1,.7-.4*u)});
 }
 function breakdown(dt){
  const u=(t-T_A)/(T_BLACK-T_A);
  if(!blocking){blocking=true;root.classList.add('block');targets=collect()}
  targetClock-=dt;if(targetClock<=0){targetClock=1.5;targets=collect()}
  dark.style.opacity=(u*.93).toFixed(3);
  if(!calm){const cls=u>.72?'mx-shake2':u>.3?'mx-shake1':'';if(cls)for(const sel of ['#app','.site-header']){const e=document.querySelector(sel);if(e&&!e.classList.contains(cls)){e.classList.remove('mx-shake1','mx-shake2');e.classList.add(cls)}}}
  fxClock-=dt;if(fxClock<=0){fxClock=calm?.4:.06;const n=calm?1:1+Math.floor(u*u*16);for(let i=0;i<n;i++)redFlick(u)}
  for(let i=reverts.length-1;i>=0;i--)if(t>=reverts[i].at){const {el}=reverts[i];el.style.removeProperty('color');el.style.removeProperty('text-shadow');if(texts.has(el)){el.textContent=texts.get(el);texts.delete(el)}reverts.splice(i,1)}
 }
 function destroy(sel,mode){
  const el=document.querySelector(sel);if(!el)return;remember(el);
  if(mode==='fade'){el.style.transition='opacity 1.5s';el.style.opacity='0';return}
  el.classList.remove('mx-shake1','mx-shake2');
  el.style.transition='transform 1.4s cubic-bezier(.55,0,1,.7),opacity 1.2s ease-in';el.style.transformOrigin='50% 0';void el.offsetWidth;
  el.style.transform=`translate(${rand(-150,150)}px,${innerHeight*1.2}px) rotate(${rand(-30,30)}deg)`;el.style.opacity='0';
 }
 function makeCrack(x,y,born){
  const lines=[],n=7+Math.floor(Math.random()*7);
  for(let i=0;i<n;i++){let a=Math.random()*Math.PI*2,px=x,py=y,len=0;const max=60+Math.random()*260,pts=[[px,py]];while(len<max){const step=8+Math.random()*16;a+=(Math.random()-.5)*.7;px+=Math.cos(a)*step;py+=Math.sin(a)*step;pts.push([px,py]);len+=step}lines.push(pts)}
  return {x,y,born,lines};
 }
 function drawFace(s,jx,jy,alpha){
  const fw=256*s*1.12,fh=320*s*1.12,x=W/2-fw/2+jx,y=H*.52-fh/2+jy,k=fw/256;
  cx.save();cx.imageSmoothingEnabled=false;cx.globalAlpha=alpha;cx.drawImage(face,x,y,fw,fh);
  const ey=y+122*k,ox=(mouse.x-.5)*7*k*.3,oy=(mouse.y-.5)*5*k*.3;
  for(const fx of [94,162]){const px=x+fx*k+ox,py=ey+oy,g=cx.createRadialGradient(px,py,0,px,py,26*k);g.addColorStop(0,'#fff0c0');g.addColorStop(.12,'#ff2a1a');g.addColorStop(.5,'#ff1a1066');g.addColorStop(1,'#ff100000');cx.fillStyle=g;cx.fillRect(px-30*k,py-30*k,60*k,60*k)}
  cx.restore();
 }
 function staticOver(a){const d=nzi.data;for(let i=0;i<d.length;i+=4){const v=Math.random()*255;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}nzc.putImageData(nzi,0,0);cx.save();cx.globalAlpha=a;cx.imageSmoothingEnabled=false;cx.drawImage(nz,0,0,W,H);cx.restore()}
 function drawCracks(c){
  for(const k of cracks){
   const p=clamp((c-k.born)/.3,0,1);
   if(c-k.born<.12){const g=cx.createRadialGradient(k.x,k.y,0,k.x,k.y,90);g.addColorStop(0,'#ffffffcc');g.addColorStop(1,'#ffffff00');cx.fillStyle=g;cx.fillRect(k.x-90,k.y-90,180,180)}
   for(const pts of k.lines){const n=Math.max(2,Math.floor(pts.length*p));cx.beginPath();cx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<n&&i<pts.length;i++)cx.lineTo(pts[i][0],pts[i][1]);cx.strokeStyle='#000';cx.lineWidth=3.5;cx.stroke();cx.strokeStyle='#dcdce6';cx.lineWidth=1.1;cx.stroke()}
  }
 }
 function setText(cls,str){if(text.textContent!==str)text.textContent=str;text.className=cls}

 function phaseC(c,dt){
  if(c<3){ // black room, three jump-scare flashes of the face
   const fl=calm?null:FLASHES.find(f=>c>=f.at&&c<f.at+f.d);
   if(fl){if(!fired.has(fl)){fired.add(fl);audio.thud(1);audio.scream(fl.d+.35);vibrate([fl.d*1000])}black.style.opacity=0;canvas.style.opacity=1;cx.fillStyle='#000';cx.fillRect(0,0,W,H);drawFace(2.1,rand(-8,8),rand(-8,8),1);staticOver(.3)}
   else{black.style.opacity=1;canvas.style.opacity=0}
   return;
  }
  if(!revealed){revealed=true;black.style.opacity=0;dark.style.opacity=.5;canvas.style.opacity=1;audio.unmute();audio.scream(2.4);vibrate([200,80,400]);for(const el of targets.length?targets:collect()){remember(el);el.style.color='#c0101a'}}
  if(c<C_WHITE){ // the ghost destroys the page
   audioClock-=dt;if(audioClock<=0){audioClock=.07;audio.setLevel(.85+.15*clamp((c-3)/8,0,1))}
   for(const [at,sel,mode] of FALLS)if(c>=at&&!fired.has(sel)){fired.add(sel);destroy(sel,mode)}
   for(const at of CRACKS)if(c>=at&&!fired.has(at)){fired.add(at);cracks.push(makeCrack(rand(60,W-60),rand(40,H-40),c));audio.crack();lastHit=c;vibrate([60])}
   const line=LINES.find(([at])=>c>=at&&c<at+1.9);
   if(line)setText('on small'+(!calm&&Math.random()<.3?' jit':''),line[1]);else setText('','');
   cx.clearRect(0,0,W,H);
   const g=clamp((c-3)/9,0,1),pulse=Math.max(0,1-(c-lastHit)*5)*.3,sh=calm?0:2+g*10;
   drawFace(.5+g*2+pulse,rand(-sh,sh),rand(-sh,sh)+(1-g)*30,Math.min(.92,(c-3)/1.5));
   drawCracks(c);
   staticOver(.1+g*.22+(!calm&&Math.random()<.08?.3:0));
   const v=cx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,W*.7);v.addColorStop(0,'#0000');v.addColorStop(1,`rgba(120,0,10,${.35+g*.4})`);cx.fillStyle=v;cx.fillRect(0,0,W,H);
   return;
  }
  if(c<C_WHITE+.1){black.style.background=calm?'#000':'#fff';black.style.opacity=1;canvas.style.opacity=0;setText('','');if(!fired.has('white')){fired.add('white');audio.thud(1);audio.scream(.5)}return}
  black.style.background='#000';black.style.opacity=1;canvas.style.opacity=0;setText('','');
  if(!fired.has('mute')){fired.add('mute');audio.silence()}
  if(c>=C_END&&!completed){completed=true;completeAt=t;try{onComplete()}catch(e){console.error(e)}}
  if(completed&&t-completeAt>9)api.release(); // failsafe
 }

 function step(dt){
  titleClock-=dt;if(t>T_A&&t<T_C+C_END&&titleClock<=0){titleClock=.12;document.title=corrupt('MIDNIGHT ARCADE · DO NOT LOOK',.35)}
  if(t<T_BLACK){audioClock-=dt;if(audioClock<=0){audioClock=.07;audio.setLevel(t<.6?0:t<T_A?.12+.43*(t-.6)/(T_A-.6):.55+.45*(t-T_A)/(T_BLACK-T_A))}}
  if(t>=T_A&&t<T_BLACK)breakdown(dt);
  if(t>=T_BLACK&&!black1){black1=true;black.style.opacity=1;dark.style.opacity=0;audio.silence();for(const el of targets){remember(el);el.style.color='#b0101a'}reverts.length=0}
  if(t>=T_GOOD&&!good){good=true;setText('on','GOOD CHOICE');audio.thud(1);vibrate([300])}
  if(good&&!goodOff&&t<T_C){jitClock-=dt;if(jitClock<=0){jitClock=.15;if(!calm){text.classList.toggle('jit',Math.random()<.25);text.style.opacity=Math.random()<.08?'.2':'1'}}}
  if(t>=T_C&&!goodOff){goodOff=true;text.style.opacity='';setText('','')}
  if(t>=T_C)phaseC(t-T_C,dt);
 }
 function frame(now){raf=requestAnimationFrame(frame);const dt=Math.min(.1,(now-last)/1000);last=now;t+=dt;step(dt)}

 function abort(){if(dead)return;dead=true;cancelAnimationFrame(raf);restorePage();audio.stop();root.remove();cleanupListeners();if(current===api)current=null}
 function release(){ // call once the ending page is mounted: restore the real site and fade the overlay out
  if(dead)return;if(!completed){abort();return}
  dead=true;cancelAnimationFrame(raf);restorePage();audio.stop();cleanupListeners();
  root.classList.remove('block');root.style.transition='opacity 1.6s ease';void root.offsetWidth;root.style.opacity='0';setTimeout(()=>root.remove(),1800);
  if(current===api)current=null;
 }
 const api={abort,release,get completed(){return completed}};
 current=api;raf=requestAnimationFrame(frame);
 return api;
}
