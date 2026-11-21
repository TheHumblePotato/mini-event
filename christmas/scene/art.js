import {heirlooms} from './heirlooms.js';
import {winterKeepsakes} from './winter-keepsakes.js';
import {winterHangers} from './winter-trees.js';
import {treeTopper} from './landmarks.js';
import {keepsakes} from './keepsakes.js';
import {panorama,foliage} from './woodcut.js';
// Cut-paper scene with one painted ornament for each visitor submission.
const loop='<ellipse cy="-8" rx="1.6" ry="2" fill="none" stroke="#d4b783" stroke-width=".8"/>';
const shapes={...keepsakes,...heirlooms,...winterKeepsakes,
  Skate:`<path fill="none" stroke="#71828a" stroke-linecap="round" stroke-width="1.15" d="M-5 4.7v3.5m8-3 .2 2.9M-8 8.2q5 1.6 14 .2Q9 8 9.8 5.7"/>
    <path d="m-7-7 6.4-.4 1.4 5q.4 2 4.1 3 4 1 3.8 3.3-.4 1.8-4.1 2H-7.6z"/><path fill="#67503f" d="M-7.8 3.7q6.3 1.2 16-.4L8 5.2Q.5 7-7.8 5.6z"/>
    <path fill="#e4d7b6" d="m-7-8 6.2-.3.3 1.8-6.6.3z"/><path fill="none" stroke="#f6e3b8" stroke-width=".68" d="m-3.4-5.7 2.9.4-2.7 1.1 3.2.5-2.8 1.3 3.6.4M-6 .1q.2 2.5 1.9 3"/>`,
  Cardinal:'<path d="m-9 5 4-6q1-5 6-4l1-4 3 4q4 1 3 5L5 3Q1 8-5 5l-5 4z"/><path fill="#e9b564" d="m7-3 4 2-4 1z"/><circle cx="5" cy="-3" r="1" fill="#342c29"/><path fill="none" stroke="#fff4d7" d="M-5 2q4 2 7-2"/>',
  Pinecone:`<path d="m-1-6 .6-5 2 .4-.2 4" fill="#806448"/><path d="M-1-8q-6 0-7 6-1 4 1.5 7L0 10q4-1 6-5 3-4 1.3-8Q5-8-1-8z" fill="#74543c"/>
    <g stroke="#72533d" stroke-width=".55"><path d="M-5-6q2-2 4 0l-1 3-3-1zm4-.8q2-2 4 .3L1-3l-2-1zm4 1.1 2 .9L6-2 2-3zM-7-3l5-.9L-3 .5-6 0zm5-1 5 .7L1 .8-2 .3zm5 1 4 .4L6 1 3 .8zM-7 1l5-.7-1 3.6-3-1zm5 0 5 .2L1 5-2 3.6zm6 .5 3 .2-1.9 3.7-2.2-1.2zm-9 3 4 .3L-.5 8-4 7zm5.5.8 4-.8-1.1 2.6L1 9z"/></g>
    <path d="m-5-5.6 2.4-.6m1.9-.4 1.6-.4m-7.1 4.6 3.4-.8m2 .1 3.3.25m-7.7 4.3 2.8-.6m2.1.8 2.6.1" fill="none" stroke="#f3cd92" stroke-width=".63"/>`,
  Heart:'<path d="M0 8Q-12 0-7-6q4-4 7 1 5-6 8-1Q12 0 0 8z"/><path d="M-6-3q0-2 2-2" stroke="#fff2d4" fill="none"/>',
  Crescent:'<path d="M4-9A9 9 0 1 0 8 5Q-3 5 4-9z"/>',
  Lantern:`<path fill="none" stroke="#866c4e" d="M-3.3-6v-2.5q.4-4 3.3-4t3.3 4V-6"/><path d="m-7-4 1.5-1 3-2 1.2-2h2.8l.7 2 3.9 2.3 1 1.3z"/>
    <path fill="#fae3a4" stroke="#77664f" stroke-width=".65" d="m-5.2-3.5 10.4-.2-.9 10.3-8.1.1z"/><g class="lantern-wick"><path fill="#d9914a" d="M-.1 5q-3-1.5-1.2-4L.5-2Q.3.4 1.9 2.2 3 4.4-.1 5z"/><path fill="#fff8ce" d="M0 4.4q-1.2-1 .4-2.5.9 1.7-.4 2.5z"/></g>
    <path fill="none" stroke="#877253" stroke-width=".7" d="m-5-3 3 9m7-9-3 9"/><path d="m-5 5.4 9.9-.1L6 8.2l.5 1.2H-6.2l.2-1.4z"/><path stroke="#e8c68a" stroke-width=".6" d="m-4.4-5.3 7.6-.3m-7.7 13 8.5-.2"/>`,
  Mitten:'<path d="M-5-4q0-5 4-5 4 0 5 4l1 3q4-4 5-1 1 2-5 7L4 7h-8q-3-5-1-11z"/><path fill="#fff0ce" d="M-5 5H5v3H-5z"/><path stroke="#fff0ce" fill="none" d="m-4-1 2 2 2-2 2 2"/>',
  Bauble:'<circle cy="1" r="7"/><path fill="#e6c18b" d="M-3-8h6v3h-6z"/><path stroke="#fff6d9" fill="none" d="m-6 0 3 2 3-2 3 2 3-2"/><circle cx="-3" cy="-2" r="1" fill="white"/>',
  Bell:'<path d="M-8 5Q-5 2-5-2a5 5 0 0 1 10 0q0 4 3 7z"/><path stroke="#fbe5b4" d="M-6 4h12"/><g class="clapper"><path stroke="#83653f" d="M0 4v4"/><circle cy="8" r="1.8" fill="#b87e43"/></g>',
  Gift:`<path d="m-8-4 11-2 6 3v10L-2 10l-6-3z"/><path fill="#453a40" opacity=".25" d="M-2 0 9-3V7L-2 10z"/><path fill="#fff6d4" opacity=".34" d="m-8-4 11-2 6 3L-2 .5z"/>
    <path fill="#e5c88b" d="m-4.9-4.6 1.8-.3L3.2-2v10.5l-1.8.5V-.9zm9-1.1 1.6.7L-5-2v10l-1.5-.6V-2.9z"/>
    <path fill="none" stroke="#c9a469" stroke-width="1.1" d="M.5-4Q-9-6-6-9.2q3-1.4 6.5 5.2 1.9-7.6 5-5.8Q9-7.4.5-4z"/>
    <path fill="none" stroke="#f6dfab" stroke-width=".5" d="M-5.6-8.7q3 .5 5.9 4.8m.5-.5 3.6-4.2M-7 1.3l1 .6m3 1.6.6.3m7.4-5.4 2.7-.7"/>
    <g class="gift-tag"><path fill="#f8e5be" stroke="#aa8a5e" stroke-width=".4" d="m1.4-4-2 2.7L.8 1l2.8-3.6z"/><circle cx="1.4" cy="-2.7" r=".35" fill="#916c48"/></g>`,
  Ribbon:`<path class="ribbon-tails" d="M-1-1q-1 6-7 10l3.9-.7.5 2.5q4-3.5 5-10Q4 7.4 8 9.6l-.6-3.1 3 .2Q4.8 2.7 2-2z"/>
    <path d="M-.7-2Q-7-10.6-10-7.4q-2.5 3.5.7 9Q-8 4.8-.7-.6 6.7 4.1 9 2q2.6-3.5 1.1-9.3Q8-10.2.5-3z"/>
    <path fill="#54373b" opacity=".48" d="M-9-6.5q4.1-.4 7.9 4.9-7.1-3.7-8.4-1.3-.8-2.4.5-3.6zm10.4 5q5.2-6.7 7.9-5.5 1.1 1.2-.2 2.8-3.6-.5-7.7 2.7z"/>
    <path fill="#fff0c5" opacity=".68" d="M-9.2.2q2.8 1.8 6.9-1.2-3.7 4.4-6.9 2.7zm12.4-.8Q7.4 2 9 .4q-.6 3.7-5.8-1z"/><path fill="#c7a064" d="M-1.8-3.5q2.2-1.4 3.7.2l-.2 3.2Q0 1.4-2-.1z"/>`,
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
    const sender=String(card.name??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
    const label=card.kind+' ornament'+(sender?' from '+sender:'');
    return '<g class="hanging" role="button" tabindex="0" aria-label="Open '+label+'" data-card="'+i+'" style="--motion-delay:-'+(i*1.73)+'s" transform="translate('+x+' '+y+')" color="'+palette[card.color]+'" fill="currentColor"><title>'+label+'</title><circle r="12" fill="transparent"/><circle class="thread-focus" r="12" fill="none" stroke="#fff5cb" stroke-dasharray="2 2"/><g class="charm"><path d="M0-12v7" stroke="#fff0c2"/>'+loop+shapes[card.kind]+'</g></g>';
  }).join('');
  const star=treeTopper(tree.star);
  const {distance,middle,ground}=panorama(tree.setting,tree.weather);
  return `<svg data-setting="${tree.setting}" data-weather="${tree.weather}" role="${animatedWeather?'group':'img'}" aria-label="Decorated winter tree" viewBox="-90 0 580 310">
    <g class="horizon">${distance}</g><g class="village">${middle}</g>
    <g class="ground-plane"><g class="near-ground">${ground}<path class="ink-shadow" fill="#c1d0c5" d="m139 280 27-5 33-2 25 2 29 1 12 2-32 1-16 3-36-1-27 1z"/><path fill="#a5bbaf" d="m178 279 12-3 18-1 17 3-22 2z"/></g>
      <g class="crown"><g class="boughs">${foliage(tree.species)}</g>${star}${ornaments}</g></g>
    <g class="snow" pointer-events="none">${flakes}</g></svg>`;
}












