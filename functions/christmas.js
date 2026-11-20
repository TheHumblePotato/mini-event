import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {getFirestore} from 'firebase-admin/firestore';
import {randomUUID} from 'node:crypto';
import {schoolName,treeSettings,makeCard,view,treePage,ornamentsPerTreePage} from './christmas-model.js';

export const christmas2026 = onCall({maxInstances:5},async request => {
  const token = request.auth?.token;
  const name = schoolName(token?.email);
  if (!name || !token.email_verified || token.firebase?.sign_in_provider !== 'google.com')
    throw new HttpsError('permission-denied','Use your Lakeside school Google account.');
  const uid=request.auth.uid, db=getFirestore();
  const trees=db.collection('christmas2026Trees'), member=db.collection('christmas2026Members').doc(uid);
  const input=request.data || {};
  switch(input.action) {
    case 'mine': return (await member.get()).get('tree') || null;
    case 'gallery': {
      const publicTrees=await trees.where('visibility','==','Public').get();
      return Promise.all(publicTrees.docs.map(async doc=>({
        id:doc.id,name:doc.get('name'),species:doc.get('species'),setting:doc.get('setting'),star:doc.get('star'),
        count:(await doc.ref.collection('cards').count().get()).data().count
      })));
    }
    case 'create': {
      let choices;
      try { choices=treeSettings(input); } catch(e) {throw new HttpsError('invalid-argument',e.message);}
      return db.runTransaction(async tx=>{
        const existing=(await tx.get(member)).get('tree');
        if(existing) return existing;
        const tree=trees.doc(randomUUID());
        tx.create(tree,{...choices,owner:uid,name});
        tx.set(member,{tree:tree.id},{merge:true});
        return tree.id;
      });
    }
  }
  if(typeof input.id !== 'string' || !/^[a-f0-9-]{36}$/.test(input.id)) throw new HttpsError('invalid-argument','Invalid tree link.');
  const ref=trees.doc(input.id), tree=(await ref.get()).data();
  if(!tree) throw new HttpsError('not-found','Tree not found.');
  if(input.action==='customize'){
    if(tree.owner!==uid)throw new HttpsError('permission-denied','Only the owner can change this tree.');
    let choices;
    try{choices=treeSettings(input);}catch(e){throw new HttpsError('invalid-argument',e.message);}
    await ref.update(choices);
    return true;
  }
  const cards=ref.collection('cards');
  if(input.action==='view'){
    const total=(await cards.count().get()).data().count;
    const paging=treePage(total,input.page);
    const [batch,personal]=await Promise.all([
      cards.orderBy('created').offset(paging.start).limit(ornamentsPerTreePage).get(),
      cards.doc(uid).get()
    ]);
    const result=view(tree,batch.docs.map(doc=>[doc.id,doc.data()]),uid);
    return {...result,...paging,mine:personal.data()??null};
  }
  if(input.action!=='hang' || tree.owner===uid) throw new HttpsError('permission-denied','Visit a friend to leave an ornament.');
  let card;
  try {card=makeCard(input,name);} catch(e){throw new HttpsError('invalid-argument',e.message);}
  await db.runTransaction(async tx=>{
    const profile=await tx.get(member), dest=cards.doc(uid), old=await tx.get(dest), now=Date.now();
    if(now-(profile.get('lastWrite')||0)<5000) throw new HttpsError('resource-exhausted','Wait five seconds before saving again.');
    tx.set(dest,{...card,branch:old.get('branch')??'Anywhere',created:old.get('created')??now});
    tx.set(member,{lastWrite:now},{merge:true});
  });
  return true;
});




