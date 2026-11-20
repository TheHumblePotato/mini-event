// Alternate silhouettes fitted to the existing branch slots and topper height.
const speciesPaint={
  'Giant sequoia':['#415d4b','#687955','#a9ad80'],
  'Atlas cedar':['#315e65','#507e80','#a4bdb1'],
  'Western hemlock':['#325948','#56816a','#a3b59b']
};
export function specimen(species){
  const paint=speciesPaint[species];
  if(!paint)return '';
  const cedar=species==='Atlas cedar',sequoia=species==='Giant sequoia';
  const count=cedar?8:sequoia?9:7;
  let boughs='';
  for(let i=0;i<count;i++){
    const t=i/(count-1),y=250-t*166,r=(sequoia?73:96)*(1-t)+15;
    const tilt=Math.sin(i*2)*(cedar?4:2),drop=cedar?4:sequoia?11:15;
    boughs+=`<g transform="translate(0 ${y}) rotate(${tilt}) scale(${r/100} 1)">
      <path fill="${paint[0]}" d="M0 -36Q-31 -18 -65 -12L-101 -4q13 ${drop} 31 4l-4 4q38 3 59-5 25 12 56 4l-4 3q30-2 61-12Q45 -11 0 -36z"/>
      <path fill="${paint[1]}" d="M0 -36Q-31 -18 -65 -12l-32 8q29 0 53-10l-8 6q26-5 40-16z"/>
      <path stroke="${paint[2]}" stroke-opacity=".65" stroke-width=".9" fill="none" d="m-70-7 20-7m-9 7 11-5m61-4 16 7m6-2 13 4"/>
    </g>`;
  }
  return `<g transform="translate(200 0)"><path fill="${sequoia?'#975f45':'#765c46'}" d="m-9 278 6-180 4-48 3 65 4 142 5 21z"/>
    <path fill="none" stroke="#b98d69" stroke-width="1.4" d="m-5 275 2-31m5 27-1-18"/>${boughs}</g>`;
}
