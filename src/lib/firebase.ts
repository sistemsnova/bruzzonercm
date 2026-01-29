import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Configuración de Firebase usando tus credenciales
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBnkittxJ3-VmGgZqhsosv_bvNqOIQYb40",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bruzzonecrm.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bruzzonecrm",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bruzzonecrm.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "927179271207",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:927179271207:web:b287dce1ce53b4f3ddb202"
};

// Inicializar la App
const app = initializeApp(firebaseConfig);

// Exportar los servicios necesarios para el resto del sistema
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configurar idioma español para los correos de Auth
auth.languageCode = 'es';