import {marsh,bindery} from './marsh-and-bindery.js';

let pillarInstance = 0;
export function lightPillars() {
  const id = 'ice-column-' + ++pillarInstance;
  const columns = [[-52,130,6],[22,96,3],[46,143,8],[93,115,4],[136,84,3],[262,125,5],[298,153,7],[340,106,3],[414,139,6]];
  return `<defs><linearGradient id="${id}-edge">
    <stop stop-color="#efb9c7" stop-opacity="0"/><stop offset=".36" stop-color="#efb9c7" stop-opacity=".34"/>
    <stop offset=".5" stop-color="#fff1c9" stop-opacity=".91"/><stop offset=".67" stop-color="#f6ced1" stop-opacity=".36"/>
    <stop offset="1" stop-color="#efb9c7" stop-opacity="0"/></linearGradient>
    <linearGradient id="${id}-rise" x2="0" y2="1"><stop stop-color="white" stop-opacity="0"/><stop offset=".7" stop-color="white"/></linearGradient>
    <mask id="${id}-fade" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#${id}-rise)"/></mask></defs>` +
    columns.map(([x,height,width],i) => `<g class="light-column" style="--phase:-${i*1.8}s">
      <rect x="${x-width}" y="${180-height}" width="${width*2}" height="${height}" fill="url(#${id}-edge)" mask="url(#${id}-fade)"/></g>`).join('');
}

