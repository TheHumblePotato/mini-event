import {schoolName,treeSettings,makeCard,treePage,ornamentsPerTreePage} from './model.js';

export function createTreeStore(db,sdk){
  const {doc,collection,where,query,orderBy,limit,limitToLast,startAfter,endBefore,getDocFromServer,getDocsFromServer,getCountFromServer,runTransaction,serverTimestamp,updateDoc}=sdk;
  const event=doc(db,'winterEvents','christmas2026');
  const trees=collection(event,'trees');

  async function gallery(){
    const result=await getDocsFromServer(query(trees,where('visibility','==','Public')));
    return Promise.all(result.docs.map(async snapshot=>{
      const {name,species,setting,star}=snapshot.data();
      const count=await getCountFromServer(collection(snapshot.ref,'ornaments'));
      return {id:snapshot.id,name,species,setting,star,count:count.data().count};
    }));
  }

  // The rule on this read uses Firestore request.time. No clock document is needed.
  async function christmasMorning(){
    try{await getDocFromServer(doc(event,'calendar','reveal'));return true;}
    catch(error){if(error.code==='permission-denied')return false;throw error;}
  }
  // Keep one page of cursors so forward and back need only a 12-ornament read.
  let cursor=null;
  async function branchPage(tree,uid,paging){
    const ordered=query(collection(tree,'ornaments'),orderBy('created'));
    if(cursor?.total!==paging.total)cursor=null;
    let pageQuery;
    if(paging.page===1)pageQuery=query(ordered,limit(ornamentsPerTreePage));
    else if(paging.page===paging.pages)pageQuery=query(ordered,limitToLast(paging.total-paging.start));
    else if(cursor?.tree===tree.id&&cursor.uid===uid&&cursor.page===paging.page-1)
      pageQuery=query(ordered,startAfter(cursor.last),limit(ornamentsPerTreePage));
    else if(cursor?.tree===tree.id&&cursor.uid===uid&&cursor.page===paging.page+1)
      pageQuery=query(ordered,endBefore(cursor.first),limitToLast(ornamentsPerTreePage));
    else {
      const skipped=await getDocsFromServer(query(ordered,limit(paging.start)));
      pageQuery=query(ordered,startAfter(skipped.docs.at(-1)),limit(ornamentsPerTreePage));
    }
    const batch=await getDocsFromServer(pageQuery);
    cursor=batch.size?{uid,tree:tree.id,total:paging.total,page:paging.page,first:batch.docs[0],last:batch.docs.at(-1)}:null;
    return batch.docs;
  }
  async function visit(tree,uid,page){
    const [snapshot,count,released]=await Promise.all([
      getDocFromServer(tree),getCountFromServer(collection(tree,'ornaments')),christmasMorning()
    ]);
    if(!snapshot.exists())throw Error('Tree not found.');
    const data=snapshot.data(),owner=data.owner===uid;
    const paging=treePage(count.data().count,page);
    const [batch,personal]=await Promise.all([
      branchPage(tree,uid,paging),getDocFromServer(doc(tree,'ornaments',uid))
    ]);
    const note=id=>getDocFromServer(doc(tree,'letters',id)).then(item=>item.data()?.message??null);
    const myText=personal.exists()?await note(uid):null;
    const cards=await Promise.all(batch.map(async item=>{
      const card=item.data();
      let message=null;
      if(released&&(owner||card.visibility==='Public')){
        try{message=item.id===uid?myText:await note(item.id);}
        catch(error){if(error.code!=='permission-denied')throw error;} // Visibility may change after loading the branches.
      }
      return {...card,message};
    }));
    return {...data,owner,released,...paging,cards,mine:personal.exists()?{...personal.data(),message:myText}:null};
  }
  async function run(user,action,input){
    const name=schoolName(user?.email);
    if(!user?.emailVerified||!name)throw Error('Sign in with your Lakeside school Google account.');
    const uid=user.uid,member=doc(event,'members',uid);
    if(action==='mine')return (await getDocFromServer(member)).data()?.tree??null;
    if(action==='gallery')return gallery();
    if(action==='create'){
      const choices=treeSettings(input),tree=doc(trees,crypto.randomUUID());
      return runTransaction(db,async tx=>{
        const current=await tx.get(member);
        if(current.exists())return current.data().tree;
        tx.set(member,{tree:tree.id});
        tx.set(tree,{...choices,owner:uid,name});return tree.id;
      });
    }
    if(typeof input.id!=='string'||!/^[a-f0-9-]{36}$/.test(input.id))throw Error('Invalid tree link.');
    const tree=doc(trees,input.id);
    if(action==='view')return visit(tree,uid,input.page);
    if(action==='customize'){await updateDoc(tree,{...treeSettings(input),name});return true;}
    if(action!=='hang')throw Error('Unknown tree action.');
    const {message,...appearance}=makeCard(input,name);
    const ornament=doc(tree,'ornaments',uid),letter=doc(tree,'letters',uid),clock=doc(event,'postmarks',uid);
    await runTransaction(db,async tx=>{
      const previous=await tx.get(ornament);
      const now=serverTimestamp();
      tx.set(clock,{tree:tree.id,at:now});
      tx.set(ornament,{...appearance,created:previous.data()?.created??now,updated:now});
      tx.set(letter,{message,updated:now});
    });
    return true;
  }
  return run;
}

