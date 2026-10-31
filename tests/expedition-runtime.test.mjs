import test from 'node:test';
import assert from 'node:assert/strict';
import {createGraveyard} from '../engine/graveyard.js';
import {createExpedition} from '../engine/expedition-world.js';
test('running out of fuel keeps the run alive, and a fuel cache can relight the lamp',()=>{
 const previousDocument=globalThis.document;const gradient={addColorStop(){}},ctx=new Proxy({}, {get:(target,k)=>target[k]||(k==='createPattern'?()=>({}):k.includes('Gradient')?()=>gradient:()=>{}),set:(target,k,v)=>(target[k]=v,true)});
 const make=tag=>{const nodes=new Map();return {width:1280,height:720,style:{},hidden:false,classList:{add(){},remove(){},toggle(){}},append(){},remove(){},focus(){},addEventListener(){},removeEventListener(){},getContext:()=>ctx,querySelector:s=>{if(!nodes.has(s))nodes.set(s,make(s));return nodes.get(s)}}};
 globalThis.document={createElement:make};
 try{const world=createExpedition(42),pos={x:world.rooms[1].cx,y:world.rooms[1].cy,face:0},canvas=make('canvas');canvas.parentElement=make('div');const taps=new Set(),ends=[],saves=[];
 const game=createGraveyard(canvas,{held:()=>false,tap:k=>taps.has(k)},{beep(){},onEnd:v=>ends.push(v),onCheckpoint:v=>saves.push(v)},{resume:{mapVersion:5,seed:42,quest:0,layer:'cemetery',player:pos,fuel:.001,score:0,health:100,stamina:100,flares:0,lit:true,enemies:[],caches:[{id:0,x:pos.x+50,y:pos.y,type:'relic',supply:'fuel',treasure:'chalice',value:240,collected:false}]}});
 game.update(.04,.04);assert.equal(ends.length,0);taps.add('KeyE');game.update(.04,.08);assert.equal(ends.length,0);assert.ok(saves.at(-1).fuel>34);assert.equal(saves.at(-1).caches.filter(c=>c.collected).length,1);game.draw(.08);game.destroy();
 }finally{globalThis.document=previousDocument}
});
test('taking the lantern returns through a side door and creates a persistent cemetery pursuit',()=>{
 const previousDocument=globalThis.document;const gradient={addColorStop(){}},ctx=new Proxy({}, {get:(target,k)=>target[k]||(k==='createPattern'?()=>({}):k.includes('Gradient')?()=>gradient:()=>{}),set:(target,k,v)=>(target[k]=v,true)});
 const make=tag=>{const nodes=new Map();return {width:1280,height:720,style:{},hidden:false,classList:{add(){},remove(){},toggle(){}},append(){},remove(){},focus(){},addEventListener(){},removeEventListener(){},getContext:()=>ctx,querySelector:s=>{if(!nodes.has(s))nodes.set(s,make(s));return nodes.get(s)}}};
 globalThis.document={createElement:make};
 try{const canvas=make('canvas');canvas.parentElement=make('div');const held=new Set(),taps=new Set(),saves=[];
 const game=createGraveyard(canvas,{held:(...keys)=>keys.some(key=>held.has(key)),tap:key=>taps.has(key)},{beep(){},onStory:async()=>4,onCheckpoint:checkpoint=>saves.push(checkpoint),onEnd(){}},{investigation:true,stage:4,resume:{mapVersion:5,quest:4,layer:'chamber',player:{x:1195,y:850,face:0},fuel:100,health:100,flares:2,lit:true,score:0,seed:91}});
 taps.add('KeyE');game.update(.1,.1);taps.clear();
 const checkpoint=saves.at(-1);assert.equal(checkpoint.layer,'cemetery');assert.equal(checkpoint.player.x,4128);assert.equal(checkpoint.player.y,992);assert.ok(checkpoint.enemies.length>=6);assert.ok(checkpoint.enemies.some(enemy=>enemy.type==='zombie'));assert.ok(checkpoint.enemies.some(enemy=>enemy.type==='interceptor'));game.destroy();
 }finally{globalThis.document=previousDocument}
});
test('dying during the lantern recovery offers a full chamber respawn',()=>{
 const previousDocument=globalThis.document,created=[],gradient={addColorStop(){}},ctx=new Proxy({}, {get:(target,k)=>target[k]||(k==='createPattern'?()=>({}):k.includes('Gradient')?()=>gradient:()=>{}),set:(target,k,v)=>(target[k]=v,true)});
 const make=tag=>{const nodes=new Map(),element={tag,width:1280,height:720,style:{},hidden:false,classList:{add(){},remove(){},toggle(){}},append(){},remove(){},focus(){},addEventListener(){},removeEventListener(){},getContext:()=>ctx,querySelector(selector){if(!nodes.has(selector))nodes.set(selector,make(selector));return nodes.get(selector)}};created.push(element);return element};
 globalThis.document={createElement:make};
 try{
  const canvas=make('canvas');canvas.parentElement=make('div');const saves=[],ends=[];
  const game=createGraveyard(canvas,{held:()=>false,tap:()=>false},{beep(){},onCheckpoint:value=>saves.push(value),onEnd:value=>ends.push(value)},{investigation:true,stage:4,resume:{mapVersion:5,seed:42,quest:4,layer:'chamber',player:{x:700,y:580},fuel:10,score:0,health:1,flares:0,lit:true,chamberMobs:[{id:0,type:'zombie',x:730,y:580,step:0,attack:0,cooldown:0,face:0}]}});
  game.update(.04,.04);assert.equal(ends.length,0);assert.equal(created.find(element=>element.textContent==='RESPAWN IN THE CHAMBER')?.onclick instanceof Function,true);created.find(element=>element.textContent==='RESPAWN IN THE CHAMBER').onclick();const checkpoint=saves.at(-1);assert.equal(checkpoint.layer,'chamber');assert.equal(checkpoint.health,100);assert.equal(checkpoint.fuel,100);assert.equal(checkpoint.flares,2);assert.equal(checkpoint.player.x,700);assert.equal(checkpoint.player.y,580);game.destroy();
 }finally{globalThis.document=previousDocument}
});
test('a chamber flare consumes one charge and interrupts nearby dead',()=>{
 const previousDocument=globalThis.document,created=[],gradient={addColorStop(){}},ctx=new Proxy({}, {get:(target,k)=>target[k]||(k==='createPattern'?()=>({}):k.includes('Gradient')?()=>gradient:()=>{}),set:(target,k,v)=>(target[k]=v,true)});
 const make=tag=>{const nodes=new Map(),element={tag,width:1280,height:720,style:{},hidden:false,classList:{add(){},remove(){},toggle(){}},append(){},remove(){},focus(){},addEventListener(){},removeEventListener(){},getContext:()=>ctx,querySelector(selector){if(!nodes.has(selector))nodes.set(selector,make(selector));return nodes.get(selector)}};created.push(element);return element};
 globalThis.document={createElement:make};
 try{
  const canvas=make('canvas');canvas.parentElement=make('div');const taps=new Set(),saves=[];
  const game=createGraveyard(canvas,{held:()=>false,tap:key=>taps.has(key)},{beep(){},onCheckpoint:value=>saves.push(value)},{investigation:true,stage:4,resume:{mapVersion:5,seed:42,quest:4,layer:'chamber',player:{x:700,y:580},fuel:100,score:0,health:100,flares:1,lit:true,chamberMobs:[{id:0,type:'zombie',x:730,y:580,step:0,attack:0,cooldown:0,face:0}]}});
  taps.add('KeyR');game.update(.04,.04);taps.clear();const checkpoint=saves.at(-1),healthHud=created.find(element=>element.tag==='#grave-fuel');assert.equal(checkpoint.flares,0);assert.match(healthHud.textContent,/HEALTH 100/);game.destroy();
 }finally{globalThis.document=previousDocument}
});
