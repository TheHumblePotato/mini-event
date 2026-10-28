export const TREASURES=[
 {id:'coins',name:'Tarnished coins',value:85,color:'#ba975e'},
 {id:'locket',name:'Mourning locket',value:155,color:'#c9a878'},
 {id:'chalice',name:'Silver chalice',value:240,color:'#c4cad5'},
 {id:'mask',name:'Funeral mask',value:330,color:'#e2ceb0'},
 {id:'idol',name:'Witchglass idol',value:460,color:'#a6b8b0'},
 {id:'crown',name:'Burial crown',value:650,color:'#dfbc68'}
];
export function rollTreasure(random){const r=random(),index=r<.36?0:r<.62?1:r<.80?2:r<.92?3:r<.985?4:5;return TREASURES[index]}
export function rollSupply(r){return r<.05?'bandages':r<.17?'fuel':r<.22?'flare':'treasure'}
export function treasureOf(cache){return TREASURES.find(t=>t.id===cache.treasure)||TREASURES[0]}
export function drawTreasure(c,id,x,y,size=1){c.save();c.translate(x,y);c.scale(size,size);const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
 if(id==='coins'){for(let i=0;i<3;i++){r(-10+i*6,-i%2*4,9,5,'#765f3e');r(-10+i*6,-3-i%2*4,9,4,'#d0ac68')}}
 else if(id==='locket'){c.strokeStyle='#bf9f69';c.lineWidth=2;c.beginPath();c.arc(0,-6,7,Math.PI,Math.PI*2);c.stroke();r(-6,-7,12,12,'#c4a16d');r(-3,-4,6,6,'#705768')}
 else if(id==='chalice'){r(-8,-13,16,8,'#c5cbd7');r(-5,-5,10,3,'#939ba9');r(-2,-2,4,8,'#aab5c6');r(-7,6,14,3,'#d2d7dc')}
 else if(id==='mask'){r(-9,-14,18,22,'#c8b99c');r(-6,-9,4,5,'#332f3b');r(3,-9,4,5,'#332f3b');r(-3,2,6,3,'#797061')}
 else if(id==='idol'){r(-6,-14,12,9,'#91aba5');r(-9,-4,18,11,'#536f71');r(-5,-11,3,2,'#d4d2ab');r(3,-11,3,2,'#d4d2ab');r(-11,7,22,3,'#839997')}
 else{r(-12,-9,24,16,'#c3a15e');for(let i=0;i<3;i++)r(-12+i*10,-17,4,10,'#e3c476');r(-3,-4,6,5,'#896981');r(-12,6,24,3,'#e9c97c')}
 c.restore();}
