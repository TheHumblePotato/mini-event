const point=(x,y)=>({x,y});

export const KEY_DIG_SITE=point(992,2720);
export const SECRET_DOOR=point(4128,992);
export const CHAMBER_LAMP=point(700,410);
export const CHAMBER_CLUES=[
 {id:'chamber-rubbing',at:point(510,570),title:'A Keeper’s rubbing',text:'A stone figure stands before a lamp. The mirror behind it is crossed out.'},
 {id:'chamber-ledger',at:point(890,570),title:'A torn ledger',text:'“The keeper does not hunt the living. It follows the black flame, and the paths it opens.”'}
];
export const ESCAPE_ROUTE=[
 point(700,410),point(700,740),point(500,740),point(500,650),point(340,650),
 point(340,510),point(620,510),point(620,390),point(900,390),point(900,520),
 point(1080,520),point(1080,300),point(820,300),point(820,160),point(600,160),
 point(420,160),point(300,320),point(300,500),point(180,500),point(180,700)
];
const routeModes=['black','warm','black','warm','black','warm','black','warm','black','warm','black','warm','black','warm','black','warm','black','warm','warm'];
export const ESCAPE_PATHS=ESCAPE_ROUTE.slice(1).map((to,index)=>({from:ESCAPE_ROUTE[index],to,mode:routeModes[index],main:true}));
ESCAPE_PATHS.push(
 {from:ESCAPE_ROUTE[2],to:point(360,840),mode:'warm'},
 {from:ESCAPE_ROUTE[4],to:point(180,650),mode:'black'},
 {from:point(180,650),to:point(180,590),mode:'warm'},
 {from:ESCAPE_ROUTE[8],to:point(1000,390),mode:'black'},
 {from:point(1000,390),to:point(1000,450),mode:'warm'},
 {from:ESCAPE_ROUTE[10],to:point(1200,520),mode:'black'},
 {from:point(1200,520),to:point(1200,420),mode:'warm'},
 {from:ESCAPE_ROUTE[14],to:point(600,260),mode:'black'}
);
export const ESCAPE_ISLANDS=[...new Map(
 ESCAPE_PATHS.flatMap(({from,to})=>[from,to]).map(p=>[`${p.x},${p.y}`,p])
).values()];

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function escapeIslandAt(position,radius=52){return ESCAPE_ISLANDS.some(island=>distance(position,island)<radius)}
export function escapePathAt(position,mode,radius=28){
 return ESCAPE_PATHS.some(({from,to,mode:pathMode})=>{
  if(pathMode!==mode)return false;
  const dx=to.x-from.x,dy=to.y-from.y,length=dx*dx+dy*dy||1;
  const t=Math.max(0,Math.min(1,((position.x-from.x)*dx+(position.y-from.y)*dy)/length));
  return Math.hypot(position.x-from.x-dx*t,position.y-from.y-dy*t)<radius;
 });
}
export function canWalkEscape(position,mode){return escapeIslandAt(position)||escapePathAt(position,mode)}
