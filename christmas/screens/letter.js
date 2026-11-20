import {ornamentIcon} from '../scene/art.js';

// Find page boundaries without dropping spaces, line breaks or halves of a surrogate pair.
function pageLength(text,fits){
  if(!text)return 0;
  let low=0,high=Math.min(2048,text.length);
  while(fits(text.slice(0,high))){
    if(high===text.length)return high;
    low=high;high=Math.min(text.length,high*2);
  }
  while(high-low>1){
    const middle=Math.floor((low+high)/2);
    if(fits(text.slice(0,middle)))low=middle;else high=middle;
  }
  const boundary=text.slice(Math.max(0,low-110),low).match(/\s[^\s]*$/u);
  if(boundary)low-=boundary[0].length-1;
  if(low && /[\uD800-\uDBFF]/.test(text[low-1]))low--;
  return low||String.fromCodePoint(text.codePointAt(0)).length;
}
function layout(sections,fits){
  const pages=[];
  sections.forEach((section,part)=>{
    let start=0;
    do{
      const end=start+pageLength(section.slice(start),fits);
      pages.push({part,start,end});
      start=end;
    }while(start<section.length);
  });
  return pages;
}
export function letterPages(message,fits=text=>text.length<=1900){
  const sections=message.split('\f');
  return layout(sections,fits).map(p=>sections[p.part].slice(p.start,p.end));
}
export function letter(card,editable=false){
  const sections=card.message.split('\f');
  const book=document.createElement('div');book.className='letter-book';
  book.innerHTML='<article class="stationery"><header><span>Christmas post</span><time datetime="2026-12-25">25 Dec 2026</time></header><div class="letter-seal">'+ornamentIcon(card.kind,card.color)+'</div><footer></footer></article><nav class="page-turns" aria-label="Letter pages"><button type="button" data-prev>← Previous</button><span aria-live="polite"></span><button type="button" data-next>Next →</button></nav>';
  const page=book.firstChild,nav=book.lastChild;
  page.dataset.paper=card.paper||'Parchment';page.lastChild.textContent='From '+card.name;
  const text=document.createElement(editable?'textarea':'div');text.className='letter-text';
  const probe=document.createElement('div');probe.className='letter-measure';probe.setAttribute('aria-hidden','true');
  page.insertBefore(text,page.lastChild);book.append(probe);
  let pages=layout(sections,s=>s.length<=1900),index=0,lastWidth=0,lastHeight=0;
  const prev=nav.querySelector('[data-prev]'),next=nav.querySelector('[data-next]');
  let remove;
  function show(){
    const p=pages[index],value=sections[p.part].slice(p.start,p.end);
    if(editable){
      if(text.value!==value)text.value=value;
      text.setAttribute('aria-label','Your Christmas note, page '+(index+1));
      remove.hidden=sections.length===1||!!sections[p.part];
    }else text.textContent=value;
    prev.disabled=!index;next.disabled=index===pages.length-1;
    nav.querySelector('span').textContent='Page '+(index+1)+' of '+pages.length;
    nav.hidden=!editable&&pages.length===1;text.scrollTop=0;
  }
  function fit(part,offset){
    const w=text.clientWidth,h=text.clientHeight;
    if(w&&h){
      lastWidth=w;lastHeight=h;
      probe.style.width=w+'px';probe.style.font=getComputedStyle(text).font;
      pages=layout(sections,s=>{
        probe.textContent=s+'\u200b';return probe.offsetHeight<=h-2;
      });
    }else pages=layout(sections,s=>s.length<=1900);
    index=pages.findIndex(p=>p.part===part && offset>=p.start && (offset<p.end||offset===sections[part].length&&offset===p.end));
    if(index<0)index=0;
    show();
  }
  prev.onclick=()=>{if(index>0){index--;show();}};
  next.onclick=()=>{if(index+1<pages.length){index++;show();}};
  if(editable){
    text.placeholder='Dear friend, …';
    text.oninput=event=>{
      if(event.isComposing)return;
      const p=pages[index],part=sections[p.part],cursor=p.start+text.selectionEnd;
      sections[p.part]=part.slice(0,p.start)+text.value+part.slice(p.end);
      card.message=sections.join('\f');text.setCustomValidity('');
      fit(p.part,cursor);
      const local=cursor-pages[index].start;text.setSelectionRange(local,local);
    };
    const add=document.createElement('button');add.type='button';add.textContent='+ Add page';nav.append(add);
    add.onclick=()=>{
      const p=pages[index],tail=sections[p.part].slice(p.end);
      sections[p.part]=sections[p.part].slice(0,p.end);sections.splice(p.part+1,0,tail);
      card.message=sections.join('\f');fit(p.part+1,0);text.focus();
    };
    remove=document.createElement('button');remove.type='button';remove.textContent='Remove blank page';nav.append(remove);
    remove.onclick=()=>{
      const part=pages[index].part;if(sections[part]||sections.length<=1)return;
      sections.splice(part,1);card.message=sections.join('\f');fit(Math.min(part,sections.length-1),0);text.focus();
    };
  }
  show();
  const observer=new ResizeObserver(()=>{
    if(!book.isConnected){observer.disconnect();return;}
    if(text.clientWidth===lastWidth && text.clientHeight===lastHeight)return;
    const p=pages[index];fit(p.part,p.start);
  });
  observer.observe(text);return book;
}
