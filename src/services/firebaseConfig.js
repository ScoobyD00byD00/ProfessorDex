// src/services/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3eQCgj6Fvr3Q4IHu8Vcf_dpr9Sj0ebpM",
  authDomain: "professordex-cd81c.firebaseapp.com",
  projectId: "professordex-cd81c",
  storageBucket: "professordex-cd81c.firebasestorage.app",
  messagingSenderId: "1059218469050",
  appId: "1:1059218469050:web:5ff30c80b599055876d283"
  };
  

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

