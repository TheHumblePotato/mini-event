import {winterToppers} from './winter-keepsakes.js';

export function harbor(){
  return `<path fill="#789eaa" d="M-1200 172q600 9 1200 1t1200 0v66h-2400z"/>
    <path fill="none" stroke="#cfddd6" stroke-width=".9" d="m-54 192 49 1m15 7 42-2m-6-13 26 1m214 8 51-1m18 6 46-1"/>
    <g transform="translate(65 190)" class="beacon">
    <path class="beam" fill="#ffe3a3" opacity=".52" d="m2-54 86-17v32z"/>
    <path fill="#e4deca" d="M-9 0-5-49H6L11 0z"/><path fill="#a95645" d="m-7-25 15-6 1 9-17 7z"/>
    <path fill="#445954" d="M-8-57H8v9H-8zm-1-1 9-7 9 7z"/><path fill="#fed78c" d="M-5-55h4v5h-4zm6 0h4v5H1z"/>
    <path fill="#66594c" d="M-2 0v-10q3-3 5 0V0z"/><path stroke="#6e5b4b" d="M-12-47H12m-21-3v5m18-5v5"/>
    </g><path fill="#a8bab3" d="m20 192 27-10 30 1 18 8z"/><path fill="#f3eee1" d="m22 191 26-10 25 1 13 6-21-3z"/>
    <g transform="translate(320 182)"><g class="harbor-sail"><path fill="#72554a" d="M-18 0h40l-8 7h-24z"/><path fill="#f3e8cc" d="M0-30v28h-16zm3 5 15 22H3z"/><path stroke="#574a40" d="M1-34v34"/></g></g><g transform="translate(20 141)"><g class="harbor-gulls" fill="none" stroke="#515f60" stroke-width=".9"><path d="M0 0q3-2 5 1 2-3 5-2m6 6q3-2 5 0 1-3 5-2m10-7q2-2 4 0 1-2 4-2"/></g></g><g transform="translate(101 187)"><g class="harbor-dory"><path fill="#9d684d" d="m-12-2 24 1-5 4H-6z"/><path stroke="#d9bc96" d="m-7-2 11 4m-4-4 10 3"/></g></g>`;
}
export function mill(){
  const sails=Array.from({length:4},(_,i)=>`<g transform="rotate(${i*90})"><path fill="#e7d4ac" stroke="#866e50" stroke-width=".8" d="M2-3v-32h7v26z"/><path stroke="#aa9370" stroke-width=".7" d="M3-28h6m-6 5h6m-6 5h6m-6 5h6"/></g>`).join('');
  return `<path fill="#abbdac" d="M-800 195q450-47 950-10t650-8v45H-800z"/>
    <g stroke="#85755d" stroke-width="1.4"><path d="m-60 202 183-13m153 8 182-13"/><path d="M-10 203v-9m29 7v-9m32 7v-9m34 6v-9m230 8v-9m38 7v-10m34 8v-10"/></g>
    <g transform="translate(311 197)">
    <path fill="#b59c79" d="m-15 1 6-48H8l9 48z"/><path fill="#776650" d="M-13-47q13-22 26 0z"/>
    <path fill="#51493f" d="M-3 0v-9q3-5 7 0v9z"/><path fill="#fada98" d="M-2-27h5v6h-5z"/>
    <g transform="translate(0 -44)"><g class="sails">${sails}</g><circle r="2.5" fill="#574b3f"/></g></g>`;
}
let mistId=0;
export function mistBank(){
  const id='bank-'+ ++mistId;
  return `<g pointer-events="none" class="mist-bank"><defs><radialGradient id="${id}"><stop stop-color="#e4f0f0" stop-opacity=".72"/><stop offset=".56" stop-color="#dae9e8" stop-opacity=".32"/><stop offset="1" stop-color="#d8e6e7" stop-opacity="0"/></radialGradient></defs><g fill="url(#${id})"><ellipse cx="63" cy="185" rx="170" ry="8"/><ellipse cx="291" cy="190" rx="152" ry="9"/><ellipse cx="138" cy="198" rx="135" ry="6"/></g></g>`;
}
export function treeTopper(type){
  if(type==='None')return '';
  const forms={...winterToppers,
    'Crescent moon':'<path fill="#efcf84" d="M4-13A13 13 0 1 0 12 6Q-4 8 4-13z"/><path fill="#fff1c4" d="m6-6 1-3 1 3 3 1-3 1-1 3-1-3-3-1z"/>',
    'Solstice sun':'<g stroke="#ddad54" stroke-width="2"><path d="M0-16v5m0 22v4m-16-15h5m22 0h5m-26-11 4 4m12 13 4 4m0-21-4 4m-13 13-4 4"/></g><circle r="8.8" fill="#f4d58e"/><circle r="5.8" fill="none" stroke="#ce9752"/>',
    'Compass rose':'<path fill="#e9cd8d" d="m0-15 3 11 10-3-8 8 8 6-11-2-2 10-3-10-10 2 8-7-8-7 10 3z"/><path fill="#749a98" d="M0-15v15L3-4zm0 15 13 7-8-6zM0 15V0l-3 5zM0 0-13-7l8 7z"/>',
    'Holly spray':'<path fill="#709372" d="m0 4-12-3 3-2-6-7 8 2 1-4 5 9 5-12 2 5 7-3-5 7 3 2z"/><g fill="#c95e54"><circle cx="-2" cy="3" r="3"/><circle cx="4" cy="3" r="3"/><circle cx="1" cy="7" r="3"/></g>',
    'Glass spire':'<path fill="#d0e7eb" d="M0-19 3-4q7 6 0 11L0 12l-3-5q-7-5 0-11z"/><path fill="#80aabe" d="M0-14v22l4-6-2-6z"/><path stroke="#fff7da" d="m-2-1-1 4"/>',
    'Paper angel':'<path fill="#eee2bb" d="m-2 0-10-7q-2 10 9 12L-7 11H7L3 5Q14 3 12-7L2 0z"/><circle cy="-4" r="3" fill="#d8ad7f"/><ellipse cy="-9" rx="4" ry="1" fill="none" stroke="#eac676"/>',
    'Ribbon bow':'<path fill="#ba5a55" d="M0-1Q-14-13-12-1t12 2q8 9 13 2t-13-4zM-2 2l-6 12 5-2 2 3 3-13 4 11 1-4 4 1L3 1z"/><circle r="2.6" fill="#dfb77e"/>'
  };
  const shape=forms[type]||`<path fill="${type==='Brass'?'#ffce63':type==='Rose gold'?'#f5b395':'#e1eeef'}" d="m0-12 3 8 9 1-7 5 2 9-7-5-8 5 3-9-7-5 9-1z"/>`;
  return '<g transform="translate(200 49)">'+shape+'</g>';
}

