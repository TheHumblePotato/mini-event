import test from 'node:test';
import assert from 'node:assert/strict';
import {demoCall,accounts} from '../preview.js';
import {view,schoolName} from '../../../christmas/data/model.js';
import {scene} from '../../../christmas/scene/art.js';
test('friends plant, share, sign and edit one ornament',()=>{
  const storage=new Map();
  Object.defineProperty(globalThis,'localStorage',{value:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},configurable:true});
  const [owner,visitor,third]=accounts.map(a=>a.email);
  const choices={species:'Fir',setting:'Courtyard',weather:'Snowfall',star:'None',visibility:'Private'};
  const id=demoCall(owner,'create',choices);
  assert.equal(demoCall(owner,'create',choices),id);
  assert.deepEqual(demoCall(visitor,'gallery'),[]);
  assert.equal(demoCall(visitor,'mine'),null);
  assert.doesNotMatch(scene(demoCall(visitor,'view',{id})),/data-card=/);
  const card={id,kind:'Bell',color:'Gold',visibility:'Private',message:'Happy holidays!',name:'Fake'};
  assert.throws(()=>demoCall(owner,'hang',card));
  demoCall(visitor,'hang',card);
  demoCall(visitor,'hang',{...card,message:'Edited note'});
  const result=demoCall(owner,'view',{id});
  assert.equal(result.cards.length,1);
  assert.equal(result.cards[0].name,'Alex Smith');
  assert.deepEqual(scene(result).match(/data-card=/g),['data-card=']);
  assert.equal(demoCall(visitor,'view',{id}).mine.message,'Edited note');
  assert.equal(demoCall(third,'view',{id}).mine,null);
  assert.equal(schoolName(owner),'Alex S.');
  assert.equal(schoolName('alexs27@lakesideschool.com'),null);
});
test('Christmas reveal respects visibility and the exact Pacific boundary',()=>{
  const tree={owner:'owner'};
  const entries=[['sender',{message:'Secret',visibility:'Private'}],['friend',{message:'Hello',visibility:'Public'}]];
  const midnight=Date.parse('2026-12-25T08:00:00Z');
  const messages=(uid,time)=>view(tree,entries,uid,time).cards.map(c=>c.message);
  assert.deepEqual(messages('owner',midnight-1),[null,null]);
  assert.deepEqual(messages('owner',midnight),['Secret','Hello']);
  assert.deepEqual(messages('visitor',midnight),[null,'Hello']);
});

test('only the designated student address gets the alternate signature',()=>{
  assert.equal(schoolName('CarolynJ30@lakesideschool.org'),'Seek J');
  assert.equal(schoolName('carolynj31@lakesideschool.org'),'Carolyn J.');
  assert.equal(schoolName('carolynj30@lakesideschool.com'),null);
});

