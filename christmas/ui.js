import {letter} from './screens/letter.js';
import {workshop} from './screens/workshop.js';
import {scene} from './scene/art.js';
import {schoolName} from './data/model.js';
import {treeStyleFields} from './screens/tree-styles.js';
import {showGallery} from './screens/gallery.js';
import {showPostcard} from './screens/postcard.js';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const local=['localhost','127.0.0.1'].includes(location.hostname);
const demo=local && params.has('demo');
const home=!$('content');
const treeUrl=(args={})=>{
  const url=new URL(home?'christmas/tree.html':'tree.html',location.href);
  for(const [key,value] of Object.entries(args)) url.searchParams.set(key,value);
  if(demo) url.searchParams.set('demo','1');
  return url.href;
};
function theme(value){
  document.documentElement.dataset.theme=value;
  $('theme').textContent=value==='dark'?'Light mode':'Dark mode';
}
theme(localStorage.getItem('winter-theme') || (matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
$('theme').onclick=()=>{
  const value=document.documentElement.dataset.theme==='dark'?'light':'dark';
  localStorage.setItem('winter-theme',value); theme(value);
};
const defaults={species:'Fir',setting:'Courtyard',weather:'Snowfall',star:'None'};
if(home) $('heroArt').innerHTML=scene(defaults);
else { $('myTree').href=treeUrl(); $('publicTrees').href=treeUrl({gallery:'1'}); }
if(local && !demo){
  const a=document.createElement('a');a.href=treeUrl({demo:'1'});a.textContent='Play with local preview accounts';$('preview').append(a);
}
const status=text=>{$('status').textContent=text;};
function submit(form,fn){
  form.onsubmit=async event=>{
    event.preventDefault();const button=form.querySelector('button');button.disabled=true;
    try{await fn(Object.fromEntries(new FormData(form)));}catch(e){status(e.message);}finally{button.disabled=false;}
  };
}
let call,signature;
let currentPage=1, revision=0;
async function render(){
  const request=++revision;
  const content=$('content');
  // Keep the previous scene visible while a page is loading.
  if(params.has('gallery')){
    const trees=await call('gallery');
    document.body.classList.add('in-gallery');
    showGallery(content,trees,treeUrl);
    status('');return;
  }
  const id=params.has('id')?params.get('id'):await call('mine');
  if(!id){
    content.innerHTML='<div class="layout"><div class="art" id="scene"></div><form><h2>Plant your tree</h2><div class="tree-style-fields"></div><p>Public trees appear in the school gallery. Choose Private to share yours by link.</p><button>Plant tree</button></form></div>';
    const form=content.querySelector('form');
    treeStyleFields(form,defaults,$('scene'));status('');
    submit(form,async values=>location.assign(treeUrl({id:await call('create',values)})));return;
  }
  const tree=await call('view',{id,page:currentPage});
  if(request!==revision)return;
  currentPage=tree.page;
  content.innerHTML='<article class="grove"><header class="grove-head"><div><h2 id="treeName"></h2></div><button id="copy">Copy tree link</button></header><div class="art landscape" id="scene"></div><footer><span id="reveal"></span></footer></article><div class="branch-head"><h2>On the branches</h2><div id="actions"></div></div><nav id="tree-pages" aria-label="Tree pages" hidden></nav><dialog id="letter"><button type="button" class="close" aria-label="Close">×</button><div id="sheet"></div></dialog>';
  $('treeName').textContent=tree.name+'’s tree';
  const days=Math.max(0,Math.ceil((Date.parse('2026-12-25T08:00:00Z')-Date.now())/86400000));
  $('reveal').textContent=tree.released?'Christmas notes are open':days+' days until Christmas';
  $('scene').innerHTML=scene(tree,true);
  const dialog=$('letter'), sheet=$('sheet');
  dialog.querySelector('.close').onclick=()=>dialog.close();
  dialog.onclick=e=>{if(e.target===dialog)dialog.close();};
  const postcard=$('postcard');
  postcard.hidden=false;
  postcard.onclick=()=>{
    if($('panelToggle').getAttribute('aria-expanded')==='true')$('panelToggle').click();
    $('panelToggle').focus();
    showPostcard(dialog,$('scene').querySelector('svg'),tree);
  };
  $('copy').onclick=async()=>{const url=treeUrl({id});try{await navigator.clipboard.writeText(url);status('Tree link copied.');}catch{status(url);}};
  if(tree.pages>1){
    const nav=$('tree-pages');nav.hidden=false;
    nav.innerHTML='<button aria-label="Previous tree page">←</button><span></span><button aria-label="Next tree page">→</button>';
    nav.querySelector('span').textContent='Tree '+tree.page+' / '+tree.pages;
    for(const [i,button] of [...nav.querySelectorAll('button')].entries()){
      const dest=tree.page+(i?1:-1);button.disabled=dest<1||dest>tree.pages;
      button.onclick=async()=>{currentPage=dest;try{await render();}catch(e){status(e.message);}};
    }
  }
  function read(index){
    const card=tree.cards[index];
    const message=card.message??(tree.released?'A private Christmas note.':'Sealed until December 25. Come back on Christmas morning to open this note.');
    sheet.replaceChildren(letter({...card,message}));
    dialog.setAttribute('aria-label',card.kind+' from '+card.name);
    dialog.showModal();
  }
  const openOrnament=e=>{const item=e.target.closest('[data-card]');if(item)read(Number(item.dataset.card));};
  $('scene').onclick=openOrnament;
  $('scene').onkeydown=e=>{
    if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-card]')){e.preventDefault();openOrnament(e);}
  };
  if(tree.owner){
    const edit=document.createElement('button');
    edit.textContent='Style tree';
    $('actions').append(edit);
    edit.onclick=()=>{
      sheet.innerHTML='<form><h2>Style your tree</h2><div class="tree-style-fields"></div><p role="status"></p><button>Save</button></form>';
      const form=sheet.querySelector('form');
      treeStyleFields(form,tree,$('scene'));
      const originalScene=$('scene');
      const discardPreview=()=>{originalScene.innerHTML=scene(tree,true);};
      dialog.addEventListener('close',discardPreview,{once:true});
      dialog.setAttribute('aria-label','Style your tree');dialog.showModal();
      submit(form,async values=>{
        try{await call('customize',{id,...values});}catch(e){form.querySelector('p').textContent=e.message;return;}
        dialog.removeEventListener('close',discardPreview);
        dialog.close();await render();
      });
    };
  }
  if(!tree.owner){
    const compose=document.createElement('button');
    compose.className='primary';compose.textContent=tree.mine?'Edit your ornament':'Hang an ornament';
    $('actions').append(compose);
    compose.onclick=()=>workshop(dialog,tree.mine,signature,async values=>{
      await call('hang',{id,...values});
      if(!tree.mine)currentPage=Number.MAX_SAFE_INTEGER;
      dialog.close();await render();status('Your signed ornament is on the tree.');
    });
  }
  status('');
}
async function start(){
  if(demo){
    const {accounts,demoCall}=await import('../_dev/christmas/preview.js');
    const email=sessionStorage.getItem('winter-actor')||accounts[0].email;
    $('account').hidden=true;
    $('preview').innerHTML='<label>Local preview account<select></select></label>';
    const select=$('preview').querySelector('select');
    for(const person of accounts)select.add(new Option(person.name,person.email));
    select.value=email;select.onchange=()=>{sessionStorage.setItem('winter-actor',select.value);location.reload();};
    signature=schoolName(email);
    call=(action,input)=>demoCall(email,action,input);
    if(!home)await render();
    return;
  }
  const cloud=await import('./data/cloud.js');call=cloud.call;
  $('account').onclick=()=>cloud.toggle().catch(e=>status(e.message));
  let initial=true;
  cloud.watch(async user=>{
    if(!initial){location.reload();return;} initial=false;
    $('account').textContent=user?'Sign out':'Sign in';
    if(!home){
      if(!user){document.querySelector('#panelToggle')?.click();status('Sign in with your Lakeside school account to visit trees.');return;}
      if(!schoolName(user.email)){status('Switch to your Lakeside school account.');return;}
      signature=schoolName(user.email);
      try{await render();}catch(e){status(e.message);}
    }
  });
}
start().catch(()=>status('School sign-in could not connect. Check your connection and reload.'));












