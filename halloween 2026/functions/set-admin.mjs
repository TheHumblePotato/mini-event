// Run only by the project owner with Application Default Credentials.
// node set-admin.mjs FIREBASE_AUTH_UID
import {initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
const uid=process.argv[2];if(!uid||uid.length>128)throw Error('Supply the exact Firebase Auth UID.');
initializeApp({projectId:'nerd-mini-events'});const auth=getAuth();const user=await auth.getUser(uid);
await auth.setCustomUserClaims(uid,{...user.customClaims,halloween2026Admin:true});
console.log('Halloween playtest claim added. Sign out and back in to refresh it.');
