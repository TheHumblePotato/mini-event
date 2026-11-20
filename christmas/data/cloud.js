import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import * as firestore from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {createTreeStore} from './tree-store.js';

const app=initializeApp({apiKey:'AIzaSyARY96nrH2Aio8rOiLkewSXtTS40TZLrAw',authDomain:'nerd-mini-events.firebaseapp.com',projectId:'nerd-mini-events',appId:'1:974357416633:web:e190de60553a685d03e968'});
const auth=getAuth(app), db=firestore.getFirestore(app), provider=new GoogleAuthProvider();
provider.setCustomParameters({hd:'lakesideschool.org',prompt:'select_account'});
export const watch=fn=>onAuthStateChanged(auth,fn);
export const toggle=()=>auth.currentUser ? signOut(auth) : signInWithPopup(auth,provider);
const run=createTreeStore(db,firestore);
export async function call(action,input={}){
  try{return await run(auth.currentUser,action,input);}
  catch(error){
    if(error.code==='permission-denied')throw Error(action==='hang'
      ? 'Could not hang this ornament. Visit a friend’s tree and wait five seconds between saves.'
      : 'Firestore denied access. Use a Lakeside account and check that the Christmas Firestore rules are published.');
    if(error.code==='unavailable')throw Error('Could not reach Firestore. Check your connection and try again.');
    throw error;
  }
}
