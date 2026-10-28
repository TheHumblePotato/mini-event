import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {transition} from './shared-logic.js';
initializeApp();
const db=getFirestore();
export const halloween2026Advance=onCall({region:'us-central1',maxInstances:5},async request=>{
 if(!request.auth)throw new HttpsError('unauthenticated','Sign in to continue the investigation.');
 const uid=request.auth.uid,{action,payload={}}=request.data||{};
 if(typeof action!=='string'||JSON.stringify(payload).length>20000)throw new HttpsError('invalid-argument','Invalid investigation request.');
 const ref=db.collection('halloween2026Ledger').doc(uid);
 if(action==='status'){const snap=await ref.get();return snap.exists()?{stage:snap.data().stage||0,endings:snap.data().endings||[]}:{stage:0,endings:[]}}
 const admin=request.auth.token.admin===true||request.auth.token.halloween2026Admin===true;
 const released=Date.now()>=Date.parse('2026-10-31T00:00:00-07:00')||admin;
 return db.runTransaction(async tx=>{const snap=await tx.get(ref);const current=snap.exists()?snap.data():{stage:0,endings:[]};let next;try{next=transition(current,action,payload,{released})}catch(e){throw new HttpsError('failed-precondition',e.message)}tx.set(ref,{...next,updatedAt:FieldValue.serverTimestamp()},{merge:true});return next});
});
