import test from 'node:test';
import assert from 'node:assert/strict';
import {createExpedition} from '../engine/expedition-world.js';
import {KEY_DIG_SITE,SECRET_DOOR,CHAMBER_LAMP,ESCAPE_ROUTE,ESCAPE_PATHS,escapePathAt,canWalkEscape} from '../engine/expedition-mystery.js';

test('the ghost leads to a fixed key in the West Burial Hall and then the sealed vault',()=>{
 const world=createExpedition(14);
 assert.equal(world.roomAt(KEY_DIG_SITE)?.name,'West Burial Hall');
 assert.equal(world.roomAt(SECRET_DOOR)?.name,'The Sealed Vault');
 assert.ok(world.walkable(KEY_DIG_SITE.x,KEY_DIG_SITE.y));
 assert.ok(world.walkable(SECRET_DOOR.x,SECRET_DOOR.y));
});

test('the Keeper route alternates light states and contains navigable dead ends',()=>{
 assert.equal(ESCAPE_ROUTE[0].x,700);
 assert.equal(ESCAPE_ROUTE.at(-1).x,180);
 assert.deepEqual(CHAMBER_LAMP,ESCAPE_ROUTE[0]);
 assert.ok(ESCAPE_PATHS.some(path=>!path.main));
 for(const path of ESCAPE_PATHS){
  const mid={x:(path.from.x+path.to.x)/2,y:(path.from.y+path.to.y)/2};
  assert.ok(escapePathAt(mid,path.mode),`missing ${path.mode} route segment`);
 }
 const shadow=ESCAPE_PATHS.find(path=>path.main&&path.mode==='black'),midpoint={x:(shadow.from.x+shadow.to.x)/2,y:(shadow.from.y+shadow.to.y)/2};
 assert.equal(canWalkEscape(midpoint,'black'),true);
 assert.equal(canWalkEscape(midpoint,'warm'),false);
});
