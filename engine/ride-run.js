import {clamp,rng} from './physics.js';

export const WORD='GHOST';
export const JUMP_SECONDS=.94;
export const LOOP=1800;

export function trackCountAt(distance){
 return ((distance%LOOP)+LOOP)%LOOP<600?3:5;
}

export function trackHeight(lane,count){
 const heights=count===5?[0,.65,1.3,.65,0]:[0,0,0],low=Math.floor(lane),high=Math.ceil(lane);
 return (heights[low]||0)+((heights[high]||0)-(heights[low]||0))*(lane-low);
}

export function trackOffset(lane,count){return (lane-(count-1)/2)*4.1}

export function darkness(d){const p=d%1500;return p<900?0:p<1000?(p-900)/100:p<1300?1:p<1400?1-(p-1300)/100:0}

export function newRideRun({seed=1,letters=[],contactMet=false,startDistance=0}={}){
 const trackCount=trackCountAt(startDistance),lane=clamp(Math.round((trackCount-1)/2),0,trackCount-1);
 return {random:rng(seed),distance:startDistance,speed:29,lane,lanePosition:trackOffset(lane,trackCount),trackCount,jump:0,jumpAge:-1,jumpBuffer:0,duck:0,duckTime:0,health:3,score:0,combo:1,invulnerable:0,stumble:0,brake:100,powers:{shield:0,magnet:0,double:0,turbo:0,phase:0},nextMilestone:Math.ceil((startDistance+1)/500)*500,isDark:darkness(startDistance)>.5,letters:new Set(letters.filter(l=>WORD.includes(l))),contactMet,rows:[],pickups:[],nextRow:startDistance+56,nextPower:startDistance+150,nextLetter:startDistance+600,sequence:0,patternOffset:Math.abs(seed)%97,letterMisses:0,wordComplete:false,arriving:false,events:[],dead:false};
}

export function runPattern(sequence,distance){
 const tier=Math.min(5,Math.floor(distance/600)),tracks=trackCountAt(distance),safe=(sequence*2+Math.floor(sequence/3))%tracks,others=Array.from({length:tracks},(_,lane)=>lane).filter(lane=>lane!==safe),mix=sequence%7,types=['cart','crate','beam','gap','crate','beam','cart','steam'];
 const hazards=others.map((lane,i)=>({lane,type:types[(sequence+i*2)%types.length]}));
 if(tier>=3&&sequence%5===2)hazards[0]={lane:others[0],type:'drifter',toLane:safe};
 if(tier>=2&&sequence%6===1){const clearable=['crate','beam','gap'];hazards.splice(0,hazards.length,...others.map((lane,i)=>({lane,type:clearable[(sequence+lane*3)%clearable.length]})))}
 if(mix===4)for(const h of hazards)h.type='crate';
 if(mix===6)for(const h of hazards)h.type='beam';
 return {safe,hazards,spacing:Math.max(26,38-tier*2.4),tracks};
}

function emit(s,type,data={}){s.events.push({type,...data})}

export function hitRide(s,h){
 if(s.invulnerable>0||s.powers.turbo>0)return;
 if(s.powers.phase>0){s.powers.phase=0;s.invulnerable=1;emit(s,'phase-save');return}
 if(s.powers.shield>0){s.powers.shield=0;s.invulnerable=1;emit(s,'shield-break');return}
 s.health--;s.combo=1;s.invulnerable=1.35;s.stumble=.45;emit(s,'hit',{lane:h.lane});
 if(s.health<=0){s.dead=true;emit(s,'end')}
}

export function collectRide(s,p){
 if(p.taken)return;
 p.taken=true;
 const mult=s.powers.double>0?2:1;
 if(p.type==='coin'){const value=Math.round(15*s.combo)*mult;s.score+=value;emit(s,'coin',{value,lane:p.lane})}
 else if(p.type==='letter'){s.letters.add(p.letter);emit(s,'letter',{letter:p.letter});if(s.letters.size===WORD.length&&!s.contactMet)s.wordComplete=true}
 else if(p.type==='heart'){s.health=Math.min(3,s.health+1);emit(s,'power',{power:'heart'})}
 else if(p.type==='battery'){s.brake=Math.min(100,s.brake+45);emit(s,'power',{power:'battery'})}
 else if(p.type==='jackpot'){for(let row=0;row<10;row++)for(let lane=0;lane<trackCountAt(s.distance);lane++)s.pickups.push({type:'coin',lane,distance:s.distance+26+row*5,taken:false});emit(s,'power',{power:'jackpot'})}
 else if(['shield','magnet','double','turbo','phase'].includes(p.type)){s.powers[p.type]=p.type==='shield'?18:p.type==='turbo'?6:p.type==='phase'?8:12;emit(s,'power',{power:p.type})}
}

function updateTrackCount(s){
 const tracks=trackCountAt(s.distance);
 if(tracks!==s.trackCount){
  const oldX=trackOffset(s.lane,s.trackCount);
  s.trackCount=tracks;
  s.lane=clamp(Math.round(oldX/4.1+(tracks-1)/2),0,tracks-1);
 }
}

