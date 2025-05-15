import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "AIzaSyAA7g5ZNNeowhtYwXHt0us73vUJrvvF70o",
  authDomain: "blog-website-4c045.firebaseapp.com",
  projectId: "blog-website-4c045",
  storageBucket: "blog-website-4c045.firebasestorage.app",
  messagingSenderId: "758678008766",
  appId: "1:758678008766:web:9a2abbcfc8f57eab783fef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);