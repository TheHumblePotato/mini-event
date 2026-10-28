import {clamp} from './physics.js';
export function acousticPosition(listener,source,range=750,occluded=false){const dx=source.x-listener.x,dy=source.y-listener.y,d=Math.hypot(dx,dy),angle=listener.angle||0;return {pan:clamp((dx*Math.cos(angle)+dy*Math.sin(angle))/Math.max(range*.08,d),-1,1),gain:Math.pow(clamp(1-d/range,0,1),1.5)*(occluded?.28:1),lowpass:occluded?700:6500}}
export function createSpatialAudio(hooks={},range=750){let ctx,noise,master,listener={x:0,y:0,angle:0},clock=0,engine=null,manualPause=false;const active=new Set();
 const enabled=()=>!manualPause&&!(typeof document!=='undefined'&&document.hidden)&&hooks.soundEnabled?.()!==false&&!hooks.paused?.();
 const visibility=()=>{if(master&&ctx)master.gain.setTargetAtTime(enabled()?.38:0,ctx.currentTime,.04)};if(typeof document!=='undefined')document.addEventListener?.('visibilitychange',visibility);
 function unlock(){if(!enabled())return;try{if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=.38;master.connect(ctx.destination);noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1}if(ctx.state==='suspended')ctx.resume()}catch{}}
 function voice(frequency,duration,volume,pan,lowpass,type='sine',delay=0,to=frequency){if(!ctx||!enabled()||active.size>50)return;const start=ctx.currentTime+delay,g=ctx.createGain(),p=ctx.createStereoPanner(),filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=lowpass;p.pan.value=pan;g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),start+.015);g.gain.exponentialRampToValueAtTime(.0001,start+duration);let src;if(type==='noise'){src=ctx.createBufferSource();src.buffer=noise;src.playbackRate.value=frequency/250}else{src=ctx.createOscillator();src.type=type;src.frequency.setValueAtTime(frequency,start);src.frequency.exponentialRampToValueAtTime(Math.max(20,to),start+duration)}src.connect(filter);filter.connect(g);g.connect(p);p.connect(master);active.add(src);src.onended=()=>{active.delete(src);src.disconnect();g.disconnect();p.disconnect();filter.disconnect()};src.start(start);src.stop(start+duration+.03)}
 function cue(kind,position=listener,{volume=1,occluded=false,distance=range}={}){if(!ctx||!enabled())return;const a=acousticPosition(listener,position,distance,occluded),v=a.gain*volume;if(v<.005)return;const tone=(f,d,g=.12,ty='sine',delay=0,to=f)=>voice(f,d,g*v,a.pan,a.lowpass,ty,delay,to);
 if(kind==='rail'){tone(150,.08,.06,'noise');tone(330,.13,.035,'triangle');tone(110,.09,.045,'noise',.07)}
 else if(kind==='bell'){[220,440,594,880].forEach((f,i)=>tone(f,1.7,.16/(i+1),'sine',0,f*.996))}
 else if(kind==='letter'){[392,494,587,784].forEach((f,i)=>tone(f,.45,.09,'sine',i*.09))}
 else if(kind==='power'){tone(220,.5,.08,'triangle',0,880);tone(440,.45,.05,'sine',.1,1100)}
 else if(kind==='boss'){tone(110,1.8,.13,'sawtooth',0,150);tone(165,1.6,.08,'triangle',.15,200);tone(65,1.2,.1,'noise')}
 else if(kind==='steam'){tone(250,.8,.12,'noise');tone(500,.5,.06,'noise',.1)}
 else if(kind==='shatter'){tone(1100,.5,.09,'noise');tone(900,.55,.07,'triangle',0,120)}
 else if(kind==='drip'){tone(1300,.16,.05,'sine',0,650);tone(950,.25,.025,'sine',.16,700)}
 else if(kind==='ghost'){tone(170,.7,.08,'noise',0,80);tone(640,.55,.045,'sine',.03,330);tone(960,.3,.025,'sine',.15)}
 else if(kind==='step'){tone(110,.08,.08,'noise');tone(64,.09,.065,'sine',0,38)}
 else if(kind==='zombie'){tone(75,.35,.09,'sawtooth',0,48);tone(120,.12,.07,'noise')}
 else if(kind==='mimic'){tone(160,.65,.15,'noise');tone(93,.7,.08,'sawtooth',0,40)}
 else if(kind==='armor'){tone(430,.2,.065,'triangle');tone(700,.25,.035,'sine',.06)}
 else if(kind==='dig'){tone(210,.15,.13,'noise');tone(340,.12,.05,'triangle',.02,180)}
 else if(kind==='flare'){tone(320,.6,.13,'noise');tone(600,.15,.04,'sine',0,90)}
 else if(kind==='pickup'){[440,554,660].forEach((f,i)=>tone(f,.22,.06,'triangle',i*.07))}
 else if(kind==='crash'){tone(70,.4,.2,'noise');tone(60,.25,.13,'sawtooth',0,24)}
 else if(kind==='horn'){tone(180,.35,.11,'sawtooth');tone(230,.35,.06,'triangle')}
 else if(kind==='tire'){tone(700,.16,.055,'noise')}
 else if(kind==='wind')tone(80,2,.025,'noise');
 }
 return {unlock,cue,pause(value){manualPause=value},update(p,dt){listener={...p};clock+=dt;if(master&&ctx)master.gain.setTargetAtTime(enabled()?.38:0,ctx.currentTime,.06)},setEngine(speed,throttle=0){if(!ctx||!enabled())return;if(!engine){const o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.connect(g);g.connect(master);g.gain.value=.035;o.start();engine={o,g}}engine.o.frequency.setTargetAtTime(38+Math.abs(speed)*2+Math.max(0,throttle)*8,ctx.currentTime,.15);engine.g.gain.setTargetAtTime(.025+Math.abs(speed)*.001,ctx.currentTime,.2)},destroy(){for(const src of active){try{src.stop()}catch{}}active.clear();engine?.o.stop();ctx?.close();ctx=null;if(typeof document!=='undefined')document.removeEventListener?.('visibilitychange',visibility)}};
}
