import test from 'node:test';
import assert from 'node:assert/strict';
import {RIDE_CONSTRUCTION_UNTIL,ORDER} from '../state.js';

test('Last Ride construction lock expires at 4 PM Pacific on October 31, 2026',()=>{
 assert.equal(RIDE_CONSTRUCTION_UNTIL,Date.parse('2026-10-31T16:00:00-07:00'));
 assert.deepEqual(ORDER.slice(-2),['papers','entered']);
});
