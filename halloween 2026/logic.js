// Shared by browser puzzles, local preview service and Firebase Functions.
export const ORDER=['contact','hatch','seal','lantern','escape','menuLamp','road','package','delivered','film','repair','entered'];
export const SYMBOL_PATH=[2,8,14,18,22,16,10,6,2,7,12,17,22];
export const edgeKey=(a,b)=>[a,b].sort((x,y)=>x-y).join('-');
export const SYMBOL_EDGES=SYMBOL_PATH.slice(1).map((n,i)=>edgeKey(SYMBOL_PATH[i],n)).sort();
export function validSeal(edges){return Array.isArray(edges)&&JSON.stringify([...new Set(edges)].sort())===JSON.stringify(SYMBOL_EDGES)}
export const FILM_ORDER=['arrival','signal','shadow','return'];
export const REPAIR_ORDER=['lens','film','shutter'];
export const BINDING=['closed-eye','down-flame','barred-door'];
export function roadPuzzle(variant=0){
 const path=variant?[0,5,10,11,6,1,2,3,8,7,12,17,18,19,24]:[0,1,2,7,6,11,12,13,8,9,14,19,18,23,24];
 const nodes=Array.from({length:25},(_,id)=>({id,x:90+(id%5)*100,y:65+Math.floor(id/5)*90,name:String.fromCharCode(65+id)}));
 const edges=[];for(let i=0;i<path.length-1;i++)edges.push({a:path[i],b:path[i+1],mode:((Math.floor(i/3)+variant)%2?'warm':'black')});
 const decoys=variant?[[3,4,'warm'],[4,9,'black'],[8,13,'warm'],[13,14,'black'],[10,15,'warm'],[15,16,'black'],[15,20,'warm'],[20,21,'black'],[21,22,'warm'],[22,23,'black']]:[[2,3,'warm'],[3,4,'black'],[0,5,'warm'],[5,10,'black'],[10,15,'warm'],[15,20,'black'],[11,16,'warm'],[16,17,'black'],[20,21,'warm'],[21,22,'black']];
 edges.push(...decoys.map(([a,b,mode])=>({a,b,mode:variant?(mode==='warm'?'black':'warm'):mode})));
 return {nodes,edges,start:0,goal:24,mode:variant?'warm':'black',budget:4};
}
export function verifyRoute(puzzle,route){if(!Array.isArray(route)||route[0]!==puzzle.start||route.at(-1)!==puzzle.goal||route.length>70)return false;let mode=puzzle.mode,switches=0;const seen=new Set();for(let i=0;i<route.length;i++){if(seen.has(route[i]))return false;seen.add(route[i]);if(!i)continue;const e=puzzle.edges.find(e=>(e.a===route[i-1]&&e.b===route[i])||(e.b===route[i-1]&&e.a===route[i]));if(!e)return false;if(e.mode!==mode){switches++;mode=e.mode}}return switches<=puzzle.budget}
export function solveRoutes(puzzle){const answers=[];function visit(n,path,mode,used){if(n===puzzle.goal){answers.push(path);return}for(const e of puzzle.edges){const next=e.a===n?e.b:e.b===n?e.a:null;if(next===null||path.includes(next))continue;const count=used+(mode!==e.mode?1:0);if(count<=puzzle.budget)visit(next,[...path,next],e.mode,count)}}visit(puzzle.start,[puzzle.start],puzzle.mode,0);return answers}
export function transition(current,action,p={},options={}){
 const next={stage:current.stage||0,endings:[...(current.endings||[])]};
 if(action==='ending'){if(next.stage<ORDER.length)throw Error('The chamber is still sealed.');if(!['release','contain'].includes(p.kind))throw Error('Unknown ending.');if(p.kind==='contain'&&JSON.stringify(p.binding)!==JSON.stringify(BINDING))throw Error('The binding has not settled.');if(!next.endings.includes(p.kind))next.endings.push(p.kind);return next}
 const required=ORDER.indexOf(action);if(required<0)throw Error('Unknown action.');if(required<next.stage)return next;if(required!==next.stage)throw Error('An earlier part of the investigation is unfinished.');if(!options.released)throw Error('The listening platform opens on Halloween.');
 if(action==='contact'&&p.finished!==true)throw Error('Finish the introductory ride first.');
 if(action==='hatch'&&p.shadow!==true)throw Error('Find the shadow that refuses to move.');
 if(action==='seal'&&!validSeal(p.edges))throw Error('The shape does not match the pause-screen seal.');
 if(action==='escape'&&p.escaped!==true)throw Error('Carry the lantern out first.');
 if(action==='road'&&(!verifyRoute(roadPuzzle(0),p.route)||!verifyRoute(roadPuzzle(1),p.route2)))throw Error('Both causeways need a route within their switch budgets.');
 if(action==='delivered'&&p.postOffice!==true)throw Error('Find the post office in the city.');
 if(action==='film'&&JSON.stringify(p.order)!==JSON.stringify(FILM_ORDER))throw Error('The film strips are out of sequence.');
 if(action==='repair'&&JSON.stringify(p.order)!==JSON.stringify(REPAIR_ORDER))throw Error('Seat the lens, thread the film, then close the shutter.');
 next.stage++;return next;
}
export const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function ridePattern(n){const safe=(n*7+Math.floor(n/3))%3;const hazards=[{lane:(safe+1)%3,type:n%4===1?'beam':'cart'}];if(n>6&&n%3===0)hazards.push({lane:(safe+2)%3,type:n%2?'cart':'beam'});return {safe,hazards};}
