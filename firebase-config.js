// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    collection,
    getDocs,
    orderBy,
    query 
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyARY96nrH2Aio8rOiLkewSXtTS40TZLrAw",
    authDomain: "nerd-mini-events.firebaseapp.com",
    projectId: "nerd-mini-events",
    storageBucket: "nerd-mini-events.firebasestorage.app",
    messagingSenderId: "974357416633",
    appId: "1:974357416633:web:e190de60553a685d03e968",
    measurementId: "G-V9NGCSEY8J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Export everything needed for the main application
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
window.googleProvider = provider;

// Export auth functions
window.signInWithPopup = signInWithPopup;
window.signOut = signOut;
window.onAuthStateChanged = onAuthStateChanged;

// Export firestore functions
window.doc = doc;
window.setDoc = setDoc;
window.getDoc = getDoc;
window.collection = collection;
window.getDocs = getDocs;
window.query = query;
window.orderBy = orderBy;