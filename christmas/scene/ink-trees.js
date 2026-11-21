// Hanging points are drawn branch ends in local coordinates. The trunk meets the snow at (0,278).
export const larchSpurs = [[0,80],[-17,103],[22,104],[-33,128],[4,141],[41,138],[-54,163],[-18,183],[38,174],[60,202],[-51,216],[14,228]];
export const stonePineBoughs = [[0,76],[-32,83],[36,86],[-58,104],[-13,111],[63,115],[-42,134],[20,132],[51,150],[-62,163],[-17,174],[18,188]];

function larch() {
  const branches=larchSpurs.map(([x,y],i)=>{
    const side=x<0?-1:1, run=Math.max(9,Math.abs(x)), start=x-side*run;
    const root=y+13+i%4*2, elbow=y+16-i%3*3;
    let twigs='',buds='';
    for(let j=3;j<run;j+=5+(i+j)%5){
      const t=j/run, back=1-t;
      const ax=2*back*t*run*.55+t*t*run, ay=back*back*root+2*back*t*elbow+t*t*y;
      const spread=3+(j*5+i)%9, h=6+(j*3+i)%13;
      twigs+=`M${ax} ${ay}q${spread*.7} -2 ${spread} -${h}m-1.1 5.2 3.7-3.5`;
      if(j%3)twigs+=`M${ax} ${ay}q${2+j%4} 4 ${1-j%3} ${5+j%9}`;
      buds+=`M${ax+spread} ${ay-h}l.6-1.6 1 .6-.7 1.6z`;
    }
    return `<g transform="translate(${start} 0) scale(${side} 1)">
      <path fill="none" stroke="#80644f" stroke-width="${1.15+i*.1}" d="M0 ${root}Q${run*.55} ${elbow} ${run} ${y}"/>
      <path fill="none" stroke="#947458" stroke-width=".72" d="${twigs}"/><path fill="#775043" d="${buds}"/>
      ${i%3===1?`<g transform="translate(${run*.7} ${y+7})"><path fill="#815c43" d="M0 0q4-3 4 2 0 4-3 5-3-3-1-7z"/><path fill="none" stroke="#c3a37a" stroke-width=".65" d="m0 2 2 1 1-2m-3 3 2 1 1-2"/></g>`:''}</g>`;
  }).reverse().join('');
  return `<g transform="translate(200 0)"><path fill="#735d4a" d="m-9 278 5-22 3-62-3-59 3-50 1-37 2 27-1 60 4 67-1 52 5 24z"/>
    <path fill="#9d8061" d="m-6 275 4-28 3-49-2-66 4 64-2 52 1 25z"/>
    <path stroke="#564e43" fill="none" d="m-3 264 2-16m2-10 1-13m0-21-.5-11"/>
    ${branches}<path class="larch-leader" fill="none" stroke="#927052" d="m0 85-3-19-4-7m7 16 5-10 1-7m-5 7 1-17"/></g>`;
}

// Broad scaly plates form the crown of a Mediterranean stone pine. The bare
// trunks are left visible under and between the clusters.
function stonePine() {
  const clusters=[
    [-60,111,35,20],[-31,89,42,25],[3,79,44,29],[34,93,41,25],[64,117,35,22],
    [-49,139,40,23],[-13,118,37,20],[24,139,40,24],[51,154,27,16],
    [-61,166,29,17],[-20,177,34,19],[18,189,28,17]
  ];
  const scallops=[
    'M-32 2q-6-7 2-10 0-7 9-7 6-7 14-4 7-8 15-4 10-4 14 3 9 0 10 7 6 3 2 8-9 7-26 7l-11 3-8-3-9 1z',
    'M-34 1q-3-5 6-8-3-7 11-9 3-7 13-5 10-5 16 1 9-2 12 4 8 3 8 8l-4 6-16 3-12-1-12 4-11-1z'
  ];
  const branches=clusters.map(([x,y],i)=>`<path d="M${i%2?-1:2} ${Math.min(246,y+46)}Q${x*.67} ${y+28} ${x} ${y-2}" stroke-width="${2+i*.25}"/>`).join('');
  const crowns=clusters.map(([x,y,w,h],i)=>`<g transform="translate(${x} ${y}) scale(${w/34} ${h/24})">
    <path fill="${i%3?'#395e4c':'#496649'}" d="${scallops[i%2]}"/>
    <path fill="#739075" d="M-30-5q2-7 11-8 1-5 9-5 7-7 13-3-8 2-9 6-8 1-11 5l-6 .4z"/>
    <path fill="#99a886" d="m-23-9 7-5 5-1-5 3-2 3zm17-9 5-3 3 .5-4 2z"/>
    <path fill="none" stroke="#9eae8c" stroke-width=".65" d="m2-7 5-4m-2 4 5-3m2 5 7-4m-3 5 4-2m-35 2 4-2"/></g>`).join('');
  return `<g transform="translate(200 0)"><path fill="#795841" d="m-11 278 6-24 7-42-6-38 5-62 1-56 2 53-1 65 7 37-6 42 5 25z"/>
    <path fill="#a27854" d="m-6 274 6-25 6-37-5-28 8 26-6 42-1 20z"/><g stroke="#665540" stroke-linecap="round" fill="none">${branches}</g>
    ${crowns}<path fill="none" stroke="#574c3f" stroke-width="1.2" d="m-3 263 4-9-1-7m4-7 3-10m-3-1 2-6"/></g>`;
}

export const inkTrees={'European larch':larch,'Stone pine':stonePine};
