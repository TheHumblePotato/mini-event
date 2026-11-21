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
  function remember(tree,uid,paging,docs){
    cursor=docs.length?{uid,tree:tree.id,total:paging.total,page:paging.page,first:docs[0],last:docs.at(-1)}:null;
    return {paging,docs};
  }
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
    return remember(tree,uid,paging,batch.docs);
  }
  async function branches(tree,uid,page){
    const ornaments=collection(tree,'ornaments');
    const last=page===Number.MAX_SAFE_INTEGER;
    if(page===1||last){
      const pageLimit=last?limitToLast(ornamentsPerTreePage+1):limit(ornamentsPerTreePage+1);
      const batch=await getDocsFromServer(query(ornaments,orderBy('created'),pageLimit));
      // The extra branch tells us whether a count query is necessary.
      if(batch.size<=ornamentsPerTreePage)return remember(tree,uid,treePage(batch.size,page),batch.docs);
      const total=(await getCountFromServer(ornaments)).data().count;
      const paging=treePage(total,page);
      // For a full last page another sender can hang an ornament between the
      // lookahead and the count. Read its actual tail against the new total.
      if(last)return branchPage(tree,uid,paging);
      return remember(tree,uid,paging,batch.docs.slice(0,ornamentsPerTreePage));
    }
    const count=await getCountFromServer(ornaments);
    return branchPage(tree,uid,treePage(count.data().count,page));
  }
  async function visit(tree,uid,page=1){
    const [snapshot,{paging,docs},released]=await Promise.all([
      getDocFromServer(tree),branches(tree,uid,page),christmasMorning()
    ]);
    if(!snapshot.exists())throw Error('Tree not found.');
    const data=snapshot.data(),owner=data.owner===uid;
    const onPage=docs.find(item=>item.id===uid);
    const notes=new Map();
    function note(id){
      if(!notes.has(id))notes.set(id,getDocFromServer(doc(tree,'letters',id)).then(item=>item.data()?.message??null));
      return notes.get(id);
    }
    async function ownCard(){
      const personal=onPage??(paging.pages>1&&!owner?await getDocFromServer(doc(tree,'ornaments',uid)):null);
      return personal?.exists()?{...personal.data(),message:await note(uid)}:null;
    }
    const [mine,cards]=await Promise.all([ownCard(),Promise.all(docs.map(async item=>{
      const card=item.data();
      let message=null;
      if(released&&(owner||card.visibility==='Public')){
        try{message=await note(item.id);}
        catch(error){if(error.code!=='permission-denied')throw error;} // Visibility may change after loading the branches.
      }
      return {...card,message};
    }))]);
    return {...data,owner,released,...paging,cards,mine};
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

