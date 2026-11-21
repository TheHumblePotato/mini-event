function reedBed(x,y,scale) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path fill="#998d68" d="M-14 1q-3-10-8-16 9 6 12 15-1-11-4-16 6 5 7 15l6-14-3 15zm24 0q1-10 10-21-6 12-6 21z"/>
    <g class="rush-heads" fill="none" stroke="#8e805d" stroke-width=".9"><path d="M-7 1q1-13-5-25M-1 0q1-15 5-28m4 28q-1-10 8-21"/>
      <path stroke="#7c624e" stroke-width="2.5" stroke-linecap="round" d="m-12-24 1.8 5m14-9-1.5 6m13.5 1-2.3 4"/></g>
    <path fill="#d5d5b9" d="m-17 1 9-3 12 1 11-2 4 2-21 3z"/></g>`;
}

export const marsh = {
  distance: `<path fill="#a2ada2" d="M-2100 155h1990q58-6 100-24 18-8 41-8 54 0 87 14 30 12 93 7l55-7q63-22 108-13t97 6l90-13 1840 9v116h-4501z"/>
  <path fill="#879b91" d="M-2100 156H-99q61 4 97-7 45-15 95-10t97 14q41 5 105-8t108-1l45 7 1952-2v54h-4500z"/>
  <path fill="#b6c4b6" d="M-2100 156q1700 6 2150-1t450 1l1900 1v78h-4500z"/>
  <path fill="#e3dfc7" d="M-70 162q108-7 191-2-76-1-108 2zm344-4q62-5 128-2l-37 2z"/>`,
  middle: `<path fill="#839a94" d="M-2100 172h2026q72-12 159-6t136 0q103-10 163-2l2016 10v98h-4500z"/>
    <path fill="#a69f7e" d="M-2100 174h2024q53-9 95-5l61 3 25-1-33 5-75 1-74 6h-2023zm2365 4q50-11 92-7l57-3 132 3-157 8-89 3z"/>
    <path fill="#e3e3cd" d="M-110 176q82-8 121-6l52 2-26 2-67-1zm399 1 61-6 52 1-36 2z"/>
    ${reedBed(38,173,.52)}${reedBed(65,172,.36)}${reedBed(320,176,.58)}${reedBed(344,177,.4)}
    <path fill="#a7b8ab" d="M-2100 207h2024q99-6 143-22l45-5-23 8-38 11q43-7 91-4l35 5q66 9 114-1l53-10 40-1-39 9 75-4 1980 6v59h-4500z"/>
    <g transform="translate(99 193)"><path fill="#6a8b8b" opacity=".53" d="M-12 3q8-2 19-.5l11 1.2-16 1z"/>
      <g fill="none" stroke="#685f4f" stroke-width=".85"><path d="m-1-8 1 6-1 4 3-.3m0-9 2 5-.5 3 3-1"/></g>
      <path fill="#758b91" d="M-13-9q7-4 12-4 6 0 7 4-3 4-10 3l-5-1-6 .6z"/>
      <path fill="#536b76" d="m-12-8 7-4 8 1-8 3 2-1z"/>
      <g class="heron-neck"><path fill="#b2beb6" d="M3-9q4-2 4-6 0-5 3-7l4 .5.5 2-3 1-1 5q-.4 7-7 6z"/>
      <path fill="#c79657" d="m13-21 10 2-10 .2z"/><path fill="#475b5c" d="m8-21 3-2 4 1-1 1-3-.4-5 2z"/><circle cx="12.7" cy="-21" r=".52" fill="#303c37"/></g></g>
    <g class="marsh-current" fill="none" stroke="#d5ded0" stroke-width=".85"><path d="m61 186 24-2m22 9 21-.7m112-10 19-1m49 8 21-2m20-3 16-1m-392 7 24 1"/></g>`,
  ground: `${reedBed(78,239,.88)}${reedBed(291,231,.71)}
    <path fill="#bdc9bc" d="M-63 262q64-9 92-11l22-6-15 7-54 7zm355-14q31-9 54-9l22 2-29 1z"/>
    <path fill="none" stroke="#91a497" stroke-width=".8" d="m115 231 2 1 2-3m-2 3-2 2m9 1 1 2 3-2m-3 2-1 3m11 2 2 2 4-2m-4 2-2 3"/>`
};

export const bindery = {
  distance: `<path fill="#a4a7a0" d="M-2100 143h2023l21-9h29v-17h8v17l25-11 32 8 13-12h22l29 15h28l25-23 29 19 26-8 35 15 20-6 24 4 22-16 33 2 30 16 33-12 23 2 18-18 32 6 20 15 1915 9v100h-4510z"/>
    <path fill="#c4c4b6" d="M-2100 149h2004q134-11 279-10l69-5 83 7 104-6 1961 12v54H-2100z"/>`,
  middle: `<path fill="#b8b3a0" d="M-2250 170h4700v99h-4700z"/>
    <g transform="translate(16 202)"><path fill="#8e6b58" d="M-32 0v-57l19-12h88l22 15V0z"/>
      <path fill="#af8570" d="M-11-57h86v57H-11z"/><path fill="#66574f" d="m-37-56 23-19 91 1 23 19-14 1-15-12h-78l-14 12z"/>
      <path fill="#e7e3ce" d="m-38-57 24-20h92l23 21-7-2-18-14-84-1-17 12z"/>
      <path fill="#826354" d="M8-73v-13l7 1v12z"/><path fill="#eee5cd" d="m7-87 10 1-.4 2-10-.6z"/>
      <g fill="#526964" stroke="#d0b796" stroke-width="1.2"><path d="M-4-50h12v13H-4zm23 1h12v12H19zm24 0h12v12H43z"/></g>
      <path stroke="#ccb495" d="M2-49v12m23-11v11m24-11v11m-53-8H8m11 0h12m12 0h12"/>
      <path fill="#345955" d="M-15-30h97v30h-97z"/><path fill="#ddb887" d="M-10-21h44v16H-10zm66 0h18v16H56z"/>
      <g fill="#8c735b"><path d="M-8-14h4v8h-4zm5 1h2v7h-2zm3-2 4-.5 1 9H1zm6 3h2v6H6zm4-2h3v8h-3zm7-3 3 1-2 10h-3zm4 5h5v6h-5zm38-2h3v8h-3zm5-1 3 .5-1 9h-3z"/></g>
      <path stroke="#47706a" stroke-width="1.8" d="M12-21v16m-23-12h45m31-4v16"/><path fill="#294941" d="M38 0v-23h13V0z"/><path fill="#bdac85" d="M41-20h7v10h-7z"/><circle cx="48" cy="-7" r=".85" fill="#e4c18d"/>
      <path fill="#6d7362" d="m-17 0 102-1 11 2-124 3z"/><path fill="#d9d2b9" d="m-20 0 6-2 23 1-3 1zm57-2h16l1 2H35z"/>
      <path fill="none" stroke="#bda28b" stroke-width=".68" d="m-7-52 7 .2m18-3 10 .2m29 3h9m-9 2h5m-18 9h6m-26 6h6m37-1h9m10-8h6"/>
      <path fill="#ddd2ad" d="M-13-33h96v7h-96z"/><text x="34" y="-27.5" text-anchor="middle" fill="#574d3e" font-family="Georgia,serif" font-size="5.1" letter-spacing="1.3">BOOKBINDERY</text>
      <path fill="#786a57" d="M91-32h19v2H91z"/><g transform="translate(104 -31)"><g class="bindery-sign"><path stroke="#796d55" d="M-4 1v4m8-4v4"/><path fill="#325a50" stroke="#c5a478" d="M-7 4H7v10H-7z"/><path fill="#e4cea0" d="M-5 7q3-1 5 1 2-2 5-1v4q-3-1-5 1-3-2-5-1z"/></g></g></g>
    <g transform="translate(276 199)"><path fill="#9d8d77" d="M0-39l19-15 49 1 21 15V0H0z"/><path fill="#6a7269" d="m-4-40 22-18 53 1 21 19-20-1-11-11-38-1-17 13z"/>
      <path fill="#e8e6d5" d="m-4-41 21-18 54 1 22 20-8-3-17-13-47-.6-18 13z"/>
      <path fill="#626856" d="M3-29h12v14H3zm22 10h36V0H25z"/><path fill="#aca281" d="M29-17h28v4H29z"/>
      <path fill="none" stroke="#827558" d="M-9-26q21 4 51-2"/><g fill="#e7dcc0"><path d="m-6-25 7 1-.7 8-7-1zM5-24h8l-1 9-7-.5zm13 0 7-.5.3 7-7 .7z"/></g>
      <path stroke="#a89877" d="m-5-21 3 .5m9 1h4m9-2h3"/>
      <path fill="#81705c" d="M64-17h9v2h-2v10h-3v-10h-4z"/><path fill="#b39771" d="M63-7h13v2H63z"/><path fill="#c5b591" d="M63-8h12v1H63z"/>
      <path fill="none" stroke="#797365" stroke-width=".7" d="m18-47 15-.7m-11-2 11-.7m28 13 9 1m-2 5 6 1"/></g>
    <g transform="translate(130 200)"><path fill="#5d6459" d="m-2 0 .9-19L-1-28h2l.2 10L2 0zM-4 0h8v1h-8z"/>
      <path fill="#e5cca0" stroke="#696c5b" stroke-width=".8" d="m-3.2-33 6.4-.2-1 5.5-4 .2z"/><path fill="#5d6459" d="m-4-33 3.3-2.6.7-1.4.8 1.4L4-33z"/><path stroke="#a59173" stroke-width=".6" d="M0-32v4"/>
      <path fill="#dedfc9" d="m-5 1 3-1h6l3 1.5-10 .4z"/></g>`,
  ground: `<path fill="#ada99a" d="m66 218 19-6 16-.8-10 5zm43-9 12-3 10 .3-6 3zm175 18 30-9 9 .5-18 8z"/>
    <g fill="none" stroke="#d9d9c7" stroke-width=".75"><path d="m69 216 23-1m-9-1 2 3m28-9h14m158 17 23-4m-10 0 3 2"/></g>
    <path fill="none" stroke="#b8bdaf" stroke-width="1.3" d="M-72 270q63-20 125-31t86-27M-55 273q62-21 118-30t88-29"/>`
};
