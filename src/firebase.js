import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. Firebase configuration read strictly from Vite environment variables (VITE_ prefix)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA6wjAjoBTgQ13DvgVeGxSxQ83zJVqFu7E',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'avenir-arena-6fdb7.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'avenir-arena-6fdb7',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'avenir-arena-6fdb7.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '683733824929',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:683733824929:web:8e27b1905e4989f13307e0',
};

// 2. Initialize Firebase App (singleton pattern prevents duplicate app instances)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 3. Initialize Firebase Authentication & Firestore Modular Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
