// Static plate marks travel with their material. Separate IDs allow several
// independent prints on one page (including gallery thumbnails).
let edition=0;
export function printingPlate(){
  const id='impression-'+ ++edition;
  return {
    tooth:`url(#${id}-tooth)`,
    horizon:`url(#${id}-horizon)`,
    defs:`<defs>
      <pattern id="${id}-tooth" patternUnits="userSpaceOnUse" width="53" height="43">
        <path fill="none" stroke="#586450" stroke-width=".33" opacity=".48" stroke-linecap="round" d="m2 5 .9-.2m8 4 1.3 .2m17-5 1.1-.1m11 12 .6-.3m-21 1 1.2-.4m14 13 1.1 .1m-28 9 .9-.3m8-10 1 .1m31 8 .6 .2"/>
        <path fill="none" stroke="#fff3d7" stroke-width=".52" opacity=".6" d="m5 18 1.6-.4m21 6 1.1-.1m15-17 1.1-.3m-25 32 1 .2"/>
      </pattern>
      <linearGradient id="${id}-horizon" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="20" y2="173">
        <stop stop-color="#f4e4c3" stop-opacity="0"/><stop offset=".62" stop-color="#f1d7ba" stop-opacity=".18"/><stop offset="1" stop-color="#ede1c6" stop-opacity=".55"/>
      </linearGradient></defs>`
  };
}

// Rime clings to last summer's seed stalks. The crystals stay planted when the view pans.
export function frostStalks(){
  const stems=[[129,255,.8,-14],[135,255,.57,18],[281,246,.67,13],[285,247,.42,38],[-22,249,.75,-27],[374,261,.9,8]];
  return stems.map(([x,y,size,angle])=>`<g transform="translate(${x} ${y}) scale(${size})">
    <path fill="#a7bbb3" d="m-6 1 8-2 13 1-11 2z"/><g transform="rotate(${angle})" fill="none" stroke-linecap="round">
      <path stroke="#7f8b78" stroke-width="1.6" d="M0 0q.8-12-4.5-23m4 16-7-8m6 4 6-9"/>
      <path stroke="#f8f8e9" stroke-width="1.2" d="M-.6-6q.2-8-4.8-18m3.1 11-5.8-10m4.8 6-5.4-3.5m5.4 4.5 1.8-11m-.5 14.5 4.9-9m-.6 6 3.5-5.7M-4-11l-5.8-5m7 2.4-1.6-6"/>
      <path stroke="#e5eee2" stroke-width=".72" d="m-4-20-3-2.5m2.5 1 .1-3.6m1.8 5.1 2.6-4.8m.6 9.6 3.4-2.5m.1-1.7 2.4-1.9m-12 3-3-1.2"/></g></g>`).join('');
}

export const skyMarks=`<g class="night-disc" fill="#f6e8c7" opacity=".72">
  <path d="m42 31 .6-1 .6 1-.6 .8zm86-14 .6-.8.5.9-.6.7zm141 29 .7-1.2.65 1.1-.6 1zm105-19 .5-.9.6.8-.5.8z"/>
  <path stroke="#f0e7cf" stroke-linecap="round" stroke-width="1.05" d="m-41 54 .4 0m37-37 .2 .1m63 30 .3 0m37 8 .4 0m17-29 .2 0m43-18 .15 0m56 20 .3 .1m29 25 .15 0m41-40 .35 .1m14 21 .2 .1m71 39 .2 0m53-55 .2 0m38 17 .3 0"/></g>
  <g class="cirrus" fill="#ece4cf" opacity=".4"><path d="M-84 56q39-5 68-7l45 1-27 2-15-.4-27 3zm150-15q24-3 54-2l17 1-36 1zm209 27q24-6 52-5l22 .5 15-1-12 3-32-.4z"/>
  <path opacity=".7" d="m-1 57 34-3 15 .3-18 1.6zm109-21 16-2 14 .6-9 1zm208 35 19-2 20 .5-25 1.8z"/></g>`;

export const firPrint=`<g transform="translate(200 0)">
  <path fill="#715e49" d="m-9 278 3-22 3-106 3-98 3 82 1 118 6 26z"/>
  <path fill="#ab8b64" d="m-6 275 3-34 2 6-1 24zm7-20 2 16 2 3-2-22z"/>
  <path fill="#335849" d="M0 49Q3 64 11 75l-5-2 10 14-8-2 13 13-10-3Q18 106 30 112l-9-1 11 8-15-3Q29 133 46 139l-11-1 10 7-18-2Q43 160 61 167l-12-1 14 8-22-3Q58 190 77 196l-11 1 14 7-25-3Q72 221 92 228l-11 1 12 7-20-2Q85 246 102 252l-17-1 6 5-21-2 7 6-28-4-5 3-22-4-10 3-16-4-11 4-18-1-15 4 4-6-27 4 5-6-26 4 10-8-18 2Q-76 237-59 220l-20 6 7-8-19 2Q-66 209-47 188l-21 6 7-7-15 2Q-51 176-36 158l-16 5 5-7-13 2Q-36 146-24 130l-14 4 4-6-10 1Q-23 118-15 104l-12 3 6-7-8 2Q-14 90-9 80l-8 4 9-13-5 2Q-5 62 0 49z"/>
  <path fill="#50745b" d="M-1 63q-3 14-16 27l12-5-5 7 13-10zm-4 35q-8 14-26 25l21-7-7 8 18-9 7-12zm-2 31q-13 18-38 31l20-5-7 7q23-6 39-24l-16 8zm-6 37q-13 18-47 34l26-7-9 8q26-9 43-26l-20 11zm-1 43q-20 24-57 39l26-4-7 7q32-10 53-28l-18 7z"/>
  <g fill="none" stroke="#89a087" stroke-linecap="round" stroke-width="1.2">
    <path d="m-1 79-7 5m4 16-10 8m12-1-7 6m-7 16-10 8m19-2-12 9m5 15-17 10m9-1-7 5m-3 16-14 8m9-1-6 4m6 16-19 10m9-1-9 6"/>
    <path stroke="#66866c" d="m10 116 10 6m-4 9 9 5m-7 11 16 10m-7 0 8 5m-10 12 19 10m-9 0 11 6m-9 18 17 8m-7 1 9 4m-21 6 13 8m-2-5 15 8"/>
  </g><path fill="#b8c3ab" d="m-28 138 15-10-6 6-6 3zm-14 43 20-12-10 9-7 2zm-17 53 22-11-11 8-8 3zm86-77 12 6-5-.7zm15 49 14 6-5 .5z"/>
  <g fill="#456953"><path d="M0 102q6 12 19 19l-7-2 3 3-9-4-5-5zM-2 144q-7 11-26 19l8-1-4 4 13-5 12-12zM4 168q11 13 31 20l-8-.6 7 4-15-4-9-6zM-4 200q-9 13-34 23l12-2-8 6 21-8 14-16zM8 222q13 14 46 24l-13-1 8 3-19-3-16-6z"/></g>
  <g fill="none" stroke="#8da18a" stroke-linecap="round" stroke-width=".85" opacity=".8">
    <path d="m3 137 4 4m0-2 4 4m1-2 4 3m12 15 3 3 4 1m-59 30 6-3m-3 4 8-5m-8 30 5-1 4-3m-2 4 5-3m32-8 4 3m0-2 7 4m8 2 4 2m-56 26 9-3m-4 4 8-4m47 1 9 3m-1-2 6 2"/>
  </g>
</g>`;
