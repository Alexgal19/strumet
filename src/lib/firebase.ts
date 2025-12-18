// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5Kryaewq6NcXjpF-ciABQ4Z7RSdm2GwA",
  authDomain: "kadry-online-4h3x9.firebaseapp.com",
  databaseURL: "https://kadry-online-4h3x9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kadry-online-4h3x9",
  storageBucket: "kadry-online-4h3x9.appspot.com",
  messagingSenderId: "358071580509",
  appId: "1:358071580509:web:4f4dd0622ade5586de5ab4"
};

// Initialize Firebase for client
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
