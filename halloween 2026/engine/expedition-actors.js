import {PALETTE as P} from './pixel-art.js';
// Articulated pixel silhouettes: limbs animate independently of the body.
export function drawActor(c,e,t,{player=false,dig=0,hurt=0}={}){
 c.save();c.translate(Math.round(e.x),Math.round(e.y));c.scale(2,2);c.imageSmoothingEnabled=false;
 const phase=e.step||0,walk=Math.sin(phase),stride=Math.min(1,e.moving===false?0:1),ghost=e.type==='hunter'||e.type==='interceptor',attack=e.attack||0;
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)};
 const limb=(x,y,angle,w,h,color)=>{c.save();c.translate(x,y);c.rotate(angle);rect(-w/2,0,w,h,color);c.restore()};
 c.fillStyle='#00000055';c.beginPath();c.ellipse(0,0,player?12:16,4,0,0,7);c.fill();
 c.globalAlpha=e.alpha??1;if(player&&hurt>0)c.globalAlpha=.6+Math.sin(t*35)*.3;
 if(e.surge>0){c.shadowColor='#e57378';c.shadowBlur=13}if(e.state==='held'){c.shadowColor='#e4d699';c.shadowBlur=9}if(e.state==='stunned'){rect(-9,-46,3,3,P.gold);rect(7,-49+Math.sin(t*8)*2,3,3,P.gold)}
 const lean=e.state==='charging'?.16:attack>0?Math.sin(attack*6)*.13:walk*.025*stride;
 c.rotate(lean);if(e.state==='winding'){c.scale(1.04,.92);c.rotate(Math.sin(t*20)*.015)}
 if(ghost){
  c.translate(0,Math.sin(t*2+e.id)*2);const robe=e.type==='interceptor'?'#69627d':'#4b526b';
  for(let i=-10;i<=10;i+=4){rect(i,-28+Math.abs(i)*.2,4,22+Math.sin(t*4+i)*3,robe);rect(i,-18,2,8,P.shadow)}
  limb(-11,-30,-.6+Math.sin(t*3)*.2,4,16,'#88869f');limb(11,-30,.6-Math.sin(t*3)*.2,4,16,'#88869f');
  rect(-9,-43,18,18,P.ink);rect(-6,-40,12,14,e.surge>0?'#ba858e':'#9293a1');rect(-5,-35,4,4,P.ink);rect(2,-35,4,4,P.ink);rect(-4,-34,2,2,P.violet);rect(3,-34,2,2,P.violet);rect(-2,-28,4,3,P.shadow);
  if(e.type==='interceptor'){rect(-1,-45,2,11,P.gold);rect(-4,-42,8,2,P.gold)}

 }else if(e.type==='mimic'){
  if(e.state!=='buried'){const rise=e.state==='awakening'?Math.max(0,1-(e.wake||0)/1.3):1;c.scale(1,rise*.65+.35);rect(-14,-20,28,18,'#675443');rect(-10,-27,20,12,'#8a7258');rect(-8,-24,5,4,'#e7c18b');rect(4,-24,5,4,'#e7c18b');for(let side of [-1,1])limb(side*14,-18,side*(.8+Math.sin(t*8)*.2),5,20,'#887363');rect(-6,-12,12,8,P.ink)}
 }else if(e.type==='bellringer'){
  const ring=e.state==='ringing',sway=ring?Math.sin(t*12)*.35:Math.sin(t*2)*.08;rect(-10,-30,20,28,'#494a60');rect(-7,-44,14,17,'#7c7b8b');rect(-5,-39,10,5,P.ink);rect(-2,-38,4,3,'#deb570');limb(12,-30,-.8+sway,5,16,'#69647a');c.save();c.translate(18,-14);c.rotate(sway);rect(-7,0,14,11,'#ab8d53');rect(-10,10,20,4,'#e1bd76');rect(-2,13,4,5,'#766547');c.restore();if(ring){c.strokeStyle='#e0b878';c.lineWidth=2;c.beginPath();c.arc(0,-30,25,-Math.PI/2,-Math.PI/2+(e.ringing||0)/2.2*Math.PI*2);c.stroke()}
 }else{
  const heavy=e.type==='gravebound',zombie=e.type==='zombie',body=player?P.cloth:heavy?'#73727c':'#535951',skin=player?P.skin:heavy?'#c2b69a':'#778a6d';
  const swing=walk*.42*stride;limb(-5,-14,swing,5,13,P.shadow);limb(5,-14,-swing,5,13,P.shadow);rect(-9+walk*3*stride,-3,7,4,P.wood);rect(2-walk*3*stride,-3,7,4,P.wood);
  c.translate(0,-Math.abs(walk)*1.2*stride);rect(heavy?-13:-9,-32,heavy?26:18,20,body);rect(-8,-14,16,3,P.wood);rect(-2,-14,4,3,P.gold);
  const arm=player?-swing:attack>0?-1.2+attack*2:zombie?-.75: .1;
  limb(-11,-30,arm,5,15,body);limb(11,-30,-arm,5,15,body);
  rect(-7,-43,14,12,skin);const back=player&&Math.sin(e.face||0)<-.6,side=Math.cos(e.face||0)>0?1:-1;
  if(!back){rect(side>0?1:-5,-39,3,2,P.ink);rect(side>0?5:-8,-36,3,3,skin)}
  if(player){rect(-13,-45,26,4,P.ink);rect(-8,-55,16,11,P.shadow);rect(-7,-53,2,8,P.edge);rect(-9,-22,15,8,P.woodLight);rect(-6,-20,9,4,P.wood);
   c.save();c.translate(15,-16+walk*2*stride);c.rotate(walk*.12);rect(-4,0,8,12,P.ink);rect(-2,3,4,6,P.gold);rect(-1,4,2,4,P.flame);c.restore();
   if(dig>0){c.save();c.translate(-12,-25);c.rotate(-1.8+Math.sin(dig/.22*Math.PI)*2.3);rect(-1,-22,2,30,P.woodLight);rect(-4,-27,8,9,P.edge);c.restore()}
  }else if(heavy){rect(-16,-34,9,10,P.stone);rect(7,-34,9,10,P.stone);rect(-10,-26,20,4,P.edge);rect(-6,-46,12,4,P.stone);rect(-6,-39,4,3,e.state==='winding'&&Math.sin(t*18)>0?'#ffe1a0':'#d16b58');rect(3,-39,4,3,e.state==='winding'&&Math.sin(t*18)>0?'#ffe1a0':'#d16b58');rect(-3,-33,6,3,P.ink)}
  else{rect(-5,-39,3,3,P.ink);rect(3,-39,3,3,P.ink);rect(-4,-33,8,2,'#464239');rect(-5,-28,10,3,'#727467')}
 }
 c.restore();
}
export function drawAttackWarning(c,e){
 if(e.beamHold>0||e.surge>0){c.save();c.strokeStyle=e.surge>0?'#e47d80':'#d8b978';c.lineWidth=3;c.beginPath();c.arc(e.x,e.y,25,-Math.PI/2,-Math.PI/2+Math.min(1,e.beamHold/2.2)*Math.PI*2);c.stroke();if(e.state==='resisting'){c.fillStyle='#edada3';c.font='bold 24px monospace';c.textAlign='center';c.fillText('!',e.x,e.y-95)}c.restore()}

 if(e.charge&&e.charge.windup>0){const q=e.charge;c.save();c.strokeStyle='#de9874';c.globalAlpha=.35+Math.sin(e.age*15)*.18;c.lineWidth=30;c.setLineDash([10,10]);c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.x+q.dx*430,e.y+q.dy*430);c.stroke();c.restore()}
 if(e.attack>0){c.save();c.strokeStyle='#e5ae89';c.lineWidth=3;c.beginPath();c.arc(e.x,e.y,34,-Math.PI/2,-Math.PI/2+Math.min(1,e.attack/.65)*Math.PI*2);c.stroke();c.restore()}
}
