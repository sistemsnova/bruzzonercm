import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBnkittxJ3-VmGgZqhsosv_bvNqOIQYb40",
  authDomain: "bruzzonecrm.firebaseapp.com",
  projectId: "bruzzonecrm",
  storageBucket: "bruzzonecrm.firebasestorage.app",
  messagingSenderId: "927179271207",
  appId: "1:927179271207:web:b287dce1ce53b4f3ddb202"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);