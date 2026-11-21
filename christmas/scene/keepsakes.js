// Each keepsake is drawn in the same small hanging-ornament coordinate system.
export const keepsakes={
  Candle:'<path fill="#dc9148" d="M0-10q6 5 1 8-6-2-1-8z"/><path fill="#fff0ad" d="M0-6q2 3 0 3z"/><path d="M-4-2h8V8h-8z"/><path fill="#f9f1d6" d="M-4-2h8v2l-2 2-1-3-2 2z"/><path stroke="#aa805a" d="M-6 8H6"/>',
  Snowman:'<circle fill="#f6f5e5" cy="3" r="6"/><circle fill="#fff8e9" cy="-4" r="4"/><path d="M-5-7h10v-1H2v-3h-5v3h-2zm0 7h10v2H2l3 4-2 1-3-5h-5z"/><circle cx="-1" cy="-4" r=".8" fill="#364e50"/><path fill="#e69749" d="m1-4 5 1-5 1z"/>',
  Apple:'<path fill="none" stroke="#83684d" d="M0-4q0-5 3-6"/><path fill="#70966d" d="M1-6q3-6 7-3-3 4-7 3z"/><path d="M0-4Q8-9 8-1 8 5 3 8L0 7q-6 3-8-6-1-8 8-5z"/><path stroke="#fff4c4" fill="none" d="M-5-1q0-2 2-2"/>',
  'Candy cane':'<path stroke="#fff1da" stroke-width="4.5" fill="none" stroke-linecap="round" d="m-4 8 3-13q1-6 6-4 3 1 2 5"/><path fill="none" stroke="currentColor" stroke-width="3.2" d="m-5 5 3 2m-2-7 3 2m-2-7 3 2m3-8-1 4m6 1-3-1"/>',
  Gingerbread:'<circle cy="-6" r="3.5"/><path d="m-2-4-6 2q-3 2 0 4l5-2-3 7q0 4 3 3l3-5 3 5q4 1 3-3L3 0l5 2q4-1 1-4L2-4z"/><path stroke="#fff0cd" fill="none" d="m-6-1 1 2m10-2-1 2M-3-5l1 1m3-1 1 1m-3 2 2 0"/><circle cy="1" r="1" fill="#fff0cd"/>',
  Stocking:'<path d="M-2-7h7v10q0 4-6 5l-6 1q-5-3-1-6l6-1z"/><path fill="#fff5de" d="M-3-9H6v4h-9zM-8 3q5 0 4 5l-4 1q-3-3 0-6z"/><path fill="none" stroke="#fbd79a" d="m0-2 2 1 2-1"/>',
  Jewel:'<path d="m-8-3 4-5h8l4 5L0 9z"/><path fill="#fff" opacity=".46" d="m-8-3 4-5L0-3z"/><path fill="#253243" opacity=".25" d="m0 9 3-12h5z"/><path fill="none" stroke="#fff6d6" stroke-width=".7" d="M-8-3H8m-8 12-3-12 3-5 3 5z"/>',
  'Paper star':'<path d="m0-10 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/><path fill="#fff2cc" opacity=".65" d="m0-10 0 10-3-4zm0 10 10-3-5 5zm0 0-6 9 1-7z"/>',
  Mushroom:'<path fill="#f6e5c8" d="M-2-1h4l2 8q-4 3-8 0z"/><path d="M-9 0Q-5-11 0-9 7-9 10 0 0 3-9 0z"/><g fill="#fff4df"><circle cx="-4" cy="-2" r="1.4"/><circle cy="-6" r="1"/><circle cx="5" cy="-3" r="1.3"/></g>',
  Teapot:'<path fill="none" stroke="currentColor" stroke-width="2" d="M4-3q8-4 5 3-1 2-4 2"/><path d="M-6-2q5-4 10-1 4 2 2 7Q3 9-4 7q-4-2-4-6l-3-5 6 3z"/><path stroke="#fbe5b0" fill="none" d="M-4-3q3-2 7-1m-6 6q3 2 6 0"/><circle cy="-6" r="1.6"/>',
  Cabin:'<path d="M-7-2 0-9l7 7V8H-7z"/><path stroke="#fff3d5" stroke-width="2" fill="none" d="m-9-1 9-9 9 9"/><path fill="#ffd280" d="M-5 0h4v4h-4z"/><path fill="#695342" d="M2 1h3v7H2z"/>',
  Fox:'<path d="m-8-8 6 3h4l6-3-1 10-7 7-7-7z"/><path fill="#fff0d9" d="M-7 0q5 1 7 6 2-5 7-6L0 9z"/><path fill="#353d37" d="m-2 6 2 2 2-2z"/><path stroke="#373c33" d="m-5-1 2 1m6 0 2-1"/>',
  Wreath:`<path fill="none" stroke="#52674c" stroke-width="2.7" d="M-.4-7.2C8.8-8.7 10 5 2.4 7.8-7.8 11-11-5.1-.4-7.2z"/>
    <g fill="#759071"><path d="M-6 5q-5-2-4-6 3-.1 4 6zm-2-4q-3-4-.8-7 2.5 1.3.8 7zm1.3-4.1q-.4-5 3.5-6 .8 3-3.5 6zM2.8-6.6Q6-10.4 8.3-8q-1.9 2.5-5.5 1.4zm3.7 2q4.3-1.8 5.1 1.1-2.6 2.3-5.1-1.1zM7 .2q4-.4 3.6 2.4Q8.2 4 7 .2zM6 4q2.5 1.1 2.8 3.9-3.2 0-2.8-3.9zM2.8 7Q6 8 4.7 10.6 1.8 10 2.8 7zm-4.8.7q1.4 2.6-1.6 3.2-2.1-1.5 1.6-3.2z"/></g>
    <path d="M-1.3-6.7Q-8-11.5-6-7.3l.4 2.6 4.4-1.7L-4.6-.8l2.1-.4.6 1.3 2-6.3 3.7 4.7.1-2 1.8.4L1.4-7q5.6 1.8 5.1-.6l-.4-2.3Q3.5-10.7 0-7.9z"/><circle cy="-7" r="1.35" fill="#bd975c"/>
    <g fill="#b95550"><circle cx="-6.2" cy="2.1" r="1.25"/><circle cx="-4.8" cy="4" r="1"/><circle cx="4.8" cy="5.2" r="1.2"/></g>`,
  Sled:'<path d="m-5-7 3-1 5 11-3 1zm4-2 3-1L7 1 4 3z"/><path fill="none" stroke="#d8b681" stroke-width="1.4" d="m-7-3 6 13q2 1 3-2m0-13 6 12q2 1 3-2M-5 0l10-4M-2 6l10-4"/>',
  Dove:'<path d="m-10 1 6 1q1-3 4-4-3-5-2-8 5 4 7 8 3-2 4 0L7 1q-3 6-10 5l-6 3 3-5z"/><path fill="none" stroke="#f8e5bd" d="m-2 2 5-3"/><circle cx="6" cy="-1" r=".7" fill="#38473e"/>',
  Drum:'<path d="M-7-5q7-3 14 0V6q-7 4-14 0z"/><ellipse cy="-5" rx="7" ry="2" fill="#f7e4b9"/><path fill="none" stroke="#f8d594" d="m-7-3 3 9 4-8 4 8 3-9M-7 6q7 4 14 0"/>'
};
