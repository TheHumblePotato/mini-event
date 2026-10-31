import test from 'node:test';
import assert from 'node:assert/strict';
import {PAPER_RECORDS,PAPER_STACK_ORDER,isPaperChronology,paperAnswerFromOrder,paperAnswerMatches} from '../engine/paper-puzzle.js';

test('the station records sort into a five-letter clue',()=>{
 assert.equal(isPaperChronology(PAPER_STACK_ORDER),true);
 assert.deepEqual(PAPER_STACK_ORDER.map(id=>PAPER_RECORDS.find(page=>page.id===id).time),['22:10','22:26','22:41','22:58','23:17']);
 assert.equal(paperAnswerFromOrder(PAPER_STACK_ORDER),'ALIVE');
});

test('incorrect ordering and answer are rejected',()=>{
 assert.equal(isPaperChronology([0,1,2,3,4]),false);
 assert.equal(paperAnswerFromOrder([0,1,2,3,4]),'');
 assert.equal(paperAnswerMatches('ALIVE'),true);
 assert.equal(paperAnswerMatches('dead'),false);
});