// Each landscape has its own skyline, middle distance and snowbank detailing.
// The foreground shares the coordinate system of the tree's roots.
export const landscapes = {
  'Heron marsh': marsh,
  'Bookbindery lane': bindery,
  'Tidepool cove': {
    distance: `<path fill="#869eaa" d="M-2100 151h2012l58-24 38 5 41-34 46 9 39 27 62 16 82-4 40-26 33-3 33-21 46 13 49 28 80 13h1900v99H-2100z"/>
      <path fill="#618b93" d="M-2100 151q1250-4 2210 0t2290 0v155h-4500z"/>
      <path stroke="#b3d5d0" fill="none" d="M-85 158h111m19 3h51m198-5h110m-26 6h88"/> `,
    middle: `<g fill="#4d636a"><path fill-rule="evenodd" d="M-220 186v-30l117-16 47-23 46-5 18-29 27 2 18 23 23 4 17 33 37 15 10 25z M-7 180q7-38 25-42 22-2 28 41z"/>
      <path d="m293 171 16-16 5-31 11-8 7-25 15 4 8 29 9 12 4 28 22 11z"/></g>
      <path fill="#d7ddd3" d="m-17 120 25-37 27 2 18 23-20-10-15 1-9 11zm339 2 10-31 15 4 5 19-14-9-5 8z"/>
      <path fill="#789194" d="m27 102 5 21 24 14-13-15zm302 25 5 36 7 4-2-48z"/>
      <g stroke="#93a5a2" opacity=".62" fill="none" stroke-width=".8"><path d="m-62 145 34-7 24-10m-35 17 19-4m50-25 11 12 18 8m-22 12 14 6 21 3m252-27-3 19-6 9m19-27 4 20"/></g>
      <g transform="translate(75 164)" fill="#e4e7da"><path d="M-7-3q3-3 7 0l3-3 2 1-1 3-4 2z"/><path stroke="#605c52" stroke-width=".65" d="M-1 0v2m3-3v2m3-6 3 1"/></g>
      <path fill="#78a6a5" d="M-2100 186q2060-10 2196-4t2250-4v81h-4446z"/>
      <g class="cove-swell" fill="none" stroke="#e4eee1" stroke-linecap="round"><path stroke-width="1.6" d="M-85 180q47-6 79 0t65-2m246-4q22 5 61 2t60 2M27 202q36-6 81-3m220-3q58-5 95-1"/><path stroke-width=".7" d="m-23 190 55 1m14-5 37-1m208-1 54 2"/></g>`,
    ground: `<path fill="#75989b" d="M-40 250q20-13 60-14l42 2q-12 7-43 9t-59 3zm346-13q24-10 54-8l32 2-43 7z"/>
      <path fill="none" stroke="#c3d9cc" d="m-3 244 34-3m300-4 24-3"/><g fill="#746d5b"><path d="m64 239 4-6 7 1 5 4zm284-3 4-5 8 1 2 3z"/></g>
      <path fill="none" stroke="#77806a" stroke-width="1.2" d="M2 247q6-9 13-7-5 0-7 4m3-2 6-1m318-7q8-4 16-3m-10 1 4-4"/>
      <path fill="#a8634e" d="m37 247 2-3 1 3 4-1-3 2 1 3-3-2-3 2 1-3-3-1z"/>`
  },
  'Glacier grotto': {
    distance: `<path fill="#9abac7" d="M-2100 175H-40l81-83 54 27 58-50 50 50 71-66 63 59 63-32 97 94h1903v158h-4500z"/>
      <path fill="#e3e9e7" d="m90 124 63-55 30 30-27-13-15 22-3-11zm125-14 59-57 43 40-41-24-19 27-3-8z"/>
      <path fill="#64a6b4" d="M-2100 178h4500v123h-4500z"/>`,
    middle: `<path fill="#54838e" d="M-2200-600H110V15L76 57 46 67 32 108 4 137 1 186-46 215h-2154zm2450 0h2150v815H398l-28-38-12-73-35-24-13-40-43-23z"/>
      <path fill="#8fc1c6" d="m-92 5 185-18-44 57-51 22-23 52-47 36zm360-20 193 6-37 123-37-41-41-9-22-33z"/>
      <path fill="#b8dad8" d="M-75 49 48 40 22 74l-8 55-5-51-22 22-7 53-9-49-27 33zm367-27 73 26-16 8-3 36-12-43-14-6-4 18-7-25z"/>
      <path fill="#d8ebea" d="m14 129-2-49 10-6zm332-37-4-40 7 4z"/>
      <path fill="#759eae" d="m-53 142 17-39 14-11-13 40-11 39zM363 98l29 16 15 61-21-25z"/>
      <path fill="none" stroke="#c9e5e5" opacity=".64" stroke-width=".85" d="m-83 75 52-24 23-2m-56 35 28-12m58-25 20-12 33-9m245 12 23 10 15 14m16 27 21 9 8 28m-350 74 40-3m213 5 39-5"/>
      <path fill="#477e8e" d="M-2100 204q2066-19 2140-11t95 0q80-14 171-8t2094-10v64h-4500z"/>
      <g transform="translate(14 130)"><ellipse class="ice-drip" cy="4" rx="1.2" ry="2.4" fill="#d4eeec"/></g>
      <g transform="translate(14 197)"><ellipse class="drip-ring" fill="none" stroke="#cee8df" rx="9" ry="1.4"/></g>
      <g fill="#a3cdd1"><path d="m-40 202 22-11 31 3-10 7zm130-7 15-6 29 2-10 5zm211 10 24-12 31 3-15 6z"/></g>`,
    ground: `<path fill="#b4d6d5" d="m63 252 8-15 5 11 6-25 5 23 8-10-2 16zm249-15 4-12 5 7 6-19 2 20 7-6-2 10z"/>
      <path fill="#f4f7eb" d="m71 237 1 11-9 4zm11-14 1 24-7 1zm45 44 22-6 17 1-13 2z"/>
      <path fill="none" stroke="#9abebf" stroke-width=".8" d="m-50 265 54-14 18 4 30-9m-29 9 8 6m294-16 37-10 20 4 42-10"/>`
  },
  'Summit observatory': {
    distance: `<path fill="#8994a3" d="M-2100 183H-94l43-55 43 21 56-70 34 24 44-58 38 56 38-19 77 70 39-35 43 20 72-75 44 34 57-59 90 110h1800v177h-4450z"/>
      <path fill="#e5ded5" d="m66 111 60-66 28 43-24-20-9 15-6-6zm300-10 57-39 26 23-30-11-12 14-4-4zm99-7 69-57 49 60-43-42-16 20-7-6z"/>
      <path fill="#6b7985" d="M-2200 190h2120l135-21 72-21 85 9 68-24 136 21 82-7 100 26h1902v170h-4600z"/>`,
    middle: `<path fill="#889491" d="M-2000 211h1950l118-33 73-6 102 16 61-18 65 2 89 22h1942v110h-4400z"/>
      <g transform="translate(53 175)"><path fill="#657d80" d="M-38-25q3-33 36-33 31 1 38 33z"/><path fill="#83a19d" d="M-36-26q6-27 30-30-12 9-15 30z"/>
      <path fill="none" stroke="#526e71" stroke-width=".95" d="M-12-55q-13 8-16 28m17-28q-8 10-8 28m19-29q17 11 21 29m-53-9q28 4 62 0"/>
      <path fill="#364f55" d="m-5-57 5-1 11 33H3z"/><path fill="#d4ded4" d="M-39-25h76v4h-76z"/>
      <path fill="#b9a48b" d="M-34-21h66v28h-66z"/><path fill="#8a7766" d="M12-21h20V7H12z"/><path fill="#63594e" d="M-10 7v-17q6-6 12 0V7z"/>
      <path fill="#f6d394" d="M-27-14h7v7h-7zm41 0h8v7h-8z"/><path stroke="#877767" stroke-width=".8" d="M-24-14v7m-3-4h7m38-3v7m-4-4h8m-53 9h9m-6 2h12m13 2h12"/>
      <path fill="#e5e0ce" d="M-45 8h86l6 3h-96z"/><path fill="#948d7f" d="M-12 8H4l4 5H-16z"/><path stroke="#e6dfc9" d="M-13 10H5m-19 2H7"/></g>
      <g transform="translate(337 180)"><path fill="#53646a" d="m-12 8 12-31 12 31h-4L0-14-8 8z"/><path fill="none" stroke="#697b78" d="m-7-1 14 7m-14 0 12-8"/>
      <g class="radio-dish"><path fill="#d1d5c9" stroke="#627979" d="M-23-40q1 30 31 29z"/><path fill="none" stroke="#839592" stroke-width=".7" d="M-20-36q6 19 23 23m-16-20q6 14 15 18"/>
      <path fill="none" stroke="#677e7c" d="m-22-39 24 7 6 21M2-32l5-7"/><circle cx="7" cy="-39" r="1.5" fill="#ba8d68"/></g></g>
      <path fill="none" stroke="#ece7d8" stroke-width="2.8" d="M-62 208q35-19 92-24m262 13q55-18 96-10"/>`,
    ground: `<path fill="#c6c7b8" d="m39 247 15-10 10 3 11 8zm298 3 20-11 9 1 8 8z"/><path fill="#faf5e5" d="m39 247 15-11 11 4-12-1-6 6zm300 1 18-11 9 3-9-1z"/>
      <path fill="none" stroke="#93867b" d="m90 234 1-13m-2 4h5m219 18-1-11m-2 3h5"/>`
  }
};
