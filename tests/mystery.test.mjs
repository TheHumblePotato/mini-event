import test from 'node:test';
import assert from 'node:assert/strict';
import {createExpedition} from '../engine/expedition-world.js';
import {KEY_DIG_SITE,SECRET_DOOR,CHAMBER_LAMP,CHAMBER_CLUES} from '../engine/expedition-mystery.js';

test('the ghost leads to a fixed key in the West Burial Hall and then the sealed vault',()=>{
 const world=createExpedition(14);
 assert.equal(world.roomAt(KEY_DIG_SITE)?.name,'West Burial Hall');
 assert.equal(world.roomAt(SECRET_DOOR)?.name,'The Sealed Vault');
 assert.ok(world.walkable(KEY_DIG_SITE.x,KEY_DIG_SITE.y));
 assert.ok(world.walkable(SECRET_DOOR.x,SECRET_DOOR.y));
});

test('optional chamber clues are placed away from the lantern cradle',()=>{
 assert.equal(CHAMBER_LAMP.x,700);
 assert.ok(CHAMBER_CLUES.every(clue=>Math.hypot(clue.at.x-CHAMBER_LAMP.x,clue.at.y-CHAMBER_LAMP.y)>300));
});
