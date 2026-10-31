import test from 'node:test';
import assert from 'node:assert/strict';
import {RIDE_CONSTRUCTION_UNTIL,ORDER,initial,merge} from '../state.js';

test('Last Ride construction lock expires at 4 PM Pacific on October 31, 2026',()=>{
 assert.equal(RIDE_CONSTRUCTION_UNTIL,Date.parse('2026-10-31T16:00:00-07:00'));
 assert.deepEqual(ORDER.slice(-2),['papers','entered']);
});

test('paper puzzle progress persists safely across local and cloud saves',()=>{
 const empty=initial(),solved=merge(empty,{ridePapers:[0,1,2,3,4],paperStackFound:true,paperOrder:[2,4,0,3,1],paperPuzzleSolved:true});
 assert.equal(solved.paperStackFound,true);
 assert.deepEqual(solved.paperOrder,[2,4,0,3,1]);
 assert.equal(solved.paperPuzzleSolved,true);
 assert.deepEqual(merge(empty,{paperOrder:[0,0,0,0,0]}).paperOrder,[]);
});
