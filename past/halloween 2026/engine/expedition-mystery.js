const point=(x,y)=>({x,y});

export const KEY_DIG_SITE=point(992,2720);
export const SECRET_DOOR=point(4128,992);
export const CHAMBER_LAMP=point(700,410);
export const ESCAPE_BARRICADES=[
 {x:4078,y:1742,w:228,h:36},
 {x:3406,y:2350,w:36,h:228},
 {x:2482,y:1358,w:228,h:36}
];
export const CHAMBER_CLUES=[
 {id:'chamber-rubbing',at:point(180,900),title:'A Keeper’s rubbing',text:'No oil it drinks, no warmth it lends;\nIt feeds the mouths where breathing ends.\nBeneath its wick the buried wake;\nThe dead grow strong with each step you take.'},
 {id:'chamber-ledger',at:point(1220,900),title:'A torn ledger',text:'“The black lantern draws the dead. They gather at the side door and follow its bearer back toward the cemetery gate.”'}
];
