import test from 'node:test';
import assert from 'node:assert/strict';
import {ORDER,initial,merge} from '../state.js';

test('the paper puzzle precedes entry to the Fourth Game',()=>{
 assert.deepEqual(ORDER.slice(-2),['papers','entered']);
});

test('paper puzzle progress persists safely across local and cloud saves',()=>{
 const empty=initial(),solved=merge(empty,{ridePapers:[0,1,2,3,4],paperStackFound:true,paperOrder:[2,4,0,3,1],paperPuzzleSolved:true});
 assert.equal(solved.paperStackFound,true);
 assert.deepEqual(solved.paperOrder,[2,4,0,3,1]);
 assert.equal(solved.paperPuzzleSolved,true);
 assert.deepEqual(merge(empty,{paperOrder:[0,0,0,0,0]}).paperOrder,[]);
});
