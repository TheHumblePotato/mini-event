import test from 'node:test';
import assert from 'node:assert/strict';
import {drawWorld} from '../engine/expedition-art.js';
import {createExpedition,COLS,ROWS,TILE} from '../engine/expedition-world.js';

test('wall art stays within the same tile used by collision',()=>{
 const world=createExpedition(42),floor=world.floor;
 let wall=null;
 for(let y=1;y<ROWS-1&&!wall;y++)for(let x=1;x<COLS-1;x++){
  const adjacent=[floor[(y-1)*COLS+x],floor[(y+1)*COLS+x],floor[y*COLS+x-1],floor[y*COLS+x+1]];
  if(!floor[y*COLS+x]&&adjacent.some(Boolean)){wall={x,y};break}
 }
 assert.ok(wall);
 assert.equal(world.walkable(wall.x*TILE+32,wall.y*TILE+32),false);
 const rects=[],ctx=new Proxy({},{
  get:(target,key)=>target[key]||(key==='fillRect'?(...args)=>rects.push(args):()=>{}),
  set:(target,key,value)=>(target[key]=value,true)
 });
 drawWorld(ctx,world,{x:wall.x*TILE,y:wall.y*TILE},TILE,TILE,null,[],[]);
 const x=wall.x*TILE,y=wall.y*TILE;
 assert.ok(rects.some(rect=>rect[0]===x&&rect[1]===y&&rect[2]===TILE&&rect[3]===TILE));
 assert.ok(rects.every(([left,top,width,height])=>left!==x||width!==TILE||top>=y+TILE||top+height<=y||(top>=y&&top+height<=y+TILE)));
});
