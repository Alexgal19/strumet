
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Public Firebase configuration, safe to be exposed on the client-side.
// Security is enforced by Firebase Security Rules.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy initialization for Firebase services
// Only runs on client-side, never during server-side rendering/build
let cachedServices: ReturnType<typeof initializeFirebase> | null = null;

const initializeFirebase = () => {
  // Skip on server-side during build
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getDatabase(app);
    const storage = getStorage(app);
    return { app, auth, db, storage };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
};

const getFirebaseServices = () => {
  if (cachedServices) return cachedServices;
  cachedServices = initializeFirebase();
  return cachedServices;
};

// Export the function to be used across the app
export { getFirebaseServices };

// Lazy exports for backward compatibility
export const getDB = () => getFirebaseServices()?.db;
export const getAuth_ = () => getFirebaseServices()?.auth;
export const getStorage_ = () => getFirebaseServices()?.storage;
