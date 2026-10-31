// Shared by browser puzzles, local preview service and Firebase Functions.
export const ORDER=['contact','key','seal','lantern','escape','menuLamp','road','package','delivered','papers','entered'];
export const SYMBOL_PATH=[2,8,14,18,22,16,10,6,2,7,12,17,22];
export const edgeKey=(a,b)=>[a,b].sort((x,y)=>x-y).join('-');
export const SYMBOL_EDGES=SYMBOL_PATH.slice(1).map((n,i)=>edgeKey(SYMBOL_PATH[i],n)).sort();
export function validSeal(edges){return Array.isArray(edges)&&JSON.stringify([...new Set(edges)].sort())===JSON.stringify(SYMBOL_EDGES)}
export function transition(current,action,p={},options={}){
 const next={stage:current.stage||0,endings:[...(current.endings||[])]};
 if(action==='ending'){if(next.stage<ORDER.length)throw Error('The chamber is still sealed.');if(!['release','contain'].includes(p.kind))throw Error('Unknown ending.');if(!next.endings.includes(p.kind))next.endings.push(p.kind);return next}
 const required=ORDER.indexOf(action);if(required<0)throw Error('Unknown action.');if(required<next.stage)return next;if(required!==next.stage)throw Error('An earlier part of the investigation is unfinished.');if(!options.released)throw Error('The listening platform opens on Halloween.');
 if(action==='contact'&&p.finished!==true)throw Error('Finish the introductory ride first.');
 if(action==='key'&&p.found!==true)throw Error('Find the fixed key beneath the West Burial Hall.');
 if(action==='seal'&&!validSeal(p.edges))throw Error('The shape does not match the pause-screen seal.');
 if(action==='lantern'&&p.warningRead!==true)throw Error('Read the warning before taking the black lantern.');
 if(action==='escape'&&p.escaped!==true)throw Error('Carry the lantern out first.');
 if(action==='road'&&p.crossedBridge!==true)throw Error('Cross the revealed bridge into Gloaming.');
 if(action==='package'&&p.deliveries!==3)throw Error('Complete all three Gloaming deliveries before taking the railway parcel.');
 if(action==='delivered'&&p.postOffice!==true)throw Error('Find the post office in the city.');
 if(action==='papers'&&p.pages!==5)throw Error('Gather all five papers before assembling the stack.');
 next.stage++;return next;
}
export const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function ridePattern(n){const safe=(n*7+Math.floor(n/3))%3;const hazards=[{lane:(safe+1)%3,type:n%4===1?'beam':'cart'}];if(n>6&&n%3===0)hazards.push({lane:(safe+2)%3,type:n%2?'cart':'beam'});return {safe,hazards};}
