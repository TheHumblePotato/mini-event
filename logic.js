// Shared by browser puzzles, local preview service and Firebase Functions.
export const ORDER=['contact','key','seal','lantern','escape','menuLamp','road','package','delivered','film','repair','entered'];
export const SYMBOL_PATH=[2,8,14,18,22,16,10,6,2,7,12,17,22];
export const edgeKey=(a,b)=>[a,b].sort((x,y)=>x-y).join('-');
export const SYMBOL_EDGES=SYMBOL_PATH.slice(1).map((n,i)=>edgeKey(SYMBOL_PATH[i],n)).sort();
export function validSeal(edges){return Array.isArray(edges)&&JSON.stringify([...new Set(edges)].sort())===JSON.stringify(SYMBOL_EDGES)}
export const FILM_ORDER=['arrival','signal','shadow','return'];
export const REPAIR_ORDER=['lens','film','shutter'];
export const BINDING=['closed-eye','down-flame','barred-door'];
export function roadPuzzle(variant=0){
 const invert=mode=>variant?(mode==='warm'?'black':'warm'):mode;
 const trunk=Array.from({length:20},(_,i)=>({id:i,x:55+i*82,y:250+Math.sin(i*.68)*170+Math.sin(i*1.71)*45,name:String.fromCharCode(65+i%26)}));
 const branches=[
  {id:20,x:trunk[5].x+12,y:trunk[5].y+245,name:'LOWER I'},
  {id:21,x:trunk[7].x-10,y:trunk[7].y+245,name:'LOWER II'},
  {id:22,x:trunk[11].x+8,y:trunk[11].y-245,name:'UPPER I'},
  {id:23,x:trunk[13].x-14,y:trunk[13].y-245,name:'UPPER II'},
  {id:24,x:trunk[19].x+125,y:trunk[19].y-18,name:'THE DEPOT'}
 ];
 const nodes=[...trunk,...branches],edges=[];
 const mainMode=i=>invert(Math.floor(i/3)%2?'warm':'black');
 for(let i=0;i<19;i++)edges.push({a:i,b:i+1,mode:mainMode(i)});
 edges.push({a:19,b:24,mode:mainMode(19)});
 edges.push(
  {a:5,b:20,mode:mainMode(5)},{a:20,b:21,mode:mainMode(6)},{a:21,b:8,mode:mainMode(7)},
  {a:11,b:22,mode:mainMode(11)},{a:22,b:23,mode:mainMode(12)},{a:23,b:15,mode:mainMode(13)},
  {a:20,b:22,mode:mainMode(6)},{a:21,b:23,mode:mainMode(7)}
 );
 return {nodes,edges,start:0,goal:24,mode:invert('black'),budget:8};
}
export function verifyRoute(puzzle,route){if(!Array.isArray(route)||route[0]!==puzzle.start||route.at(-1)!==puzzle.goal||route.length>70)return false;let mode=puzzle.mode,switches=0;const seen=new Set();for(let i=0;i<route.length;i++){if(seen.has(route[i]))return false;seen.add(route[i]);if(!i)continue;const e=puzzle.edges.find(e=>(e.a===route[i-1]&&e.b===route[i])||(e.b===route[i-1]&&e.a===route[i]));if(!e)return false;if(e.mode!==mode){switches++;mode=e.mode}}return switches<=puzzle.budget}
export function solveRoutes(puzzle){const answers=[];function visit(n,path,mode,used){if(n===puzzle.goal){answers.push(path);return}for(const e of puzzle.edges){const next=e.a===n?e.b:e.b===n?e.a:null;if(next===null||path.includes(next))continue;const count=used+(mode!==e.mode?1:0);if(count<=puzzle.budget)visit(next,[...path,next],e.mode,count)}}visit(puzzle.start,[puzzle.start],puzzle.mode,0);return answers}
export function transition(current,action,p={},options={}){
 const next={stage:current.stage||0,endings:[...(current.endings||[])]};
 if(action==='ending'){if(next.stage<ORDER.length)throw Error('The chamber is still sealed.');if(!['release','contain'].includes(p.kind))throw Error('Unknown ending.');if(p.kind==='contain'&&JSON.stringify(p.binding)!==JSON.stringify(BINDING))throw Error('The binding has not settled.');if(!next.endings.includes(p.kind))next.endings.push(p.kind);return next}
 const required=ORDER.indexOf(action);if(required<0)throw Error('Unknown action.');if(required<next.stage)return next;if(required!==next.stage)throw Error('An earlier part of the investigation is unfinished.');if(!options.released)throw Error('The listening platform opens on Halloween.');
 if(action==='contact'&&p.finished!==true)throw Error('Finish the introductory ride first.');
 if(action==='key'&&p.found!==true)throw Error('Find the fixed key beneath the West Burial Hall.');
 if(action==='seal'&&!validSeal(p.edges))throw Error('The shape does not match the pause-screen seal.');
 if(action==='lantern'&&p.warningRead!==true)throw Error('Read the warning before taking the black lantern.');
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
