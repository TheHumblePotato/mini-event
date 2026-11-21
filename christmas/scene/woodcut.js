import {landscapeDetails} from './field-details.js';
import {skyMarks,printingPlate,firPrint,frostStalks} from './print.js';
import {inkTrees} from './ink-trees.js';
import {villageScenes,gondolaLine} from './villages.js';
import {landscapes,lightPillars} from './winter-landscapes.js';
import {winterTrees} from './winter-trees.js';
import {specimen} from './specimens.js';
import {harbor,mill,mistBank} from './landmarks.js';
import {distantForest,woodland,rightBoughs,aurora} from './forest.js';
// Small cut-paper buildings and hillside pines, mirrored across the courtyard.
function cottage(x,y,scale) {
  if(x===73)return `<g transform="translate(${x} ${y}) scale(${scale})"><path fill="#9b684c" d="M0 9 22-26 44 9v24H0z"/><path fill="#fbefdb" d="M-4 10 22-31 48 10h-5L22-21 1 10z"/><path class="window-light" fill="#ffd48e" d="M15 5 22-8l7 13z"/><path fill="#573f38" d="M17 16h10v17H17z"/></g>`;
  const wide=x===12 || x===376;
  const walls=wide?'#9a7158':'#86675d';
  const annex=wide?'<path fill="#856d5f" d="M42 9h22v23H42z"/><path fill="#fff2dc" d="m39 10 12-13 17 13z"/><path class="window-light" fill="#ffd993" d="M51 15h7v8h-7z"/>':'';
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    ${annex}<path fill="${walls}" d="M0 0h47v32H0z"/><path fill="#603e36" d="M32-16h6v19h-6z"/>
    <path fill="#754f41" d="M-2 3 12-18h26L50 3v4H-2z"/>
    <path fill="#af7660" d="M-3 2 12-17 26 2z"/>
    <path fill="#59453f" d="M12-17h26L52 2H26z"/>
    <path fill="#faf1dd" d="M11-19h28L53 0l-7 1-7-2-5 1-7-1z"/>
    <path stroke="#f6ebdc" stroke-width="2" fill="none" d="m-3 2 15-20L27 2"/>
    <path fill="#4b4542" d="M9-5h5v5H9z"/>
    <path class="window-light" fill="#ffc883" d="M6 11h9v11H6zm26 0h9v11h-9z"/><path stroke="#875b43" d="M10 11v11m26-11v11M6 16h9m17 0h9"/>
    <path fill="#ebe4ce" d="M5 22h12v2H5zm26 0h13v2H31z"/><path fill="#523f38" d="M20 15h8v17h-8z"/></g>`;
}
export function panorama(setting,weather){
  const landscape=landscapes[setting];
  const detail=landscapeDetails[setting]??{};
  const plate=printingPlate();
  const pines=landscape?'':distantForest();
  const houses=setting!=='Courtyard'?'':cottage(-49,192,.87)+cottage(12,183,1.15)+cottage(73,201,.62)+cottage(322,192,.85)+cottage(376,178,1.2);
  const landmarks={
    'Harbor lights':setting==='Harbor lights'?harbor():'',
    'Solstice mill':setting==='Solstice mill'?mill():'',
    Woodland:setting==='Woodland'?woodland():'',
    'Alpine dusk':`<path fill="#847a87" d="M-240 209-58 98l33-12 19-14 15-4 20-16 11 2 10-3 13 13 7 15 19 18 12 19 27 16 17-10 12-7 10-13 16-10 15-17 18-11 11-14 12-5 6-11 9-4 10 3 7 17 16 12 8 15 14 11 12 21 13 7 15 24 15 11 24-16 18-7 33-31 17-7 17-15 13 3 35 34 112 88v58H-240z"/>
      <path fill="#a09298" d="m-49 94 24-8 19-14 15-4 20-16 10 4-23 24-13 4-18 17-16 7 7-11zm202 35 14-27 16-10 15-17 18-11 11-14 12-5 6-11 9-4-8 25-13 26-9 3-17 23-18 7-10 13z"/>
      <path fill="#edcfb7" d="m-18 81 12-9 15-4 20-16 11 2 10-3 13 13 7 15-14-14-4 1-4-9-12 7-5-2-13 13-9 1-7 6 1-6zm204 13 12-19 18-11 11-14 12-5 6-11 9-4 10 3 7 17 16 12 4 8-13-9-2 2-8-11-3 2-6-15-7 7-2-2-11 19-7 2-6 9 2-10-13 13-7 2z"/>
      <g fill="none" stroke="#b3a1a3" stroke-width="1.5"><path d="m-16 108 21-13 9-12m-3 9 13-10 6-10m18-6 8 10 9 4m148 12 8-12 8-6m8-6 8-12m22-3 4 9 10 8m-13-3 12 15 7 4m9 4 9 11"/></g>`+gondolaLine(),
    'Frozen lake':'<path fill="#a1c8d0" d="M-600 187q400-21 735 1t710-5v61H-600z"/><path fill="none" stroke="#e2f1e8" d="m-94 203 120-4m-49 10 75-2m207-12 142 1m-43 9 87-2"/><g fill="#6e9da6" opacity=".4"><path d="m5 189 47 13 30-12zm227 1 38 15 27-15zm100-3 43 13 36-14z"/></g>     <g fill="none" stroke="#e5f2ec" stroke-width=".7"><path d="m53 215 32-8 19 2 30-6m-50 4 7-7m206 15 18-6 28 1 22-7"/></g>     <path fill="#698b8a" d="M-130 186q116-10 229-1t203-1q-170 10-302 2z"/><path fill="#775e49" d="m29 197 51-1v3l-51 2zm4 3h2v9h-2zm40-1h2v7h-2z"/>',     'Northern lights':setting==='Northern lights'?aurora():''  };
  const sky=`${plate.defs}<rect class="sky" x="-2000" y="-2000" width="4400" height="2500"/><rect x="-2100" y="-250" width="4500" height="500" fill="${plate.horizon}"/><rect x="-2100" y="-250" width="4500" height="500" fill="${plate.tooth}" opacity=".62"/>${skyMarks}<rect fill="#e7eadd" x="-2000" y="240" width="4400" height="2000"/><g transform="translate(333 46)">${weather==="Ice halo"?'<g fill="none"><circle r="39" stroke="#df9e88" stroke-opacity=".24" stroke-width="2.4"/><circle r="41" stroke="#ffeac1" stroke-opacity=".37" stroke-width="2.5"/><circle r="43" stroke="#b5dce1" stroke-opacity=".3" stroke-width="2.5"/></g>':""}<g class="sun"><path fill="#f4d399" d="M-16 1q-1-9 6-15 8-6 17-2 9 4 10 14 1 9-8 15-8 5-17 0-7-4-8-12z"/><path fill="#fae1ae" d="M-14-2q1-11 13-13 8-1 14 7-6-5-12-4-10 1-15 10z"/></g><g class="night-disc"><circle class="moon" r="16"/><g fill="#c9af7d" opacity=".38"><ellipse cx="-5" cy="-6" rx="3" ry="2"/><circle cx="6" cy="4" r="3.2"/><circle cx="2" cy="9" r="1.5"/><circle cx="-9" cy="3" r="1.2"/></g></g></g>${setting==="Northern lights"?landmarks[setting]:""}
    `;
  const ridge = landscape?.distance ?? detail.distance ?? `<path fill="#98adae" d="M-2100 165 -120 152 -78 128 -53 117 -39 119 -22 128 -7 123 13 113 32 96 43 93 52 82 61 80 68 73 77 76 90 92 98 95 115 117 130 123 142 129 159 121 178 111 187 102 199 99 215 85 232 88 241 84 248 96 258 99 274 116 289 124 306 120 322 110 337 107 346 96 355 92 361 94 376 111 389 116 409 135 423 132 459 116 484 95 500 90 519 105 2400 180V250H-2100z"/>
    <path fill="#819ba1" d="m68 73 9 3 13 16 8 3 17 22 15 6 12 6-26-7-15-10-13-15-3 2-6-14-5 .4zm147 12 17 3 9-4 7 12 10 3 16 17 15 8-20-6-12-12-4 2-10-12-7 4-6-6-3 4-3-8zm140 7 6 2 15 17 13 5 17 17-21-14-6-1-15-14-1 2z"/>
    <path fill="#dbe0d4" d="m17 111 15-15 11-3 9-11 9-2 7-7 9 3 9 12-9-5-3 2-5-5-6 7-4-1-7 10 1-6-8 7-7 1-4 5zm160 1 10-10 12-3 16-14 16 3 10-4 5 10-7-5-7 6-4-2-10 12 4-10-6-2-4 5-2-1-9 8 2-6-11 6zm146-3 14-2 9-11 9-4 6 2 7 9-7-4-3 1-4-3-5 7-3-1-5 6z"/>
    <path fill="none" stroke="#b9c9c1" stroke-width="1.1" d="m28 111 9-6 7-2m0 8 11-8 4-5m16-8 3 5 5 2m-32 20 12-10 4-1m135 5 10-8 4-1m-9 13 10-7 3-6m28-3 4 5 6 3m76 7 8-5 5-6"/>
    <g class="ridge-birds" fill="none" stroke="#43595c" stroke-width=".9"><path d="m64 94q3-2 5 1 2-3 5-2m3 5q2-2 4 0 1-2 4-1m-20 4q2-1 4 1 1-2 4-2"/></g>
    <path fill="#759591" d="M-2100 180 -110 178q98-84 189-26t194-9q107-57 237 6L2400 185v105H-2100z"/>
    `;
  const village = landscape?.middle ?? `<g fill="#426e69">${pines}</g><path fill="#c3d5cc" d="M-2100 188 -110 185q130-27 265 5t356-13L2400 185v150H-2100z"/>${houses}${setting==="Northern lights"?"":landmarks[setting]||villageScenes[setting]?.()||""}`;
  const bank="M-2100 239 -110 231q121-45 253-10t367-13L2400 219v2010H-2100z";
  const ground=`<path class="powder" fill="#e7eadd" d="${bank}"/><path fill="${plate.tooth}" d="${bank}"/>
    <g fill="#bbc9bb"><path d="m49 234 8-3 11 3-5 2zm281 7 6-4 12 3-7 3z"/></g>
    <path fill="#f7f7e9" d="m48 234 8-5 9 2 4 3-9-1-4 1zm281 7 6-5 9 1 5 3-9-1z"/>
    <g stroke="#9c9880" fill="none" stroke-width=".8"><path d="m79 236-2-7-3-3m7 10 2-5 3-2m237 15-3-7m3 4 3-5"/></g>
    <path fill="#cadbd3" d="M-110 260q92-24 184-18-122 4-184 31zm452 1q86-30 168-24v5q-90-2-168 19z"/>
    ${landscape?.ground ?? ''}${detail.ground??''}${weather==='Hoarfrost'?frostStalks():''}`;
  return {distance:sky+(weather==='Light pillars'?lightPillars():'')+ridge,middle:village+(detail.middle??'')+(weather==='Lake mist'?mistBank():''),ground};
}
export function foliage(species){
  if(species==='Fir')return firPrint;
  if(inkTrees[species])return inkTrees[species]();
  if(winterTrees[species])return winterTrees[species]();
  const special=specimen(species);if(special)return special;
  const spruce=species==='Spruce';
  const pine=species==='Scots pine', cedar=species==='Blue cedar', slim=species==='Cypress';
  const count=pine?4:slim?9:cedar?7:6;
  return '<g transform="translate(200 0) scale('+(slim?.62:spruce?.82:1)+' 1)"><path fill="#72513c" d="M-7 230H7l3 48H-10z"/>'+Array.from({length:count},(_,i)=>{
    const fraction=i/(count-1), w=(pine?88:99)*(1-fraction)+24*fraction,b=(pine?235:257)*(1-fraction)+97*fraction;
    return `<g transform="translate(${Math.sin(i*1.9)*2.4} ${b}) rotate(${Math.sin(i*2.1)*2.2}) scale(${w/100} ${i===count-1?.68:pine?.8:1})">
      <path fill="${cedar?'#416e72':pine?'#486a4a':spruce?'#235859':'#194f45'}" d="M0-72Q-41-23-102-6l18 4-7 4 28-2-6 5 36-1-3 4q23 1 41-5l-2 4 35-5-4 4q40-2 67-13Q42-28 0-72z"/>
      <path fill="${cedar?'#69999a':pine?'#688862':spruce?'#408082':'#33806a'}" d="M0-72Q-43-23-102-6q27 1 50-12l-7 7q28-9 45-23l-7 12 26-21z"/>
      ${rightBoughs(i,species)}<path fill="none" stroke="#bed1bb" opacity=".48" stroke-width=".8" d="m-43-13 7-5m-3 6 7-5m12-9 6-5m32 19-5-4m10 5-4-3"/><path fill="none" stroke="#b4cbb6" stroke-opacity=".30" stroke-width="1.2" d="m-58-16 16-7m-11 9 8-4m-31 9 9-3"/><path fill="#9ebfb0" opacity=".75" d="m-79-12 31-16-15 12 19-7-10 7z"/></g>`;
  }).join('')+'</g>';
}















