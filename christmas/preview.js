// Browser-only sample accounts and data, isolated from school sign-in and cloud storage.
import {schoolName,treeSettings,makeCard,view,treePage,ornamentsPerTreePage} from './model.js';
const people=['alexs27@lakesideschool.org','alex.smith@lakesideschool.org','samj28@lakesideschool.org'];
export const accounts=people.map(email=>({email,name:schoolName(email)}));
export function demoCall(email,action,input={}) {
  if(!people.includes(email)) throw Error('Choose a preview account.');
  const key='christmas-demo-v1', trees=JSON.parse(localStorage.getItem(key)||'{}');
  const name=schoolName(email);
  const own=Object.keys(trees).find(id=>trees[id].scene.owner===email);
  if(action==='mine') return own || null;
  if(action==='gallery') return Object.entries(trees).filter(([,t])=>t.scene.visibility==='Public').map(([id,t])=>({id,name:t.scene.name,species:t.scene.species,setting:t.scene.setting,star:t.scene.star,count:Object.keys(t.cards).length}));
  if(action==='create'){
    if(own) return own;
    const id=crypto.randomUUID();
    trees[id]={scene:{...treeSettings(input),name,owner:email},cards:{}};
    localStorage.setItem(key,JSON.stringify(trees));
    return id;
  }
  const tree=trees[input.id];
  if(!tree) throw Error('Tree not found in this preview.');
  if(action==='customize'){
    if(tree.scene.owner!==email) throw Error('Only the owner can change this tree.');
    Object.assign(tree.scene,treeSettings(input),{name});
    localStorage.setItem(key,JSON.stringify(trees));
    return true;
  }
  if(action==='view'){
    const entries=Object.entries(tree.cards),paging=treePage(entries.length,input.page);
    return {...view(tree.scene,entries.slice(paging.start,paging.start+ornamentsPerTreePage),email),...paging,mine:tree.cards[email]??null};
  }
  if(action!=='hang'||tree.scene.owner===email) throw Error('Visit a friend to leave an ornament.');
  tree.cards[email]={...makeCard(input,name),branch:tree.cards[email]?.branch??'Anywhere'};
  localStorage.setItem(key,JSON.stringify(trees));
  return true;
}




