export const PAPER_RECORDS=[
 {id:0,time:'22:41',heading:'Signal keeper’s note',falseLetter:'I',text:'At the third bill, the tunnel lamp failed. The bell tower had been silent all evening until then. The mirror at the end still held a point of light.'},
 {id:1,time:'23:17',heading:'Order from the stationmaster',falseLetter:'E',text:'The guard came in from the rein, leaving wet footprints across the office. The storm had flooded the platform. I told him to hold the north gate until morning. Someone behind the mirror was still breathing.'},
 {id:2,time:'22:10',heading:'Gate inspection',falseLetter:'A',text:'The coat of a replacement chain was entered in the accounts: three shillings. The north gate was chained from the platform side. No key was signed out.'},
 {id:3,time:'22:58',heading:'Porter’s platform report',falseLetter:'V',text:'A folded vote lay beside the mirror. Written on the paper in a shaking hand: “Please open the gate.” One wet set of footprints crossed the platform and stopped at the chain.'},
 {id:4,time:'22:26',heading:'Last departure ledger',falseLetter:'L',text:'The final train left at light, according to the clerk. Every clock showed 22:26 at night. The platform lamps had already gone dark. No train was listed on the return line.'}
];
export const PAPER_STACK_ORDER=[2,4,0,3,1];
export const PAPER_STACK_ANSWER='ALIVE';
export function isPaperChronology(order){return Array.isArray(order)&&order.length===PAPER_STACK_ORDER.length&&order.every((id,index)=>id===PAPER_STACK_ORDER[index])}
export function paperAnswerFromOrder(order){return isPaperChronology(order)?order.map(id=>PAPER_RECORDS.find(page=>page.id===id).falseLetter).join(''):''}
export function paperAnswerMatches(answer){return String(answer??'').trim().toUpperCase().replace(/[^A-Z]/g,'')===PAPER_STACK_ANSWER}
