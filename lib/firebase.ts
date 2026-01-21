import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Fix: Changed from import.meta.env to process.env to resolve TypeScript errors and align with environment variable access patterns used in other modules.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBnkittxJ3-VmGgZqhsosv_bvNqOIQYb40",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "bruzzonecrm.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "bruzzonecrm",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "bruzzonecrm.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "927179271207",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:927179271207:web:b287dce1ce53b4f3ddb202"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);