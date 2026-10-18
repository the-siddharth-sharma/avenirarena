import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. Firebase configuration read strictly from Vite environment variables (VITE_ prefix)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAvenirArenaProductionPlaceholderKey',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'avenir-arena.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'avenir-arena',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'avenir-arena.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1026711910319',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1026711910319:web:avenirarena2026',
};

// 2. Initialize Firebase App (singleton pattern prevents duplicate app instances)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 3. Initialize Firebase Authentication & Firestore Modular Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
