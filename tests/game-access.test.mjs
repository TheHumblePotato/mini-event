import test from 'node:test';
import assert from 'node:assert/strict';
import {canLaunchGame,shouldStartGraveInvestigation} from '../engine/game-access.js';

test('authorized preview and test mode bypass release and construction locks',()=>{
 const locked={now:10,unlockAt:20,constructionUntil:30,authorized:true};
 assert.equal(canLaunchGame({...locked,preview:true}),true);
 assert.equal(canLaunchGame({...locked,testMode:true}),true);
 assert.equal(canLaunchGame({...locked,preview:true,authorized:false}),false);
 assert.equal(canLaunchGame({...locked,authorized:false}),false);
});

test('Last Ride remains construction-locked for normal play until its cutoff',()=>{
 assert.equal(canLaunchGame({now:25,unlockAt:20,constructionUntil:30}),false);
 assert.equal(canLaunchGame({now:30,unlockAt:20,constructionUntil:30}),true);
});

test('a contact-complete Grave Robber run starts in its active investigation stage',()=>{
 for(const stage of [1,2,3,4])assert.equal(shouldStartGraveInvestigation(stage),true);
 for(const stage of [0,5,6])assert.equal(shouldStartGraveInvestigation(stage),false);
});
