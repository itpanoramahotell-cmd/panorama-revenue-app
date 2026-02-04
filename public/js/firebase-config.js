import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDON-jFlowhvGx6IxlTcGUnhnExAw2lNWI",
  authDomain: "panorama-revenue-app.firebaseapp.com",
  projectId: "panorama-revenue-app",
  storageBucket: "panorama-revenue-app.firebasestorage.app",
  messagingSenderId: "1076989508158",
  appId: "1:1076989508158:web:8d0c10f2e83a9e667e6f6f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Hjelpefunksjoner for Auth
export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);