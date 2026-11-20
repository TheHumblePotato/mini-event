import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/firestore';
import {createTreeStore} from '../tree-store.js';

const source=await readFile(new URL('../../firestore.rules',import.meta.url),'utf8');
// Use a demo project on loopback exclusively. Exercise both sides of the reveal.
const port=Number(process.env.CHRISTMAS_EMULATOR_PORT||8492);
for(const released of [false,true]){
  const rules=source.replace('timestamp.date(2026,12,25)',released?'timestamp.date(2000,12,25)':'timestamp.date(2099,12,25)');
  const env=await initializeTestEnvironment({
    projectId:'demo-winter-tests',firestore:{host:'127.0.0.1',port,rules}
  });
  try{
    await env.clearFirestore();
    function account(uid,email,verified=true){
      const db=env.authenticatedContext(uid,{email,email_verified:verified,firebase:{sign_in_provider:'google.com',identities:{}}}).firestore();
      const run=createTreeStore(db,sdk);
      return {db,call:(action,input={})=>run({uid,email,emailVerified:verified},action,input)};
    }
    const owner=account('owner','alexs27@lakesideschool.org'),guest=account('guest','alex.smith@lakesideschool.org');
    const reader=account('reader','samj28@lakesideschool.org');
    const choices={species:'Fir',setting:'Courtyard',weather:'Clear',star:'None',visibility:'Private'};
    assert.equal(await owner.call('mine'),null);
    const [id,duplicate]=await Promise.all([owner.call('create',choices),owner.call('create',choices)]);
    assert.equal(id,duplicate);assert.equal(await owner.call('mine'),id);
    assert.deepEqual(await reader.call('gallery'),[]);
    const first=await guest.call('view',{id});
    assert.equal(first.released,released);assert.equal(first.total,0);
    const treePath='winterEvents/christmas2026/trees/'+id;
    const direct=(actor,path)=>sdk.getDocFromServer(sdk.doc(actor.db,path));
    await assertFails(direct(account('outside','x@example.org'),treePath));
    await assertFails(direct(account('unverified','samj29@lakesideschool.org',false),treePath));
    await assertFails(reader.call('customize',{id,...choices,visibility:'Public'}));
    await assertFails(sdk.updateDoc(sdk.doc(owner.db,treePath),{name:'Someone Else'}));
    await owner.call('customize',{id,...choices,visibility:'Public'});
    const card={id,kind:'Bell',color:'Gold',paper:'Botanical',visibility:'Private',message:'Merry Christmas!'};
    await guest.call('hang',card);
    assert.equal((await owner.call('gallery'))[0].count,1);
    assert.equal((await guest.call('view',{id})).mine.message,card.message);
    const owned=await owner.call('view',{id});
    assert.equal(owned.cards[0].name,'Alex Smith');
    assert.equal(owned.cards[0].message,released?card.message:null);
    const note=treePath+'/letters/guest';
    await assertFails(direct(reader,note));
    if(!released)await assertFails(direct(owner,note));
    await assertFails(guest.call('hang',{...card,message:'Too soon'}));
    await env.withSecurityRulesDisabled(async ctx=>{
      await sdk.updateDoc(sdk.doc(ctx.firestore(),'winterEvents/christmas2026/postmarks/guest'),{at:sdk.Timestamp.fromMillis(0)});
    });
    await guest.call('hang',{...card,visibility:'Public'});
    const publicView=await reader.call('view',{id});
    assert.equal(publicView.total,1);assert.equal(publicView.cards[0].message,released?card.message:null);
    if(!released)await assertFails(direct(reader,note));
    if(!released){
      await env.withSecurityRulesDisabled(async ctx=>{
        const db=ctx.firestore(),batch=sdk.writeBatch(db);
        for(let i=0;i<36;i++)batch.set(sdk.doc(db,treePath+'/ornaments/fixture-'+i),{
          name:'Guest '+i,kind:'Bell',color:'Gold',paper:'Botanical',visibility:'Private',created:sdk.Timestamp.fromMillis(i)
        });
        await batch.commit();
      });
      const second=await guest.call('view',{id,page:2});
      assert.equal(second.cards.length,12);assert.equal(second.mine.message,card.message);
      assert.equal((await guest.call('view',{id,page:3})).cards[0].name,'Guest 24');
      assert.equal((await guest.call('view',{id,page:2})).cards[0].name,'Guest 12');
      assert.equal((await guest.call('view',{id,page:4})).cards[0].name,'Alex Smith');
    }
    console.log('Passed Firestore school-account flow '+(released?'after':'before')+' the reveal.');
  }finally{await env.cleanup();}
}