test('published rules and console fragment accept the exact playable catalogs',async()=>{
  const {options}=await import('../../../christmas/data/model.js');
  const {readFile}=await import('node:fs/promises');
  for(const file of ['../../../firestore.rules','../firestore.rules.fragment']){
    const rules=await readFile(new URL(file,import.meta.url),'utf8');
    for(const [key,values] of Object.entries(options)){
      const list=rules.match(new RegExp('d\\.'+key+' in \\[([^\\]]+)\\]'));
      assert.ok(list,key+' missing from '+file);
      assert.deepEqual([...list[1].matchAll(/'([^']+)'/g)].map(m=>m[1]).sort(),[...values].sort());
    }
  }
});

test('long letters preserve text, manual page breaks and stationery through the reveal',async()=>{
  const {makeCard}=await import('../../../christmas/data/model.js');
  const {letterPages}=await import('../../../christmas/screens/letter.js');
  const first='A snowy evening. '.repeat(900)+'🎄';
  const message=first+'\fSecond page\nWith love.';
  const card=makeCard({kind:'Snowman',color:'Ice blue',paper:'Botanical',visibility:'Private',message},'Alex S.');
  assert.equal(card.message,message);
  assert.equal(letterPages(first).join(''),first);
  assert.ok(letterPages(first).length>1);
  assert.equal(letterPages(message).at(-1),'Second page\nWith love.');
  const tree={owner:'teacher'},entries=[['student',card]];
  const midnight=Date.parse('2026-12-25T08:00:00Z');
  assert.equal(view(tree,entries,'teacher',midnight-1).cards[0].message,null);
  assert.equal(view(tree,entries,'teacher',midnight).cards[0].message,message);
  assert.equal(view(tree,entries,'teacher',midnight).cards[0].paper,'Botanical');
  assert.equal(view(tree,entries,'stranger',midnight).cards[0].message,null);
});

test('a thirteenth ornament gets a new tree page and edits keep gallery counts stable',()=>{
  const store=new Map();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}});
  const [owner,visitor]=accounts.map(p=>p.email);
  const id=demoCall(owner,'create',{species:'Fir',setting:'Harbor lights',weather:'Lake mist',star:'Glass spire',visibility:'Public'});
  const saved=JSON.parse(store.get('christmas-demo-v1'));
  const sample={kind:'Bell',color:'Gold',visibility:'Private',message:'A private note',name:'Guest'};
  for(let i=0;i<12;i++)saved[id].cards['fixture-'+i]={...sample,name:'Guest '+i};
  store.set('christmas-demo-v1',JSON.stringify(saved));
  let page=demoCall(owner,'view',{id});
  assert.equal(page.pages,1);
  assert.equal(page.cards.length,12);
  demoCall(visitor,'hang',{...sample,id});
  page=demoCall(owner,'view',{id,page:2});
  assert.equal(page.pages,2);
  assert.equal(page.cards.length,1);
  assert.equal(page.cards[0].name,'Alex Smith');
  assert.equal(demoCall(visitor,'view',{id,page:1}).mine.message,sample.message);
  demoCall(visitor,'hang',{...sample,id,message:'Edited'});
  assert.equal(demoCall(owner,'gallery')[0].count,13);
  assert.equal(demoCall(owner,'view',{id,page:88}).page,2);
  assert.equal(demoCall(owner,'view',{id,page:2}).cards[0].name,'Alex Smith');
});

test('letter layout never exceeds its measured fit or splits surrogate pairs',async()=>{
  const {letterPages}=await import('../../../christmas/screens/letter.js');
  const section='x'.repeat(400)+'👩🏽‍🎨'.repeat(100)+'\n'.repeat(80)+'winter '.repeat(300);
  const pages=letterPages(section+'\fLast leaf',s=>s.length<=95);
  assert.equal(pages.pop(),'Last leaf');
  assert.equal(pages.join(''),section);
  for(const page of pages){
    assert.ok(page.length<=95);
    assert.doesNotMatch(page,/[\uD800-\uDBFF]$/);
  }
});


test('every catalog selection has artwork and passes the shared validators',async()=>{
  const {options,treeSettings,makeCard}=await import('../../../christmas/data/model.js');
  const {ornamentIcon,palette}=await import('../../../christmas/scene/art.js');
  assert.equal(new Set(options.color.map(color=>palette[color])).size,options.color.length);
  for(const setting of options.setting)for(const species of options.species){
    const choices=treeSettings({setting,species,weather:'Ice halo',star:'Compass rose',visibility:'Private'});
    assert.doesNotMatch(scene(choices,true),/undefined|NaN/);
  }
  for(const kind of options.kind)for(const color of options.color){
    const card=makeCard({kind,color,visibility:'Private',paper:'Music manuscript',message:'Snow day'},'Alex S.');
    assert.doesNotMatch(ornamentIcon(card.kind,card.color),/undefined/);
  }
});

test('larch and stone pine keep all twelve hanging points on their illustrated branches',async()=>{
  const {larchSpurs,stonePineBoughs}=await import('../../../christmas/scene/ink-trees.js');
  const cards=Array.from({length:12},()=>({kind:'Thread spool',color:'Lampblack'}));
  for(const [species,branches] of [['European larch',larchSpurs],['Stone pine',stonePineBoughs]]){
    const tree={species,setting:'Heron marsh',star:'Tin swallow',weather:'Hoarfrost'};
    assert.doesNotMatch(scene(tree,true),/class="hanging"/);
    const rendered=scene({...tree,cards},true);
    const placements=[...rendered.matchAll(/class="hanging"[^>]* transform="translate\(([-\d.]+) ([-\d.]+)\)"/g)];
    assert.deepEqual(placements.map(([,x,y])=>[Number(x)-200,Number(y)-12]),branches);
  }
});
