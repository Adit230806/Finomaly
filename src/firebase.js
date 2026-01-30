import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyDdxswQqIyOEBFweYCU9ceEKLlAN8GNU9U',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'finomaly-6fdfd.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'finomaly-6fdfd',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'finomaly-6fdfd.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '287957063192',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:287957063192:web:56cf767a1189014ecb556d'
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('undefined')) {
  console.error('Firebase config incomplete. Using fallback values.');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);