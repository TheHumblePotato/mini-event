import {letter} from './letter.js';
import {options} from '../data/model.js';
import {ornamentIcon,palette} from '../scene/art.js';

const featuredKinds=['Tiny violin','Gift','Ribbon'];
const fields=['kind','color','paper','visibility','message'];
const tabDrafts=new Map();

export function workshop(dialog,card,name,draftKey,onSave){
  const sheet=dialog.querySelector('#sheet');
  const original={kind:'Bell',color:'Gold',paper:'Parchment',visibility:options.visibility[0],message:'',...card,name};
  const draft={...original};
  let saved=tabDrafts.get(draftKey);
  try{saved=saved??JSON.parse(sessionStorage.getItem(draftKey));}catch{}
  for(const key of fields){
    if(key==='message'?typeof saved?.[key]==='string':options[key].includes(saved?.[key]))draft[key]=saved[key];
  }
  const titles=['Pick a keepsake','Write your Christmas note','Hang your ornament'];
  let step=saved?.step===1||saved?.step===2?saved.step:0,saving=false;
  function keepDraft(){
    const entry={step,...Object.fromEntries(fields.map(key=>[key,draft[key]]))};
    tabDrafts.set(draftKey,entry);
    try{sessionStorage.setItem(draftKey,JSON.stringify(entry));}catch{}
  }
  function clearDraft(){
    tabDrafts.delete(draftKey);
    try{sessionStorage.removeItem(draftKey);}catch{}
  }
  async function finish(){
    if(saving)return;
    const changed=fields.some(key=>draft[key]!==original[key]);
    if(!changed||!draft.message.trim()){
      if(!draft.message.trim()&&(changed||step)){keepDraft();dialog.close('draft');}
      else{clearDraft();dialog.close();}
      return;
    }
    saving=true;
    const form=sheet.querySelector('form'),notice=form.querySelector('[role=status]');
    form.inert=true;notice.textContent='Saving ornament…';
    try{await onSave(draft);clearDraft();}
    catch(error){keepDraft();notice.textContent=error.message;notice.scrollIntoView({block:'nearest'});}
    finally{saving=false;form.inert=false;}
  }
  function draw(){
    sheet.innerHTML='<form class="workshop"><small></small><h2 tabindex="-1"></h2><div class="workbench"></div><div class="tools"></div><p role="status"></p><footer></footer></form>';
    const form=sheet.firstChild, tools=form.querySelector('.tools'), footer=form.querySelector('footer');
    form.querySelector('small').textContent='Ornament workshop   /   '+(step+1)+' of 3';
    form.querySelector('h2').textContent=titles[step];
    function sample(){
      const finish=palette[draft.color];
      const [r,g,b]=finish.slice(1).match(/../g).map(channel=>parseInt(channel,16));
      form.classList.toggle('deep-ink',.21*r+.72*g+.07*b<84);
      form.querySelector('.workbench').innerHTML=ornamentIcon(draft.kind,draft.color);
    }
    function choices(key,title,illustrated=false){
      const group=document.createElement('fieldset');
      const legend=document.createElement('legend');legend.textContent=title;group.append(legend);
      const values=illustrated?[...featuredKinds,...options.kind.filter(kind=>!featuredKinds.includes(kind))]:options[key];
      group.dataset.choices=key;
      for(const value of values){
        const label=document.createElement('label'),radio=document.createElement('input');
        radio.type='radio';radio.name=key;radio.value=value;radio.checked=draft[key]===value;
        if(illustrated&&featuredKinds.includes(value))label.className='featured-ornament';
        const face=document.createElement('span');
        if(key==='paper')face.dataset.stock=value;
        if(key==='color'){face.dataset.finish=value;face.style.setProperty('--finish',palette[value]);}
        if(illustrated)face.innerHTML=ornamentIcon(value,draft.color);
        face.append(value);label.append(radio,face);group.append(label);
        radio.onchange=()=>{draft[key]=value;sample();
          if(key==='paper')tools.querySelector('.stationery').dataset.paper=value;
          if(key==='color')for(const label of tools.querySelectorAll('input[name="kind"]'))label.nextSibling.querySelector('svg').outerHTML=ornamentIcon(label.value,value);
        };
      }
      if(illustrated){
        const search=document.createElement('input');search.type='search';search.placeholder='Find an ornament';search.setAttribute('aria-label','Find an ornament');
        search.className='keepsake-search';
        search.oninput=()=>{const query=search.value.trim().toLowerCase();group.classList.toggle('filtered',!!query);for(const item of group.querySelectorAll('label'))item.hidden=!item.textContent.toLowerCase().includes(query);};
        search.onkeydown=e=>{if(e.key==='Enter')e.preventDefault();};
        tools.append(search);
      }
      tools.append(group);
    }
    sample();
    if(step===0){choices('kind','Decoration',true);choices('color','Finish');}
    if(step===1){
      tools.append(letter(draft,true));form.querySelector('.workbench').hidden=true;
      choices('paper','Letter paper');
      choices('visibility','On Christmas, who can read it?');
      const hint=document.createElement('p');hint.className='dismiss-hint';
      hint.textContent=card?'Closing saves your edits.':'Closing with a written note hangs your signed ornament.';
      form.querySelector('h2').after(hint);
    }
    if(step===2){
      tools.append(letter(draft));form.querySelector('.workbench').hidden=true;

      const info=document.createElement('p');info.textContent=(draft.visibility==='Private'?'For the tree owner':'For all tree visitors')+' · Signed with your school name';tools.append(info);
    }
    if(step){const back=document.createElement('button');back.type='button';back.textContent='Back';back.onclick=()=>{step--;draw();};footer.append(back);}
    const next=document.createElement('button');next.className='primary';next.textContent=step===2?'Hang ornament':'Continue';footer.append(next);
    form.onsubmit=async e=>{
      e.preventDefault();
      if(step===1&&!draft.message.trim()){
        const text=tools.querySelector('textarea');text.setCustomValidity('Write a note before continuing.');text.reportValidity();return;
      }
      if(step<2){step++;draw();return;}
      await finish();
    };
    (step===1?tools.querySelector('textarea'):form.querySelector('h2')).focus({preventScroll:true});
  }
  dialog.setAttribute('aria-label','Ornament workshop');dialog.showModal();draw();
  return finish;
}





