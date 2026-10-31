export const PAPER_RECORDS=[
 {id:0,time:'22:41',heading:'Signal keeper’s note',misprint:'tame',correction:'time',text:'The exact tame of the power failure was recorded by the clock above the signal desk. The tunnel lamp went dark at the third bell, though the mirror at the end still held a point of light.'},
 {id:1,time:'23:17',heading:'Order from the stationmaster',misprint:'scaled',correction:'sealed',text:'The order arrived in a scaled envelope. Its wax seal was still intact when I broke it open. Inside: “Hold the north gate until morning. Do not let the passenger out.” Someone behind the mirror was still breathing.'},
 {id:2,time:'22:10',heading:'Gate inspection',misprint:'fire',correction:'fare',text:'The posted fire for a platform ticket was three shillings. The clerk counted the coins and issued a ticket, but the north gate was chained from the platform side. No key was signed out.'},
 {id:3,time:'22:58',heading:'Porter’s platform report',misprint:'same',correction:'save',text:'A folded note lay beside the mirror. Written on the paper in a shaking hand: “Open the gate. You can still same me.” One wet set of footprints crossed the platform and stopped at the chain.'},
 {id:4,time:'22:26',heading:'Last departure ledger',misprint:'belt',correction:'bell',text:'The station belt rang twice as the final train departed. Its deep chime echoed from the tower above the platform. No train was listed on the return line.'}
];
export const PAPER_STACK_ORDER=[2,4,0,3,1];
export const PAPER_STACK_ANSWER='ALIVE';
export function isPaperChronology(order){return Array.isArray(order)&&order.length===PAPER_STACK_ORDER.length&&order.every((id,index)=>id===PAPER_STACK_ORDER[index])}
export function paperCorrectedLetter(page){
 if(!page||page.misprint.length!==page.correction.length)return '';
 const changes=[...page.correction].filter((letter,index)=>letter!==page.misprint[index]);
 return changes.length===1?changes[0].toUpperCase():'';
}
export function paperAnswerFromOrder(order){return isPaperChronology(order)?order.map(id=>paperCorrectedLetter(PAPER_RECORDS.find(page=>page.id===id))).join(''):''}
export function paperAnswerMatches(answer){return String(answer??'').trim().toUpperCase().replace(/[^A-Z]/g,'')===PAPER_STACK_ANSWER}
