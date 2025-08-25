// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCryPpPDejThvmchHlCT2_JTFPAP2_9Soc",
    authDomain: "system-wr.firebaseapp.com",
    databaseURL: "https://system-wr-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "system-wr",
    storageBucket: "system-wr.firebasestorage.app",
    messagingSenderId: "661979285001",
    appId: "1:661979285001:web:aceef9e7da910d81a49ad8",
    measurementId: "G-E3BFN367SJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
