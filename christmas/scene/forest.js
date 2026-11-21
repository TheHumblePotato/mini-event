// Distant trees share a single batched silhouette. Nearby boughs also catch snow.
function pineOutline(x,y,h,w,seed){
  const points=[];
  for(let side of [-1,1]){
    const edge=[];
    for(let row=1;row<=5;row++){
      const t=row/5, span=w*(.12+.88*t)*(1+.09*Math.sin(seed+row*2+side));
      edge.push([x+side*span,y-h+t*h*.9],[x+side*span*.67,y-h+t*h*.88]);
    }
    points.push(...(side===1?edge.reverse():edge));
  }
  return 'M'+(x+Math.sin(seed*1.8)*w*.23).toFixed(1)+' '+(y-h).toFixed(1)+'L'+points.map(([a,b])=>a.toFixed(1)+' '+b.toFixed(1)).join(' ')+'Z';
}
let cachedForest;
export function distantForest(){
  if(cachedForest)return cachedForest;
  cachedForest=[0,1].map(layer=>{
    let outline='';
    const spacing=layer?10:7;
    for(let i=0;i<850/spacing;i++){
      const x=-200+i*spacing+Math.sin(i*7)*3+Math.sin(i*.48)*4;
      const y=182+Math.sin(x*.017)*7+layer*7,h=12+(.5+.5*Math.sin(i*13.77))*15+Math.sin(i*.27)*5+layer*5;
      outline+=pineOutline(x,y,h,h*(.19+.04*Math.cos(i)),i);
    }
    return '<path fill="'+(layer?'#527a72':'#74928a')+'" d="'+outline+'"/>';
  }).join('');
  return cachedForest;
}
export function woodland(){
  let trunks='',silhouettes='',tips='',needles='',birches='';
  for(let i=0;i<22;i++){
    const x=-165+i*35+Math.sin(i)*10,y=210+Math.cos(i*2)*12,h=55+26*Math.cos(i*1.8),w=h*(.19+.04*Math.sin(i));
    if(i%7===3){
      birches+=`<g transform="translate(${x} ${y}) scale(${h/78})">
        <path fill="none" stroke="#637269" stroke-width="1.1" d="M0-28q-8-16-18-21m8 7-1-10m11 15 15-16 5-3m-9 7 1-11M1-54l-10-13-5-3m9 7v-8m7 12 9-12"/>
        <path fill="#d5d8c8" d="M-2 0q1-32 0-47l3-31 1 31L2 0z"/>
        <path stroke="#737f74" stroke-width="1" d="m-1-8 2-1m-2-9 3-1m-3-8 2-1m-1-16 2-1m-1-9 2-1"/>
      </g>`;
      continue;
    }
    trunks+='M'+(x-1)+' '+y+'v-17h2v17z';
    silhouettes+=pineOutline(x,y,h,w,i);
    for(let tier=1;tier<=5;tier++){
      const t=tier/5,ay=y-h+t*h*.86,span=t*w;
      tips+=`M${x-span*.88} ${ay}q${span*.4} -1 ${span*.64} -5l-${span*.17} 4z`;
      // A second, broken shelf of snow on the shaded half of the tree.
      tips+=`M${x+span*.18} ${ay-4}q${span*.27} 3 ${span*.63} 4l-${span*.21} .7 -${span*.19} -.8z`;
      needles+=`M${x+span*.18} ${ay-4}q${span*.26} 3 ${span*.65} 5`;
    }
  }
  return `<g class="forest-trunks"><path fill="#685747" d="${trunks}"/><path fill="#3d665c" d="${silhouettes}"/><path fill="#a1b9a9" d="${tips}"/><path fill="none" stroke="#749285" stroke-width=".7" d="${needles}"/>${birches}</g>`;
}
export function rightBoughs(row,species){
  // Stagger branch fans so the eye follows individual boughs across each tier.
  let edges='',needles='';
  const blue=species==='Blue cedar'||species==='Spruce';
  for(let j=0;j<3;j++){
    const x=12+j*18+(row%3)*2,y=-38+j*8+(row%2)*3;
    edges+=`M${x} ${y}q6 8 20 12l-8-.6 3 2q-9-2-15-8z`;
    needles+=`M${x+4} ${y+5}l8 5m-3-4 7 4m-1-2 5 2`;
  }
  return `<path fill="${blue?'#659397':'#5b8b73'}" opacity=".4" d="${edges}"/><path fill="none" stroke="#abc4af" stroke-opacity=".36" stroke-width=".72" d="${needles}"/>`;
}
let auroraInstance=0;
export function aurora(){
  const id=++auroraInstance;
  return '<g class="polar-curtains">'+[0,1,2].map(i=>{
    const edge=[],upper=[];let rays='';
    for(let j=0;j<=64;j++){
      const x=-160+j*12,y=49+i*9+Math.sin(j*.16+i)*15+Math.sin(j*.31)*6;
      const height=15+14*(1+Math.sin(j*.24+i));
      edge.push(x+' '+y.toFixed(1));upper.unshift((x+9)+' '+(y-height).toFixed(1));
      rays+=`M${x} ${y.toFixed(1)}l9 -${height.toFixed(1)}`;
    }
    const tint=['#66efb2','#83dbe9','#d2a4ed'][i];
    const gradient='ribbon-'+id+'-'+i;
    return `<defs><linearGradient id="${gradient}" x1="0" x2=".14" y1="0" y2=".96"><stop stop-color="${tint}" stop-opacity="0"/><stop offset=".58" stop-color="${tint}" stop-opacity=".20"/><stop offset=".91" stop-color="${tint}" stop-opacity=".85"/><stop offset="1" stop-color="${tint}" stop-opacity=".24"/></linearGradient></defs><g class="curtain curtain-${i}" fill="${tint}" stroke="${tint}"><path fill="url(#${gradient})" opacity=".82" stroke="none" d="M${edge.concat(upper).join('L')}z"/><path fill="none" opacity=".56" stroke-width="1.5" d="M${edge.join('L')}"/><path fill="none" stroke-width="2.4" opacity=".13" d="${rays}"/></g>`;
  }).join('')+'</g>';
}



