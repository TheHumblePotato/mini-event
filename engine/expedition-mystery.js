const point=(x,y)=>({x,y});

export const KEY_DIG_SITE=point(992,2720);
export const SECRET_DOOR=point(4128,992);
export const CHAMBER_LAMP=point(700,410);
export const CHAMBER_CLUES=[
 {id:'chamber-rubbing',at:point(180,900),title:'A Keeper’s rubbing',text:'No oil it drinks, no warmth it lends;\nIt feeds the mouths where breathing ends.\nBeneath its wick the buried wake;\nThe dead grow strong with each step you take.'},
 {id:'chamber-ledger',at:point(1220,900),title:'A torn ledger',text:'“The keeper does not hunt the living. It follows the black flame, and the paths it opens.”'}
];
export const ESCAPE_ROUTE=[
 point(700,410),point(700,700),point(400,700),point(400,400),point(180,400),
 point(180,150),point(450,150),point(450,400),point(700,400),point(700,150),
 point(980,150),point(980,440),point(1230,440),point(1230,700),point(970,700),
 point(970,920),point(700,920),point(700,700),point(420,920),point(180,700)
];
const routeModes=['black','warm','black','warm','black','warm','black','warm','black','warm','black','warm','black','warm','black','warm','black','warm','warm'];
export const ESCAPE_PATHS=ESCAPE_ROUTE.slice(1).map((to,index)=>({from:ESCAPE_ROUTE[index],to,mode:routeModes[index],main:true}));
ESCAPE_PATHS.push(
 {from:ESCAPE_ROUTE[2],to:point(400,930),mode:'warm'},
 {from:ESCAPE_ROUTE[4],to:point(180,650),mode:'black'},
 {from:point(180,650),to:point(420,650),mode:'warm'},
 {from:ESCAPE_ROUTE[7],to:point(450,650),mode:'black'},
 {from:ESCAPE_ROUTE[10],to:point(980,400),mode:'black'},
 {from:point(980,400),to:point(1170,400),mode:'warm'},
 {from:ESCAPE_ROUTE[12],to:point(1230,170),mode:'black'},
 {from:ESCAPE_ROUTE[14],to:point(740,700),mode:'black'},
 {from:ESCAPE_ROUTE[16],to:point(700,690),mode:'warm'},
 {from:ESCAPE_ROUTE[18],to:point(420,700),mode:'black'}
);
export const ESCAPE_ISLANDS=[...new Map(
 ESCAPE_PATHS.flatMap(({from,to})=>[from,to]).map(p=>[`${p.x},${p.y}`,p])
).values()];

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function escapeIslandAt(position,radius=92){return ESCAPE_ISLANDS.some(island=>distance(position,island)<radius)}
export function escapePathAt(position,mode,radius=44){
 return ESCAPE_PATHS.some(({from,to,mode:pathMode})=>{
  if(pathMode!==mode)return false;
  const dx=to.x-from.x,dy=to.y-from.y,length=dx*dx+dy*dy||1;
  const t=Math.max(0,Math.min(1,((position.x-from.x)*dx+(position.y-from.y)*dy)/length));
  return Math.hypot(position.x-from.x-dx*t,position.y-from.y-dy*t)<radius;
 });
}
export function canWalkEscape(position,mode){return escapeIslandAt(position)||escapePathAt(position,mode)}
