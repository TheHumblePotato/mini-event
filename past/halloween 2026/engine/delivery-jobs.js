import {rng,dist} from './physics.js';
import {deliveryRoute} from './delivery-network.js';
import {ROOKHAVEN_REWARD_MULTIPLIER} from './delivery-balance.js';
export const JOB_TYPES=[
 {id:'sweets',name:'Briar House',kind:'house',parcel:'PUMPKIN SWEETS',reason:'Refill the porch bowls before the next wave of trick-or-treaters.',task:'delivery'},
 {id:'candles',name:'Cemetery Lodge',kind:'cemetery',parcel:'VIGIL CANDLES',reason:'Collect candles, then take them to the groundskeeper for the remembrance vigil.',task:'pickup'},
 {id:'chapel',name:'Old Chapel',kind:'chapel',parcel:'LANTERN BATTERY',reason:'The lantern walk has gone dark. Deliver and connect a replacement battery.',task:'service',action:'CONNECT BATTERY',workSeconds:2.4},
 {id:'party',name:'Candlewick Hotel',kind:'hotel',parcel:'CARAMEL APPLES',reason:'The hotel Halloween ball needs its last tray of caramel apples.',task:'delivery'},
 {id:'costumes',name:'Moonlight Theatre',kind:'theatre',parcel:'COSTUME CRATE',reason:'Collect the missing costumes and bring them to the theatre before curtain-up.',task:'pickup'},
 {id:'school',name:'Hollow School',kind:'school',parcel:'CONTEST PRIZES',reason:'Get the costume-contest prizes to the school courtyard.',task:'delivery'},
 {id:'watch',name:'Moonwatch Observatory',kind:'tower',parcel:'PRISM LENS',reason:'The observatory needs an unbroken prism for tonight’s lantern projection.',task:'fragile'},
 {id:'post',name:'Postal Annex',kind:'post',parcel:'HALLOWEEN MAIL',reason:'Bring the late collection to the night clerk.',task:'delivery'},
 {id:'cider',name:'Last Light Diner',kind:'diner',parcel:'HOT CIDER',reason:'Collect hot cider and take it to the festival before it cools.',task:'pickup',perishable:true},
 {id:'glass',name:'Witchglass Greenhouse',kind:'greenhouse',parcel:'GLASS SEEDLINGS',reason:'These glowing glass seedlings crack if you take corners too hard.',task:'fragile'},
 {id:'generator',name:'Lantern Fire Station',kind:'firestation',parcel:'GENERATOR FUEL',reason:'Unload fuel and restart the station’s emergency lantern generator.',task:'service',action:'RESTART GENERATOR',workSeconds:2.8},
 {id:'shop',name:'Black Cat Curios',kind:'witchshop',parcel:'FESTIVAL CHARMS',reason:'The charm shop is preparing the last protective lantern displays.',task:'delivery'},
 {id:'rail',name:'Nightjar Station',kind:'station',parcel:'SIGNAL LAMP',reason:'Replace a failed signal lamp before the final Halloween service.',task:'service',action:'REPLACE SIGNAL',workSeconds:2.2},
 {id:'dock',name:'Salt Lantern Warehouse',kind:'warehouse',parcel:'PARADE LANTERNS',reason:'The dock convoy needs its lantern shipment unloaded at the warehouse.',task:'service',action:'UNLOAD LANTERNS',workSeconds:1.8}
];
export const routeLength=route=>route.reduce((s,p,i)=>s+(i?dist(p,route[i-1]):0),0);
export function questFor(stop,world,p,random){let pickup=null;if(stop.task==='pickup'){const choices=world.stops.filter(s=>!s.storyOnly&&s.id!==stop.id&&s.district===stop.district);choices.sort((a,b)=>dist(a,stop)-dist(b,stop));pickup=choices[Math.floor(random()*Math.min(4,choices.length))]||null}const distance=pickup?routeLength(deliveryRoute(p,pickup))+routeLength(deliveryRoute(pickup,stop)):routeLength(deliveryRoute(p,stop)),ghost=stop.district==='rookhaven'||pickup?.district==='rookhaven',base=100+Math.round(distance*.55)+(stop.task==='pickup'?70:stop.task==='service'?40:stop.task==='fragile'?60:0);return {id:stop.id+'-'+Math.floor(random()*1e9),stop,pickup,target:pickup||stop,phase:pickup?'pickup':'dropoff',distance,reward:Math.round(base*(ghost?ROOKHAVEN_REWARD_MULTIPLIER:1)),ghost,quality:100,started:0,deadline:null}}
export function createQuestOffers(world,p,seed,recent=[],closures=[]){const random=rng(seed),pool=world.stops.filter(s=>!s.storyOnly&&!recent.slice(-4).includes(s.id)).map(s=>({stop:s,d:routeLength(deliveryRoute(p,s,closures))})).filter(v=>v.d>0);pool.sort((a,b)=>a.d-b.d);const pick=(items)=>items[Math.floor(random()*items.length)];const selected=[];
 const near=pool.slice(0,Math.min(7,pool.length));if(near.length)selected.push(pick(near).stop);
 const current=selected[0]?.district,mediumDistrict=current==='hollow'?'briarwick':current==='briarwick'?'hollow':'briarwick',other=pool.filter(v=>!selected.includes(v.stop)&&v.stop.district===mediumDistrict);if(other.length)selected.push(pick(other).stop);
 const risky=pool.filter(v=>!selected.includes(v.stop)&&v.stop.district==='rookhaven'),remaining=pool.filter(v=>!selected.includes(v.stop));if((risky.length?risky:remaining).length)selected.push(pick(risky.length?risky:remaining).stop);
 while(selected.length<3){const rest=pool.filter(v=>!selected.includes(v.stop));if(!rest.length)break;selected.push(pick(rest).stop)}return selected.map(s=>questFor(s,world,p,random));}
