import test from 'node:test';
import assert from 'node:assert/strict';
import {createKeeperAttack} from '../engine/keeper-attack.js';

test('Keeper attack is telegraphed, then hits only the marked area',()=>{
 const attack=createKeeperAttack(),keeper={x:0,y:0},player={x:100,y:0};
 assert.equal(attack.update(1.6,keeper,player),'tell');
 assert.equal(attack.windup,.9);
 assert.deepEqual(attack.target,{x:100,y:0});
 assert.equal(attack.update(.9,keeper,player),'hit');
 assert.equal(attack.target,null);
});

test('moving out of the marked area avoids the Keeper attack',()=>{
 const attack=createKeeperAttack(),keeper={x:0,y:0},player={x:100,y:0};
 assert.equal(attack.update(1.6,keeper,player),'tell');
 player.x=180;
 assert.equal(attack.update(.9,keeper,player),'miss');
 assert.equal(attack.update(0,keeper,player),null);
});
