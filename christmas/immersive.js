import {winterAir} from './weather.js';
import {scene} from './art.js';
const body=document.body;
const menu=document.createElement('aside');
menu.id='winter-menu';
const toggle=document.querySelector('#panelToggle');
toggle.setAttribute('aria-controls',menu.id);
const main=document.querySelector('main');
menu.setAttribute('aria-label','Winter navigation');
const mast=document.createElement('div');mast.className='menu-mast';
mast.append(main.querySelector('.season'),main.querySelector('h1'));
const destinations=main.querySelector('nav');
const homeLink=document.querySelector('body > header a');
homeLink.textContent='Event home';destinations.prepend(homeLink);
const controls=document.querySelector('body > header');controls.className='menu-settings';
menu.append(mast,destinations,controls,document.querySelector('#preview'));
body.append(menu);
function openMenu(open){
  menu.hidden=!open;
  toggle.setAttribute('aria-expanded',String(open));
}
openMenu(false);
toggle.onclick=()=>openMenu(menu.hidden);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){openMenu(false);toggle.focus();}});
document.querySelector('#expand').onclick=async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await body.requestFullscreen();}
  catch{document.querySelector('#status').textContent='Fullscreen is unavailable in this browser.';}
};
document.querySelector('#ambient').innerHTML=scene({species:'Fir',setting:'Courtyard',weather:'Clear',star:'None'},true);
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let previous=null,lastPuff=0,frame=0,lastFrame=0;
const springs=new Map();
function nudge(element,impulse,limit,property){
  const state=springs.get(element)||{angle:0,speed:0,limit,property};
  state.speed=Math.max(-limit*8,Math.min(limit*8,state.speed+impulse));
  springs.set(element,state);
  if(!frame){lastFrame=performance.now();frame=requestAnimationFrame(advance);}
}
function advance(now){
  const dt=Math.min((now-lastFrame)/1000,.032);lastFrame=now;
  for(const [element,s] of springs){
    s.speed+=(-54*s.angle-4.8*s.speed)*dt;
    s.angle+=s.speed*dt;
    if(!element.isConnected || Math.abs(s.angle)+Math.abs(s.speed)<.035){
      if(s.property==='bend')element.removeAttribute('transform');
      else element.style.removeProperty(s.property);
      springs.delete(element);
    }else if(s.property==='bend')element.setAttribute('transform',`rotate(${s.angle.toFixed(3)} 200 278)`);
    else element.style.setProperty(s.property,s.angle.toFixed(3)+'deg');
  }
  frame=springs.size?requestAnimationFrame(advance):0;
}
const air=winterAir();
let layers=[],pending=null,pointerFrame=0;
let cameraX=0,cameraY=0,targetX=0,targetY=0,cameraFrame=0,cameraTime=0,sceneScale=1;
function project(){
  for(const [node,depth] of layers)node.style.translate=(cameraX*depth).toFixed(3)+'px '+(cameraY*depth).toFixed(3)+'px';
  air.camera(cameraX*sceneScale,cameraY*sceneScale);
}
function advanceCamera(now){
  const ease=1-Math.exp(-Math.min(64,now-cameraTime)/80);
  cameraTime=now;
  cameraX+=(targetX-cameraX)*ease;
  cameraY+=(targetY-cameraY)*ease;
  if(Math.abs(targetX-cameraX)+Math.abs(targetY-cameraY)<.012){
    cameraX=targetX;cameraY=targetY;cameraFrame=0;
  }else cameraFrame=requestAnimationFrame(advanceCamera);
  project();
}
function pan(x,y){
  targetX=-21*x;targetY=-6*y;
  if(!cameraFrame){cameraTime=performance.now();cameraFrame=requestAnimationFrame(advanceCamera);}
}
function move(){
  pointerFrame=0;
  const event=pending;
  const svg=event.target.closest('#scene>svg');
  if(!svg){previous=null;return;}
  const now=performance.now(),x=event.clientX,y=event.clientY;
  pan(2*x/innerWidth-1,2*y/innerHeight-1);
  const from=previous;previous={x,y,now};
  if(!from||now-from.now>180)return;
  const dx=x-from.x,dy=y-from.y;
  const crown=event.target.closest('.crown');
  if(crown)nudge(crown,dx*.06,1.1,'bend');
  const hanging=event.target.closest('.hanging')||pendingCharm;
  if(hanging)nudge(hanging.querySelector('.charm'),-dx*2,24,'--angle');
  pendingCharm=null;
  if(event.target.closest('.near-ground')&&now-lastPuff>35){air.brush(x,y,dx,dy);lastPuff=now;}
}
let pendingCharm=null;
body.addEventListener('pointermove',event=>{
  if(motion.matches)return;
  pending=event;pendingCharm=event.target.closest('.hanging')||pendingCharm;
  if(!pointerFrame)pointerFrame=requestAnimationFrame(move);
},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>{cancelAnimationFrame(pointerFrame);pointerFrame=0;pendingCharm=null;previous=null;pan(0,0);});
// Fit the full tree vertically while cropping the surrounding landscape on phones.
function fit(){
  const active=document.querySelector('#scene>svg');
  document.querySelector('#ambient').hidden=!!active || location.search.includes('gallery');
  layers=active?['.horizon','.village','.ground-plane'].map((selector,i)=>[active.querySelector(selector),[.15,.43,1][i]]):[];
  air.set(active?.dataset.weather||'Clear');
  const ratio=innerWidth/innerHeight;
  const width=Math.max(212,310*ratio);
  const height=width/ratio;
  sceneScale=innerWidth/width;
  project();
  for(const svg of document.querySelectorAll('#scene>svg,#ambient>svg')){
    svg.setAttribute('viewBox',[200-width/2,(310-height)/2,width,height].join(' '));
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  }
}
new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1 && (n.matches('#scene,svg') || n.querySelector('#scene,svg')))))fit();}).observe(document.querySelector('#content'),{childList:true,subtree:true});
window.addEventListener('resize',fit);fit();
motion.addEventListener('change',()=>{
  if(!motion.matches)return;
  cancelAnimationFrame(cameraFrame);cameraFrame=0;cameraX=0;cameraY=0;targetX=0;targetY=0;
  previous=null;project();
});







