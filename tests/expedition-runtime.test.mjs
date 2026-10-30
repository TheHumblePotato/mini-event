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
 const game=createGraveyard(canvas,{held:(...keys)=>keys.some(key=>held.has(key)),tap:key=>taps.has(key)},{beep(){},onStory:async()=>4,onCheckpoint:checkpoint=>saves.push(checkpoint),onEnd(){}},{investigation:true,stage:4});
 for(let frame=0;frame<38;frame++)game.update(.1,frame*.1);
 held.add('KeyD');held.add('KeyS');for(let frame=0;frame<37;frame++)game.update(.1,4+frame*.1);held.clear();taps.add('KeyE');game.update(.1,8);taps.clear();
 const checkpoint=saves.at(-1);assert.equal(checkpoint.layer,'cemetery');assert.equal(checkpoint.player.x,4128);assert.equal(checkpoint.player.y,992);assert.ok(checkpoint.enemies.length>=6);assert.ok(checkpoint.enemies.some(enemy=>enemy.type==='zombie'));assert.ok(checkpoint.enemies.some(enemy=>enemy.type==='interceptor'));game.destroy();
 }finally{globalThis.document=previousDocument}
});
