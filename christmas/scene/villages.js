// Mid-distance landmarks use the same 400-unit courtyard coordinates as the main tree.
function windowRow(x,y,n,step,width,height){
  return Array.from({length:n},(_,i)=>`<rect x="${x+i*step}" y="${y}" width="${width}" height="${height}" rx=".6"/>`).join('');
}
function nightTrain(){
  const arches=Array.from({length:14},(_,i)=>`M${i*48-120} 196v-10q18-22 36 0v10`).join('');
  return `<path fill="#828e88" d="M-130 174h690v24h-690z"/>
    <path fill="#c9d6cc" d="${arches}" stroke="#acb9ac" stroke-width="2"/>
    <path stroke="#605b51" stroke-width="1.8" d="M-130 173h690"/>
    <g transform="translate(72 171)"><g class="winter-train">
    <g fill="#764e46" stroke="#594b40" stroke-width=".8"><rect x="-88" y="-12" width="39" height="11" rx="2"/><rect x="-47" y="-12" width="39" height="11" rx="2"/></g>
    <g fill="#ffd69a">${windowRow(-84,-10,5,7,4,4)}${windowRow(-43,-10,5,7,4,4)}</g>
    <path fill="#35504a" d="M-5-1v-15h11v5h15l-1-7h5l-1 7 6 3 2 7z"/>
    <path fill="#f3d099" d="M-3-13h5v6h-5z"/><g fill="#3a4640"><circle cx="-80" r="2.4"/><circle cx="-57" r="2.4"/><circle cx="-37" r="2.4"/><circle cx="-15" r="2.4"/><circle cx="0" r="3"/><circle cx="10" r="3"/><circle cx="21" r="3"/></g>
    <g transform="translate(22 -20)" fill="#e2e4d3"><ellipse class="steam" rx="4" ry="2.6"/><ellipse class="steam second" rx="5" ry="3.4"/></g></g></g>`;
}
function conservatory(){
  const panes=Array.from({length:9},(_,i)=>`M${i*7} 0v23`).join('');
  const hall=(x,y,scale)=>`<g transform="translate(${x} ${y}) scale(${scale})">
    <path fill="#b0cac0" stroke="#526d63" d="M-1 0 10-12h42L64 0v24H-1z"/>
    <path fill="#ead6a1" d="M2 2h58v18H2z"/><path fill="#7b9471" d="M3 21q2-15 5-4 0-16 5-10 6 4 0 14zm23 0q-4-16 2-12 1-13 6-7 3 8-1 19zm19 0q0-12 5-9 2-9 6-5l-4 14z"/>
    <path fill="none" stroke="#527168" stroke-width="1" d="${panes}M0 10h63m-63-11h63M0 22h63M12 0l7-12M28 0l2-12M44 0l-2-12"/>
    <path fill="#f1f1dd" d="m-3 0 12-14h44L65 0 50-11H12z"/>
    <path fill="#547067" d="M26 24V10q5-8 11 0v14z"/><circle cx="34" cy="17" r=".8" fill="#ebce8a"/></g>`;
  return hall(24,175,1.26)+hall(309,167,1.03)+'<path fill="none" stroke="#a6b8a5" stroke-width="3" d="M61 205q14 8-17 14m300-26q8 8-12 11"/>';
}
function skatingPond(){
  const skater=(x,y,coat,delay)=>`<g transform="translate(${x} ${y})"><g class="skater" style="animation-delay:${delay}s">
    <path stroke="#3d4f53" fill="none" stroke-width="1.3" d="m0-3-2 4m3-4 3 3"/><path fill="${coat}" d="m-2-10 4 1 2 7h-7z"/><circle cy="-12" r="2" fill="#b7896b"/><path stroke="#fff0d8" fill="none" d="m-5 2 4-1m4 0h4"/><path fill="${coat}" d="m-2-13 1-3 3 2v1z"/></g></g>`;
  return `<path fill="#91b9c5" d="M-65 182q48-18 157-8t234-5q100-12 148 13-19 23-150 22t-246 6q-117 3-143-28z"/>
    <path fill="none" stroke="#e0e9df" d="M-30 187q53 11 118 3t97 0m50 6q75-10 157-6"/>
    ${skater(82,192,'#a95b51',0)}${skater(302,183,'#547e71',-6)}${skater(345,188,'#ae8950',-11)}
    <g stroke="#776b59" stroke-width="1.4"><path d="M31 184v-11m6 10v-10m-10 3h16m267-10h21m-18-3v10m14-10v10"/></g>`;
}
function clockSquare(){
  return `<g transform="translate(83 202)"><path fill="#936b55" d="M-15 0v-54h30V0z"/><path fill="#725545" d="M6-54h9V0H6z"/><path fill="#5f706a" d="m-19-54 18-29 20 29z"/><path fill="#e3e5cf" d="m-19-54 18-31 10 16-11-9z"/>
  <circle cy="-42" r="9" fill="#d8b77f"/><circle cy="-42" r="7.5" fill="#fff1cb"/><g transform="translate(0 -42)" stroke="#4f5348"><path d="M0-6v1m6 5H5M0 6V5m-6-5h1"/><path d="M0 0l-3-3"/><path class="clock-hand" d="M0 0v-5"/></g><path fill="#503f36" d="M-4 0v-19q4-5 8 0V0z"/></g>
  <g transform="translate(297 189)"><path fill="#966c50" d="M0-13h52V4H0z"/><path fill="#a7564b" d="m-4-12 6-12h47l7 12z"/><path stroke="#f4e6cf" stroke-width="4" d="m9-23-4 11m17-11-2 11m14-11 2 11m9-11 5 11"/><g fill="#f7d395">${windowRow(5,-10,4,12,8,5)}</g></g>`;
}
export const villageScenes={'Snowbound railway':nightTrain,'Glasshouse garden':conservatory,'Skating pond':skatingPond,'Clocktower market':clockSquare};

export function gondolaLine(){
  const car=klass=>`<g class="gondola ${klass}"><circle r="1.3" fill="#535959"/><path fill="none" stroke="#424f4c" d="M0 0v4l2 2v2"/><rect x="-5" y="7" width="13" height="9" rx="2" fill="#a05246"/><path fill="#e7d8ae" d="M-3 8h4v4h-4zm6 0h3v4H3z"/><path stroke="#743f38" d="M-3 14h9"/></g>`;
  return '<path d="M-100 97Q149 184 483 120" fill="none" stroke="#554951"/>'+car('outbound')+car('inbound');
}
