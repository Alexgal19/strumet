
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "@/lib/firebase-config";

// Essential validation to prevent runtime errors
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  throw new Error(
    "Kluczowe zmienne środowiskowe Firebase nie są poprawnie skonfigurowane. Sprawdź plik .env i upewnij się, że zmienne NEXT_PUBLIC_... są ustawione."
  );
}

let app: FirebaseApp;
let auth: Auth;
let db: Database;
let storage: FirebaseStorage;

// Singleton pattern to initialize Firebase only once
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getDatabase(app);
storage = getStorage(app);

// We now export a simple synchronous getter function.
function getFirebaseServices() {
    return { app, auth, db, storage };
}

export { getFirebaseServices, auth, db, storage };
