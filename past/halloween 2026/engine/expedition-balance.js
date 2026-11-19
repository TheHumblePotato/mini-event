import {clamp} from './physics.js';
export const FUEL_DRAIN={lit:.68,shuttered:.10};
export function lampPower(fuel,lit=true){const f=clamp(fuel/100,0,1),on=lit&&f>0,reach=f>=.3?.6+.4*Math.sqrt((f-.3)/.7):.6*Math.pow(f/.3,1.8),strength=f>=.3?.88+.12*(f-.3)/.7:.88*Math.pow(f/.3,1.5);return {radius:on?18+282*reach:18,beamRange:on?440*reach:0,strength:on?strength:.035}}
export function drainFuel(fuel,lit,dt){return Math.max(0,fuel-dt*(lit?FUEL_DRAIN.lit:FUEL_DRAIN.shuttered))}
export function drainInvestigationFuel(fuel,lit,dt){return drainFuel(fuel,lit,dt*.65)}
export function threatPressure(recovered,fuel,seconds=0){const danger=Math.floor(recovered/3)+Math.floor((100-fuel)/30)+Math.floor(seconds/70);return {ghosts:Math.min(4,1+Math.floor(danger/2)),zombies:Math.min(8,2+Math.floor(recovered/4)+Math.floor((100-fuel)/40)+Math.floor(seconds/100)),interval:Math.max(17,52-danger*4),active:recovered>0||fuel<75||seconds>=35,bellringers:seconds>=90?Math.min(2,1+Math.floor(seconds/220)):0,mimics:seconds>=150?Math.min(3,1+Math.floor((seconds-150)/70)):0,gravebound:seconds>=140?Math.min(2,1+Math.floor(seconds/300)):0}}
export function applySupply(kind,health,fuel,flares){return {health:Math.min(100,health+(kind==='bandages'?30:0)),fuel:Math.min(100,fuel+(kind==='fuel'?35:0)),flares:Math.min(8,flares+(kind==='flare'?1:0))}}

export const ROUND_SECONDS=300;
export function roundOutcome(seconds,recovered){return seconds>=ROUND_SECONDS?{ended:true,bankFraction:.5}: {ended:false,bankFraction:1}}

export function formatCountdown(remaining){const s=Math.ceil(Math.max(0,remaining));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
