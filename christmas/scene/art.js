import {heirlooms} from './heirlooms.js';
import {winterKeepsakes} from './winter-keepsakes.js';
import {winterHangers} from './winter-trees.js';
import {treeTopper} from './landmarks.js';
import {keepsakes} from './keepsakes.js';
import {panorama,foliage} from './woodcut.js';
// Cut-paper scene with one painted ornament for each visitor submission.
const loop='<ellipse cy="-8" rx="1.6" ry="2" fill="none" stroke="#d4b783" stroke-width=".8"/>';
const shapes={...keepsakes,...heirlooms,...winterKeepsakes,
  Skate:'<path d="M-6-7h7l1 6 6 3q2 3-2 4H-7z"/><path fill="none" stroke="#f9eac9" d="M-3-4h4m-4 2h4m-6 8v2m7-2v2m-12 0H7q2 0 2-2"/>',
  Cardinal:'<path d="m-9 5 4-6q1-5 6-4l1-4 3 4q4 1 3 5L5 3Q1 8-5 5l-5 4z"/><path fill="#e9b564" d="m7-3 4 2-4 1z"/><circle cx="5" cy="-3" r="1" fill="#342c29"/><path fill="none" stroke="#fff4d7" d="M-5 2q4 2 7-2"/>',
  Pinecone:'<path d="M0-9Q9-6 7 1 6 7 0 10-9 5-7-2q0-5 7-7z"/><path fill="none" stroke="#fbdda6" d="m-4-4 3 2 3-2m-8 4 3 2 3-2 3 2 3-2m-9 5 3 2 3-2"/>',
  Heart:'<path d="M0 8Q-12 0-7-6q4-4 7 1 5-6 8-1Q12 0 0 8z"/><path d="M-6-3q0-2 2-2" stroke="#fff2d4" fill="none"/>',
  Crescent:'<path d="M4-9A9 9 0 1 0 8 5Q-3 5 4-9z"/>',
  Lantern:'<path d="m-6-5 6-4 6 4zm1 1H5L4 7h-8z"/><path fill="#fff0ae" d="M-3-2h6L2 5h-4z"/><path d="M-6 7H6v2H-6z"/>',
  Mitten:'<path d="M-5-4q0-5 4-5 4 0 5 4l1 3q4-4 5-1 1 2-5 7L4 7h-8q-3-5-1-11z"/><path fill="#fff0ce" d="M-5 5H5v3H-5z"/><path stroke="#fff0ce" fill="none" d="m-4-1 2 2 2-2 2 2"/>',
  Bauble:'<circle cy="1" r="7"/><path fill="#e6c18b" d="M-3-8h6v3h-6z"/><path stroke="#fff6d9" fill="none" d="m-6 0 3 2 3-2 3 2 3-2"/><circle cx="-3" cy="-2" r="1" fill="white"/>',
  Bell:'<path d="M-8 5Q-5 2-5-2a5 5 0 0 1 10 0q0 4 3 7z"/><path stroke="#fbe5b4" d="M-6 4h12"/><g class="clapper"><path stroke="#83653f" d="M0 4v4"/><circle cy="8" r="1.8" fill="#b87e43"/></g>',
  Gift:'<rect x="-7" y="-4" width="14" height="12" rx="1"/><path d="M0-4v12m-7-8H7" fill="none" stroke="#fff2ce" stroke-width="2"/>',
  Ribbon:'<path d="M0-2l-8-5v10l7-3-4 8 4-2 2 2 1-8 6 3V-7z"/>',
  Snowflake:'<path d="M0-8V8m-7-12 14 8m0-8L-7 4M-3-6l3 2 3-2m-6 12 3-2 3 2" fill="none" stroke="currentColor" stroke-width="2"/><path class="glint" fill="#fff8d7" d="m4-8 .6 2.3 2.4.7-2.4.7L4-2l-.6-2.3L1-5l2.4-.7z"/>'
};
export const palette={
  Cranberry:'#c4474f',Gold:'#f1c351',Plum:'#986cbe',Copper:'#a36643',Mint:'#abe7bc','Ice blue':'#b0dcec',
  Sapphire:'#497bc9',Evergreen:'#43784c',Ivory:'#fff0d2',Mulberry:'#853766',Tangerine:'#fa8841',
  'Rose quartz':'#eea6ba',Pewter:'#90949b',Peacock:'#258e91',
  Lampblack:'#39383c',Lichen:'#b1b959',Ultramarine:'#383d94','Lilac chalk':'#d8c9eb'
};
export function ornamentIcon(kind,color){
  return '<svg viewBox="-12 -15 24 27" aria-hidden="true" style="color:'+palette[color]+'" fill="currentColor"><path d="M0-13v8" stroke="#aa8956"/>'+loop+shapes[kind]+'</svg>';
}
export function scene(tree, animatedWeather=false) {
  const narrow=tree.species==='Cypress';
  const spruce=tree.species==='Spruce';

  const flakes=animatedWeather||['Clear','Ice halo','Lake mist','Light pillars','Hoarfrost'].includes(tree.weather)?'':Array.from({length:tree.weather==='Flurries'?115:65},()=>{
    const r=Math.random(),x=Math.random()*1100-350;
    const duration=(tree.weather==='Flurries'?8:14)+(1-r)*10;
    return '<ellipse cx="'+x+'" cy="-20" rx="'+(.22+r*.68)+'" ry="'+(.33+r*.74)+'" style="--fall:'+duration+'s;--phase:-'+Math.random()*duration+'s;--drift:'+(tree.weather==='Flurries'?45+r*45:4+r*14)+'px;opacity:'+(.32+r*.53)+'" fill="#fffaf0"/>';
  }).join('');
  const ornaments=(tree.cards||[]).map((card,i)=>{
    const slots=[[0,96],[-19,130],[19,130],[-32,164],[0,159],[32,164],[-49,199],[-14,197],[24,195],[53,234],[6,234],[-40,234]];
    const [offset,level]=slots[i%slots.length];
    const hanger=winterHangers(tree.species)?.[i%slots.length];
    const x=200+(hanger ? hanger[0] : offset*(narrow?.62:spruce?.82:1));
    const y=hanger ? hanger[1]+12 : tree.species==='Scots pine'?level*.89+9:level;
    return '<g class="hanging" role="button" tabindex="0" aria-label="Open '+card.kind+' ornament" data-card="'+i+'" style="--motion-delay:-'+(i*1.73)+'s" transform="translate('+x+' '+y+')" color="'+palette[card.color]+'" fill="currentColor"><circle r="12" fill="transparent"/><g class="charm"><path d="M0-12v7" stroke="#fff0c2"/>'+loop+shapes[card.kind]+'</g></g>';
  }).join('');
  const star=treeTopper(tree.star);
  const {distance,middle,ground}=panorama(tree.setting,tree.weather);
  return `<svg data-setting="${tree.setting}" data-weather="${tree.weather}" role="${animatedWeather?'group':'img'}" aria-label="Decorated winter tree" viewBox="-90 0 580 310">
    <g class="horizon">${distance}</g><g class="village">${middle}</g>
    <g class="ground-plane"><g class="near-ground">${ground}<path class="ink-shadow" fill="#c1d0c5" d="m139 280 27-5 33-2 25 2 29 1 12 2-32 1-16 3-36-1-27 1z"/><path fill="#a5bbaf" d="m178 279 12-3 18-1 17 3-22 2z"/></g>
      <g class="crown">${foliage(tree.species)}${star}${ornaments}</g></g>
    <g class="snow" pointer-events="none">${flakes}</g></svg>`;
}












