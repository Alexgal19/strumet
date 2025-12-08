// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5Kryaewq6NcXjpF-ciABQ4Z7RSdm2GwA",
  authDomain: "kadry-online-4h3x9.firebaseapp.com",
  databaseURL: "https://kadry-online-4h3x9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kadry-online-4h3x9",
  storageBucket: "kadry-online-4h3x9.firebasestorage.app",
  messagingSenderId: "358071580509",
  appId: "1:358071580509:web:4f4dd0622ade5586de5ab4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
