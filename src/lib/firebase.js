import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyBEMhWn8l6CzzWBCITXQj1A9aIar_WIfus',
  authDomain: 'dragon-news-rrhs.firebaseapp.com',
  projectId: 'dragon-news-rrhs',
  storageBucket: 'dragon-news-rrhs.firebasestorage.app',
  messagingSenderId: '650378621059',
  appId: '1:650378621059:web:efd8f01823fb7adcb3ebb6',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
