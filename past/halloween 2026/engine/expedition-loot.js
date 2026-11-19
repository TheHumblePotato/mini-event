import {dist} from './physics.js';
export function strikeCache(cache,phase){if(cache.collected)return {collected:false,noise:false};if(phase>=.34&&phase<=.7){cache.hits=(cache.hits||0)+1;return {success:true,complete:cache.hits>=3,noise:true}}return {success:false,complete:false,noise:true}}
export function collectCache(cache,inventory){if(cache.collected)return false;cache.collected=true;inventory.score+=cache.value;inventory.recovered++;return true}
export function advanceCoffins(caches,dt){for(const c of caches){if(c.opening>0){c.opening=Math.max(0,c.opening-dt);if(c.opening===0)c.opened=true}}}
export const closeCache=(caches,p)=>caches.filter(c=>!c.collected&&dist(c,p)<85).sort((a,b)=>dist(a,p)-dist(b,p))[0]||null;
