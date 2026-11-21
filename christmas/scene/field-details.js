// Small incidents sit on the same plane as the buildings, water or snow that supports them.
export const landscapeDetails = {
  Courtyard: {
    distance: `<path fill="#9cafa9" d="M-2100 154h2024q69-40 119-32t93 12l77-19q72-18 135 7l53 13 121-25 1878 37v98h-4500z"/>
      <path fill="#7c9290" d="M-2100 169h2025l22-7h45v-17l13-6 14 6v14h43v-6h7v7h33l23-8 32 6 14 4h78l33-16 54 3 30 13 23-2 22-13 21 15h42l38-7 1968 14v49h-4500z"/>
      <path fill="#c4cec0" d="m-11 145 15-8 16 8-14-4zm242 3 33-15 56 3 22 12-29-8-48-3z"/>
      <path stroke="#a3b3a8" stroke-width="1.3" d="m1 150 2 0m3 0h2m-7 4h2m260-10h12m6 0h11m25 3h8"/>`,
    middle: `<g transform="translate(89 208)">
      <path fill="#786d60" d="M-5 1h48v-3H-5zm6-4h39v-3H1z"/><path stroke="#e8dfc9" d="M-4-2h47M2-5h36"/>
      <path fill="none" stroke="#59645c" stroke-width="1.2" d="M3-6v-8q0-2 2-2h23m-10 0v10"/>
      <g transform="translate(27 -5) rotate(17)"><path fill="none" stroke="#705240" d="M-4 3v-16q0-2 2-2m7 18v-16q0-2 2-2"/>
      <path fill="#aa6346" d="M-3-13h2V0h-2zm3-1h2V0H0zm3 1h2V0H3z"/><path stroke="#b79766" d="M-4-9h10M-4-2h10"/></g></g>`
  },
  Woodland: {
    ground: `<g transform="translate(86 227) rotate(-5)"><path fill="#725947" d="M-26 0q-3-3 0-6l48-2 6 4-2 4z"/>
      <path fill="#e9e7d6" d="m-26-6 12-3 8 1 20-3 8 3-16 2-23 2z"/><path fill="none" stroke="#a88c68" d="m-20-3 12-1m4 1 12-2m5 1 7-1"/>
      <path fill="#b57c52" d="M-5-1q3-5 8-3 1 3-8 3zm8-2q4-5 9-2-2 3-9 2z"/></g>
      <path fill="#99aaa1" opacity=".8" d="m110 229 2-1 2 .5-2 1zm5 1 2-1 2 .5-2 1zm8 5 4-2 1 1-4 2zm4 2 4-2 1 1-4 2zm11 8 5-2 1 1-4 2zm4 2 5-2 1 1-4 2z"/>`
  },
  'Frozen lake': {
    distance: `<path fill="#99b1b8" d="M-2100 116h2009l45-30 24 3 35 20 20 4 35 21 17 2 34 14q49 15 89 8l38-8 26-15 24-6 35-22 24-3 29-16 22 4 39 28 1955 12v93h-4500z"/>
      <path fill="#d2dcd8" d="m-71 102 25-16 24 3 25 15-22-7-13-6-8 6-7-2zm389 6 24-3 29-16 20 4 18 13-21-9-16-3-19 11-7-1z"/>
      <path fill="#76979d" d="M-2100 139h2028l50-11 45 11 33 4 41 14 57 7 24 6-124-6-41-9-42-6-31-1-31 7h-2009zm2301 30 63-18 42-6 35-15 39-4 49-22 1971 35v38h-2270z"/>
      <path stroke="#c2d1ca" fill="none" d="m-18 133 29 9 19 3m267 8 31-8 19-2m11-10 27-6"/>`,
    middle: `<g transform="translate(50 196)"><path fill="#746857" d="M-5-1v-12l2-.5v13zm15 0v-15l2 1V0z"/>
      <path fill="none" stroke="#d9be8a" stroke-width=".9" d="M-3-11Q3-7 11-14M-3-9Q3-5 11-12"/><path fill="#e2ebdf" d="m-6-13 2-2 3 1-1 1zm15-1 2-2 3 1-1 1z"/></g>
      <path fill="none" stroke="#7199a2" opacity=".65" stroke-width=".66" d="m76 198 18-1 10 1 12-4 8 1m-20 3 8 4 6 1m-33 7 31-3 8 2 22-2"/>
      <path fill="none" stroke="#e1ece6" stroke-width=".7" d="m84 209 31-3 7 1m164-11 16-2 18 .5m-9-4 8 1 19-2"/>`
  },
  'Alpine dusk': {
    middle: `<g transform="translate(99 145)" fill="none" stroke="#596774"><path stroke-width="1.6" d="m-5 46 5-47 6 46M-7-1h17"/>
      <path stroke-width=".65" d="m-3 34 7-10-6-6 4-9m-3-8 1-4 4 1"/></g>
      <path fill="none" stroke="#d9bfa7" stroke-width="1" d="m20 113 12-13 8-11m-3 17 6-8 7-3m215-29 7 9 2 7m-5-10 6 3 6 10"/>`
  },
  'Northern lights': {
    distance: `<path fill="#91a7ac" d="M-2100 162h2008l55-13 23 1 35-12 29 4 15-3 37 10 27 1 30 9q81 11 142-9l24-13 25 1 25-9 23 4 39 18 33 6 1930 5v73h-4500z"/>
      <path fill="#d3ddcf" d="m-5 146 26-8 29 4 15-3 23 7-25-3-12 3-31-3zm295 4 35-13 25 1 25-9 23 4 19 9-24-5-18-3-17 8-25-1z"/>
      <path fill="#728d91" d="M-2100 173h2000q82-19 162-6t119 6l64-4q64-9 128-6t127 1l1900 6v62h-4500z"/>`,
    middle: `<path fill="#718f95" d="m83 200 14-6 8-9 3-1 5 12 12 5z"/><path fill="#d8e6db" d="m100 191 5-7 3-1 3 7-4-2-2 3z"/>
      <g transform="translate(294 202)"><path fill="#596c70" d="m-8 0 1-3 13-.7 3 3zm2-5 3-3 9 .2 .5 3zm3-5 1-3 5-.5 1 4z"/>
      <path fill="none" stroke="#e0e9d9" stroke-width=".85" d="m-7-3 12-.5m-10-4 10-.2m-5-4.5 4-.5"/></g>`
  },
  'Harbor lights': {
    distance: `<path fill="#a3b3b1" d="M-2100 154h2011l39-11 36-1 25-8 22 2 36 12 22 2 20 8 103 1 55-8 19-1 35-10 26 2 37 11 52-5 28-9 14 1 18 10 1961 7v64h-4500z"/>
      <path fill="#738d8b" d="M-2100 165h1999l33-9 46-3 21-8 22 3 15 8 27 1 7 4 26 4-38 3-2158 2zm2370-2 23-9 27-2 17-5 28 4 16 8 22 2 4 4-47 .6-27 2z"/>
      <path fill="#d1d9cc" d="m-26 154 25-9 22 3 9 5-18-4-13-1-11 4zm302 8 17-8 27-2 16-5 16 3-17 .4-11 4-24 2z"/>
      <path fill="none" stroke="#a1b3aa" stroke-width=".9" d="m-9 153-5 7m11-9-4 8m16-8-4 5m293 2-5 4m30-8-5 5m18-6-1 3"/>`,
    middle: `<g transform="translate(278 193)"><path fill="#675c50" d="M-19-1h39l-1 3h-38zm3 3h2v8h-2zm28-1h2v8h-2z"/>
      <g fill="none" stroke="#7c6950" stroke-width=".85"><path d="M-12-2q0-11 12-10 6 1 5 10zm3 0q1-9 9-10m-4 10q0-7 5-9M-12-5H4m-13-3H4"/>
      <path d="M8-2q0-6 5-6t5 6zm3 0q0-5 3-6"/></g>
      <path fill="none" stroke="#d1bb8a" d="M-16 0q-4-4-6-2t1 5q3 3 3 7"/><path stroke="#b2cbc4" d="M-19 11h8m21 0h8"/></g>`
  },
  'Solstice mill': {
    distance: `<path fill="#b6b6a0" d="M-2100 152h2010q84-22 144-17t132 20q40 4 91-12 69-22 126-11l59 16 1938 1v72h-4500z"/>
      <path fill="#9ba592" d="M-2100 166h2027q96-27 169-12l106 18q49 2 102-10 66-15 146-9l1950 10v66h-4500z"/>
      <path fill="none" stroke="#d1d2b8" stroke-width="1.6" d="M-80 158q67-17 109-15t85 10m-163 9q66-15 96-13m-59 14q43-9 72-5m180 0q38-8 56-15m-37 19q43-7 63-20m-9 13 34-13"/>
      <path fill="#7c8e7d" d="m-24 144 3-3 2 1 4-5 4 3 4-1 4 3 5-2 4 2-2 2zm350 0 2-9 2-3 1 12zm5-1 2-13 2 2 .2 10zm5-1 3-12 2 2v10z"/>`,
    middle: `<g transform="translate(94 198)"><path fill="#a88969" d="M-13-3q-2-7 2-12l-1-3 5 1 3 7 1 8zm11 1q-2-5 1-9l-1-3h4l3 5 1 7z"/>
      <path fill="none" stroke="#745f49" stroke-width=".8" d="m-11-14 4-1m8 3 4-1m-15 3-1 4m14-3 1 3"/>
      <path fill="#72614e" d="m-19-2 28 1 7-4 1 2-7 5-29-1z"/><g fill="none" stroke="#584e44"><circle cx="-10" cy="3" r="3"/><circle cx="6" cy="4" r="3"/></g></g>`
  },
  'Snowbound railway': {
    distance: `<path fill="#90a4a4" d="M-2100 104h2019l30 11 18-2 33 22 31 10 26 3 27 13 78 9 54-10 57-8 22-12 23-5 34-22 29-4 30-13 38-3 25 5 1926 22v91h-4500z"/>
      <path fill="#ced7ca" d="m-94 104 13 0 30 11 18-2 25 17-24-10-20 1zm391 31 21-5 34-22 29-4 30-13 32-2-28 7-37 14-20 2-27 19z"/>
      <path fill="#748d88" d="M-2100 150h2050l54 16 29 2 16 8 43 2 10 4h-2202zm2351 25 36-7 34-19 17 1 25-17 36-4 38-14 1963 33v45h-2194z"/>
      <path fill="none" stroke="#acb8a9" stroke-width="1.2" d="m286 169 26-11 13-8m5 5 20-10 12-10m-14 16 26-12 12-1m-426 20 29 9 13 .5"/>`,
    middle: `<g transform="translate(108 174)"><path fill="#665f51" d="M-1 0v-24h2V0z"/><path fill="#a85745" d="M0-24l-12 3 1 3 12-3z"/>
      <path fill="#e6d6ae" d="m-10-21 3-1 1 3-3 1z"/><circle cy="-23" r="1.4" fill="#3b524b"/></g>
      <path stroke="#a7a298" fill="none" stroke-width=".8" d="m43 179 9-.2m5 3 6 .2m228-2 11-.1m-2 4h6m55-5h9"/>`
  },
  'Glasshouse garden': {
    middle: `<g transform="translate(110 202)"><path fill="#995e46" d="M-8-6h9L0 0h-6zm9 2h7L7 1H3z"/><path fill="#bd8665" d="M-9-7H2v2H-9zm9 2h9v2H0z"/>
      <path fill="none" stroke="#60715a" d="m-4-7 1-12m0 7-4-3m4 1 4-4"/><path fill="#a9ad88" d="M-4-15q-5 0-5-5 6 1 5 5zm1 0q1-6 6-6-1 6-6 6z"/>
      <path stroke="#897957" d="m5-6 3-6"/><path fill="#ded9b9" d="m7-14 6 2-1 3-6-2z"/></g>`
  },
  'Skating pond': {
    middle: `<g fill="none" stroke="#e2ece6" stroke-width=".75"><path d="M65 195q22-7 34-4 10 3-9 5-26 2-36 7m42-7q34-5 37-3t-21 6m162-7q47-8 53-6t-21 7"/></g>
      <g transform="translate(285 205)"><path fill="#725b49" d="m-11-5 23-1v2l-23 2zm2 2h2v4h-2zm17-1h2v4H8z"/>
      <path fill="#a7544b" d="m3-7 5 .2 1 5-2 4-2-.5.5-5-3-1z"/></g>`
  },
  'Clocktower market': {
    distance: `<path fill="#b0aea0" d="M-2100 149h2032q125-22 201-6l53-5q97-25 186-6l93 14 1935 5v71h-4500z"/>
      <path fill="#8e958a" d="M-2100 164h2014l17-9h12v-7h4v7h21l9 7 20-3 17-14 28 1 14 12h20l17-10h9v-7h5v7h10l20 13h37l16-11h49l14 10h27l20-16h23v-6h4v7h13l16 11 15-2 18-15h29l21 17h25l13-8h37l13 10 1920 8v55h-4500z"/>
      <path fill="#d0cbb6" d="m-3 159 17-14 28 1 14 12-17-9-23-.5zm74-2 15-9h33l12 9-17-6H86zm218-4 18-15h29l19 16-20-12h-25z"/>
      <path fill="#b1b5a3" d="M24 156h3v5h-3zm8 0h3v5h-3zm62 0h3v4h-3zm217-7h4v5h-4zm9 0h4v5h-4z"/>`,
    middle: `<g transform="translate(333 194)"><path fill="#966f50" d="M-12-5H0v7h-12zm14 0 11-1v7H2z"/>
      <path fill="#c98b58" d="m-11-5 1-3 3 .5 1 3zm5-.2 1-3 3 1 .5 2zm9 .1.5-3h3l1 3zm5-.4.5-3 3-.4 1 3z"/>
      <path stroke="#c5a77a" d="M-12-2H0m3 .1 10-1"/><path fill="#e7d8ae" d="m-7-7 1-5 5 1-1 4z"/></g>`
  },
  'Tidepool cove': {
    ground: `<g transform="translate(70 248)"><path fill="#657d7a" d="M-13-1q6-4 14-2t12 1Q4 1-13-1z"/>
      <g fill="#4a5d64" stroke="#a1b6af" stroke-width=".5"><path d="M-9-2q-1-4 1-4t3 5zm5 1q-2-5 0-6t3 5zm6-1q-1-6 2-6 2 2 1 6zm5-1q1-4 3-4t0 5z"/></g></g>`
  },
  'Glacier grotto': {
    middle: `<g stroke="#b5dae0" fill="none" stroke-width=".7"><path d="m-19 104 9-18 11-9m-7 18 7-13m32-30 14-6 18-18m275 35 11 24 13 12m-17-8 5 14m21 18 8 24 11 11"/></g>
      <g fill="#cde2e0" opacity=".7"><ellipse cx="60" cy="199" rx="3.1" ry=".8"/><ellipse cx="66" cy="196" rx="1.8" ry=".65"/><ellipse cx="71" cy="197" rx="1.25" ry=".4"/></g>`
  },
  'Summit observatory': {
    middle: `<g transform="translate(107 179)"><path stroke="#66736d" d="M0 4v-20"/><g class="wind-sock"><path fill="#b97456" d="M1-17q6 1 12 5l-2 2-12-3z"/>
      <path fill="#efddba" d="m3-16 2 .5-1.5 4-2-.5zm5 2 2 1-1 2.5-2-.5z"/></g></g>`
  }
};
