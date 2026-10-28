import {state,save,merge} from './state.js';
// Same public web-app configuration as Halloween 2024. No admin credentials here.
export const firebaseConfig={apiKey:'AIzaSyARY96nrH2Aio8rOiLkewSXtTS40TZLrAw',authDomain:'nerd-mini-events.firebaseapp.com',projectId:'nerd-mini-events',storageBucket:'nerd-mini-events.firebasestorage.app',messagingSenderId:'974357416633',appId:'1:974357416633:web:e190de60553a685d03e968'};
let sdk,auth,db,user=null,timer,saving=false,dirty=false,loading=false;
export let isAdmin=false;
const status=s=>{document.querySelector('#sync-status').textContent=s};
export async function initFirebase(options={}){
 try{
  const [app,a,f,fn]=await Promise.all(['firebase-app','firebase-auth','firebase-firestore','firebase-functions'].map(n=>import(`https://www.gstatic.com/firebasejs/12.4.0/${n}.js`)));
  sdk={...a,...f,...fn};const instance=app.initializeApp(firebaseConfig);auth=a.getAuth(instance);db=f.getFirestore(instance);sdk.functions=fn.getFunctions(instance,'us-central1');
  a.onAuthStateChanged(auth,async current=>{user=current;isAdmin=false;if(user){try{const claims=(await a.getIdTokenResult(user)).claims;isAdmin=claims.admin===true||claims.halloween2026Admin===true}catch{}}if(!user){status('Saved on this device');window.dispatchEvent(new CustomEvent('accountchange',{detail:user}));return}loading=true;try{const localStage=state.stage;const snap=await f.getDoc(f.doc(db,'halloween2026Players',user.uid));if(snap.exists())Object.assign(state,merge(state,snap.data().progress||{}));state.stage=localStage;if(!options.development)try{const truth=(await fn.httpsCallable(sdk.functions,'halloween2026Advance')({action:'status'})).data;state.stage=truth.stage||0;state.endings=truth.endings||[]}catch{}save();status('Syncing…')}catch{status('Cloud unavailable · saved locally')}finally{loading=false;window.dispatchEvent(new CustomEvent('accountchange',{detail:user}));queueSync()}});
 }catch{status('Offline · saved on this device')}
}
export async function account(){if(!sdk){await initFirebase();if(!sdk)throw Error('Firebase could not load. Check your connection.')}if(user){await sdk.signOut(auth);return}await sdk.signInWithPopup(auth,new sdk.GoogleAuthProvider());}
export const getUser=()=>user;
export const signedIn=()=>!!(auth&&auth.currentUser);
const BOARDS=['grave','delivery','ride'];
// Leaderboard: halloween2026Boards/{game}/scores/{uid}. One personal best per player per game.
export async function submitScore(game,score,name){
 if(!BOARDS.includes(game))throw Error('This game has no leaderboard.');
 if(!sdk||!auth?.currentUser)throw Error('Sign in to save your score.');
 const uid=auth.currentUser.uid,value=Math.round(score);
 if(!Number.isFinite(value)||value<0)throw Error('That score cannot be saved.');
 const ref=sdk.doc(db,'halloween2026Boards',game,'scores',uid);
 const snap=await sdk.getDoc(ref);
 if(snap.exists()&&snap.data().score>=value)return {improved:false,best:snap.data().score};
 try{await sdk.setDoc(ref,{uid,name:String(name||auth.currentUser.displayName||'Player').slice(0,16),score:value,updatedAt:sdk.serverTimestamp()})}catch{throw Error('Could not save the score. The leaderboard may not be set up yet.')}
 return {improved:true,best:value};
}
export async function fetchScores(game,count=10){
 if(!sdk)throw Error('offline');
 const q=sdk.query(sdk.collection(db,'halloween2026Boards',game,'scores'),sdk.orderBy('score','desc'),sdk.limit(count));
 return (await sdk.getDocs(q)).docs.map(d=>d.data());
}
export function queueSync(){if(!user||!sdk||loading)return;dirty=true;clearTimeout(timer);timer=setTimeout(sync,700)}
async function sync(){if(saving||!dirty||!user)return;saving=true;dirty=false;const uid=user.uid;const snapshot=structuredClone(state);status('Saving to Firebase…');try{await sdk.setDoc(sdk.doc(db,'halloween2026Players',uid),{displayName:user.displayName||'Player',progress:snapshot,updatedAt:sdk.serverTimestamp()},{merge:true});status(dirty?'Saving to Firebase…':'Saved to Firebase')}catch{dirty=true;status('Cloud save pending · saved locally')}finally{saving=false;if(dirty) {clearTimeout(timer);timer=setTimeout(sync,15000)}}}
export async function advanceRemote(action,payload){if(!user)throw Error('Sign in to save and unlock the investigation.');if(!sdk)throw Error('Firebase is unavailable.');const call=sdk.httpsCallable(sdk.functions,'halloween2026Advance');try{return (await call({action,payload})).data}catch(err){throw Error(err.code==='functions/not-found'?'The story service has not been deployed yet. Ordinary games and local saves still work.':err.message)}}
window.addEventListener('online',queueSync);