export function stepRide(s,input,dt){
 s.events=[];
 if(s.dead||s.arriving)return s.events;
 const hadTurbo=s.powers.turbo>0;
 for(const k of Object.keys(s.powers))s.powers[k]=Math.max(0,s.powers[k]-dt);
 if(hadTurbo&&s.powers.turbo===0)s.invulnerable=Math.max(s.invulnerable,1.2);
 s.invulnerable=Math.max(0,s.invulnerable-dt);
 s.stumble=Math.max(0,s.stumble-dt);
 updateTrackCount(s);
 if(!input.duck&&input.left)s.lane=clamp(s.lane-1,0,s.trackCount-1);
 if(!input.duck&&input.right)s.lane=clamp(s.lane+1,0,s.trackCount-1);
 s.lanePosition+=(trackOffset(s.lane,s.trackCount)-s.lanePosition)*(1-Math.exp(-dt*20));
 if(input.jump)s.jumpBuffer=.18;else s.jumpBuffer=Math.max(0,s.jumpBuffer-dt);
 if(s.jumpAge<0&&s.jumpBuffer>0){s.jumpAge=0;s.jumpBuffer=0;emit(s,'jump')}
 if(s.jumpAge>=0){
  if(input.duck)s.jumpAge=Math.max(.78,s.jumpAge);
  s.jumpAge+=dt;
  if(s.jumpAge>=JUMP_SECONDS){s.jumpAge=-1;s.jump=0;emit(s,'land')}
  else s.jump=Math.sin(s.jumpAge/JUMP_SECONDS*Math.PI)*2.85;
 }
 if(input.duck)s.duckTime+=dt;else s.duckTime=0;
 s.duck+=( (input.duck?1:0)-s.duck)*(1-Math.exp(-dt*24));
 const baseTarget=s.stumble>0?23:s.powers.turbo>0?60:30+Math.min(23,s.distance/190);
 const target=input.brake&&s.brake>0?Math.max(18,baseTarget*.55):baseTarget;
 if(input.brake&&s.brake>0)s.brake=Math.max(0,s.brake-dt*28);
 s.speed+=(target-s.speed)*(1-Math.exp(-dt*(s.powers.turbo>0?4:2.5)));
 const old=s.distance;
 s.distance+=s.speed*dt;
 updateTrackCount(s);
 if(s.distance>=s.nextMilestone){s.score+=Math.round(s.nextMilestone/5);emit(s,'milestone',{meters:s.nextMilestone});s.nextMilestone+=500}
 const dk=darkness(s.distance)>.5;
 if(dk!==s.isDark){s.isDark=dk;emit(s,'dark',{on:dk})}
 while(s.nextRow<s.distance+145){
  const pattern=runPattern(s.sequence+(s.patternOffset||0),s.nextRow),row={id:s.sequence,distance:s.nextRow,hazards:pattern.hazards.map(h=>({...h,resolved:false})),safe:pattern.safe,tracks:pattern.tracks};
  s.rows.push(row);
  for(let i=0;i<4;i++)s.pickups.push({type:'coin',lane:pattern.safe,distance:s.nextRow+5+i*3,taken:false});
  if(!s.contactMet&&s.letters.size<5&&s.nextRow>=s.nextLetter){
   const available=[...WORD].filter(l=>!s.letters.has(l)&&!s.pickups.some(p=>p.type==='letter'&&p.letter===l&&!p.taken&&p.distance>s.distance));
   if(available.length&&(s.random()<.04||s.letterMisses>=16)){s.pickups.push({type:'letter',letter:available[Math.floor(s.random()*available.length)],lane:pattern.safe,distance:s.nextRow+13,taken:false});s.nextLetter=s.nextRow+900+s.random()*600;s.letterMisses=0}
   else s.letterMisses++;
  }
  if(s.nextRow>=s.nextPower){
   const types=['shield','magnet','double','turbo','phase','battery',...(s.health<3?['heart','heart']:[])];
   s.pickups.push({type:types[Math.floor(s.random()*types.length)],lane:pattern.safe,distance:s.nextRow+10,taken:false});
   s.nextPower=s.nextRow+480+s.random()*320;
  }
  s.sequence++;
  s.nextRow+=pattern.spacing;
 }
 for(const row of s.rows)for(const h of row.hazards){
  if(h.resolved||s.distance+1<row.distance)continue;
  h.resolved=true;
  const laneCount=row.tracks||3;
  if(Math.abs(s.lanePosition-trackOffset(h.toLane??h.lane,laneCount))>1.9)continue;
  if(s.powers.turbo>0){h.broken=true;s.score+=Math.round(60*s.combo);s.combo=Math.min(5,s.combo+.1);emit(s,'smash',{lane:h.lane});continue}
  const cleared=h.type==='beam'?s.duck>.5&&s.jump<.65:h.type==='crate'||h.type==='cart'||h.type==='steam'?s.jump>.8:h.type==='gap'?s.jump>.55:false;
  if(!cleared){h.broken=true;hitRide(s,h)}
  else{s.score+=Math.round(35*s.combo);s.combo=Math.min(5,s.combo+.08)}
 }
 if(s.dead)return s.events;
 for(const p of s.pickups){
  if(p.taken)continue;
  const range=s.powers.magnet>0&&p.type==='coin'?8:2.4;
  if(p.distance<old-4||p.distance>s.distance+range)continue;
  if(s.powers.magnet>0&&p.type==='coin'||Math.abs(s.lanePosition-trackOffset(p.lane,trackCountAt(p.distance)))<1.7)collectRide(s,p);
 }
 if(s.letters.size===5&&!s.contactMet&&s.distance>180){s.wordComplete=true;s.arriving=true}
 s.rows=s.rows.filter(r=>r.distance>s.distance-30);
 s.pickups=s.pickups.filter(p=>p.distance>s.distance-30);
 return s.events;
}
