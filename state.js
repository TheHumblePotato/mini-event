export const RELEASE=Date.parse('2026-10-31T00:00:00-07:00');
export const UNLOCKS={grave:Date.parse('2026-10-29T00:00:00-07:00'),delivery:Date.parse('2026-10-30T00:00:00-07:00'),ride:RELEASE};
export const ORDER=['contact','key','seal','lantern','escape','menuLamp','road','package','delivered','film','repair','entered'];
export const initial=()=>({version:1,stage:0,rideLetters:[],evidence:{},items:[],scores:{grave:0,delivery:0,ride:0,rideEndless:0},endings:[],prefs:{sound:true,motion:true},updatedAt:0});
export const localQA=['127.0.0.1','localhost'].includes(location.hostname)&&new URLSearchParams(location.search).get('qa')==='1';
const key='midnight-arcade-2026'+(localQA?'-qa':'');
let raw;try{raw=JSON.parse(localStorage.getItem(key)||'null')}catch{}
export const state={...initial(),...raw,prefs:{...initial().prefs,...raw?.prefs},scores:{...initial().scores,...raw?.scores},evidence:raw?.evidence||{}};
export function save(){state.updatedAt=Date.now();try{localStorage.setItem(key,JSON.stringify(state))}catch{window.dispatchEvent(new CustomEvent('storage-error'))}window.dispatchEvent(new CustomEvent('statechange'));}
export function evidence(id,title,text,type='Evidence'){state.evidence[id]={id,title,text,type};save();}
export function merge(a,b){return {...a,...b,stage:Math.max(a.stage||0,b.stage||0),evidence:{...a.evidence,...b.evidence},items:[...new Set([...(a.items||[]),...(b.items||[])])],endings:[...new Set([...(a.endings||[]),...(b.endings||[])])],scores:Object.fromEntries(['grave','delivery','ride','rideEndless'].map(k=>[k,Math.max(a.scores?.[k]||0,b.scores?.[k]||0)])),rideLetters:[...new Set([...(Array.isArray(a.rideLetters)?a.rideLetters:[]),...(Array.isArray(b.rideLetters)?b.rideLetters:[])])].filter(l=>typeof l==='string'&&l.length===1&&'GHOST'.includes(l)),prefs:a.prefs};}
export function highest(game,score){state.scores[game]=Math.max(state.scores[game]||0,Math.round(score));save();}
export const has=id=>state.stage>ORDER.indexOf(id);
export function safeText(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
