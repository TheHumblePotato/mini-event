// Each point is both a branch junction and a possible hanging point.
// Coordinates are relative to the center of the tree, with roots at y=278.
const birchForks = [[0,84],[-22,107],[23,105],[-41,136],[6,131],[44,143],[-60,166],[-20,177],[31,176],[62,196],[-51,216],[6,220]];
const puzzleForks = [[0,86],[-18,105],[21,110],[-37,133],[4,143],[39,148],[-51,172],[-16,186],[33,181],[60,212],[-57,218],[8,228]];
export function winterHangers(species) {
  if (species === 'Paper birch') return birchForks;
  if (species === 'Monkey puzzle') return puzzleForks;
}

function birch() {
  const limbs = birchForks.map(([x,y],i) => {
    const side = x < 0 ? -1 : 1, foot = y>150 ? -2 : 1;
    const tip = 14 + i%3*4;
    const forkX=foot+(x-foot)*.58, forkY=y+16;
    return `<g fill="none" stroke-linecap="round">
      <path stroke="#645b58" stroke-width="${1.5+i*.15}" d="M${foot} ${y+35}Q${x*.65} ${y+22} ${x} ${y}"/>
      <path stroke="#d4cbbb" d="M${foot} ${y+33}Q${x*.65} ${y+21} ${x} ${y}"/>
      <g transform="translate(${forkX} ${forkY}) scale(${side} 1)" stroke="#8e776a" stroke-width=".92">
        <path d="M0 1q3-9 1-16l-5-9m6 11 6-10m-7 2-3-9"/>
        ${i%2 ? '<path d="M-2 3q14-1 26-10l7-3m-15 8 2-7m5 3 5-6"/>' : ''}
      </g>
      <g transform="translate(${x} ${y}) scale(${side} 1)"><g class="birch-spray" style="--phase:-${i*.6}s">
        <path stroke="#74605c" stroke-width="1.1" d="M0 1q11-11 ${tip}-27M5-6Q7-15 5-23m5 13 11-7M0 0q-1-13-7-20"/>
        <path stroke="#938074" stroke-width=".7" d="m9-12 2-10m4 7 7-3m-17-1-4-8m-4 12-7-4m5 0-1-8"/>
        <path stroke="#b28c54" stroke-width="1.8" d="m${tip} -27 1 4m-16 2 .5 3"/>
      </g></g></g>`;
  }).join('');
  return `<g transform="translate(200 0)">
    <path fill="#736b63" d="M-12 278q9-59 5-105l-2-19 7 13 4-45-5-64 4-10 1 14 4 57-3 73 5 86z"/>
    <path fill="#e5e2cd" d="M-9 277q7-64 3-102l-1-13 7 10 5-53-5-62 4 64-2 63 2 92z"/>
    <path fill="none" stroke="#756c62" stroke-linecap="round" d="m-8 260 8 1m-6-9 3 1m4-18 4-2m-8-10 6 1m-6-13 3 .5m4-20 3-1m-3-28 3-1m-6-53 3 .5"/>
    ${limbs}<path fill="#e7e4d5" d="m-14 278 6-3 16 1 7 3z"/></g>`;
}

function puzzleLimb(x,y,i,shaded) {
  const side=x<0?-1:1, span=Math.abs(x), drop=9+i*.45;
  const curve=t=>y+drop*(1-t)+8*Math.sin(Math.PI*t);
  let leaves='',facets='';
  for(let j=1;j<=span;j+=2.8){
    const t=j/span, h=3.7+(1-t)*2.6, at=curve(t);
    leaves+=`M${j-3} ${at+1}q2 -2 1 -${h+2} 4 2 5 ${h}l-2 4z`;
    facets+=`M${j} ${at+1}l3 3.3-1-4.7z`;
  }
  return `<g transform="scale(${side} 1)">
    <path fill="none" stroke="${shaded?'#415d4a':'#557451'}" stroke-width="4" d="M0 ${curve(0)}Q${span*.59} ${y+drop+14} ${span} ${y}"/>
    <path fill="${shaded?'#3a5e50':'#477455'}" d="${leaves}"/><path fill="${shaded?'#70866a':'#9aaf7e'}" d="${facets}"/>
    <g transform="translate(${span} ${y})"><g class="puzzle-tip" style="--phase:-${i*.7}s">
      <path fill="${shaded?'#526f57':'#78916a'}" d="M-3 3Q0-2 1-7l2 2 1-7 2 3 2-6q1 8-3 15L3-2 1 2z"/>
      <path fill="#a9b88c" d="m2-4 2-5-.5 5z"/></g></g></g>`;
}

function monkeyPuzzle() {
  const back=[], front=[];
  puzzleForks.forEach(([x,y],i)=>{
    back.push(puzzleLimb(-x*.83-5,y-8,i,true));
    if(i>1)back.push(puzzleLimb(x*.52+3,y+6,i,true));
    front.push(puzzleLimb(x,y,i,false));
  });
  return `<g transform="translate(200 0)"><path fill="#776353" d="m-9 278 4-87 3-112 2-31 3 34 3 126 4 70z"/>
    <path fill="none" stroke="#ac9470" stroke-width="1.6" d="m-7 267 12-3m-11-7 10 2m-10-12 11-2m-11-10 10 1m-9-10 8-2"/>
    ${back.reverse().join('')}${front.reverse().join('')}<path fill="#54774f" d="M-3 99q-6-9-7-18l7 5-6-15 7 6-4-15 5 5 1-18 4 17 5-6-4 16 6-5-6 15 7-4q-4 11-10 17z"/>
    <path fill="#8ca47b" d="m-2 77-3-8 4 4zm4-5 4-7-2 8zM-1 62l1-10 1 9z"/>
    </g>`;
}

export const winterTrees = {'Paper birch':birch, 'Monkey puzzle':monkeyPuzzle};
