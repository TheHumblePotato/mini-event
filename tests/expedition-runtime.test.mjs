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
