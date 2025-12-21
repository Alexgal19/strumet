
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./firebase-config";

// Essential validation to prevent runtime errors
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  // This error will be caught during the build process or on page load in development.
  // It's a safeguard to ensure the environment variables are set.
  throw new Error("Missing Firebase config. Please set up your .env file.");
}

let app: FirebaseApp;
let auth: Auth;
let db: Database;
let storage: FirebaseStorage;

if (getApps().length) {
  app = getApp();
} else {
  app = initializeApp(firebaseConfig);
}

auth = getAuth(app);
db = getDatabase(app);
storage = getStorage(app);

// This is a simplified getter function.
function getFirebaseServices() {
  return { app, auth, db, storage };
}

export { getFirebaseServices, auth, db, storage };
