import {letter} from './letter.js';
import {options} from '../data/model.js';
import {ornamentIcon,palette} from '../scene/art.js';

export function workshop(dialog,card,name,onSave){
  const sheet=dialog.querySelector('#sheet');
  const draft={kind:'Bell',color:'Gold',paper:'Parchment',visibility:options.visibility[0],message:'',...card,name};
  const titles=['Pick a keepsake','Write your Christmas note','Hang your ornament'];
  let step=0;
  function draw(){
    sheet.innerHTML='<form class="workshop"><small></small><h2 tabindex="-1"></h2><div class="workbench"></div><div class="tools"></div><p role="status"></p><footer></footer></form>';
    const form=sheet.firstChild, tools=form.querySelector('.tools'), footer=form.querySelector('footer');
    form.querySelector('small').textContent='Ornament workshop   /   '+(step+1)+' of 3';
    form.querySelector('h2').textContent=titles[step];
    function sample(){form.querySelector('.workbench').innerHTML=ornamentIcon(draft.kind,draft.color);}
    function choices(key,title,illustrated=false){
      const group=document.createElement('fieldset');
      const legend=document.createElement('legend');legend.textContent=title;group.append(legend);
      for(const value of options[key]){
        const label=document.createElement('label'),radio=document.createElement('input');
        radio.type='radio';radio.name=key;radio.value=value;radio.checked=draft[key]===value;
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
        search.oninput=()=>{const query=search.value.trim().toLowerCase();for(const item of group.querySelectorAll('label'))item.hidden=!item.textContent.toLowerCase().includes(query);};
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
      for(const b of footer.children)b.disabled=true;
      try{await onSave(draft);}catch(error){form.querySelector('[role=status]').textContent=error.message;for(const b of footer.children)b.disabled=false;}
    };
    (step===1?tools.querySelector('textarea'):form.querySelector('h2')).focus({preventScroll:true});
  }
  dialog.setAttribute('aria-label','Ornament workshop');dialog.showModal();draw();
}





