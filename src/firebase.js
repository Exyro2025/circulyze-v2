import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA5sIOWeRjqb6-d3t61ntha45iS2R696x0",
  authDomain: "circulyze-1199f.firebaseapp.com",
  projectId: "circulyze-1199f",
  storageBucket: "circulyze-1199f.firebasestorage.app",
  messagingSenderId: "175296670546",
  appId: "1:175296670546:web:a29c59b50f09f15600a88b",
  measurementId: "G-7VG2VPXBDR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
