
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

let app: FirebaseApp;
let auth: Auth;
let db: Database;
let storage: FirebaseStorage;
let initializationPromise: Promise<void> | null = null;

async function initializeAppClient(): Promise<void> {
    if (getApps().length) {
        app = getApp();
    } else {
        try {
            const response = await fetch('/api/firebase-config');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch Firebase config');
            }
            const { config } = await response.json();

            if (!config || !config.apiKey) {
                 throw new Error("Pobrana konfiguracja Firebase jest nieprawidłowa.");
            }

            app = initializeApp(config);
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            // We throw the error to be caught by the caller
            throw error;
        }
    }
    
    auth = getAuth(app);
    db = getDatabase(app);
    storage = getStorage(app);
}

// This is the new getter function that ensures initialization is complete.
async function getFirebaseServices() {
    if (!initializationPromise) {
        initializationPromise = initializeAppClient();
    }
    await initializationPromise;
    return { app, auth, db, storage };
}

// We still export the instances for legacy parts that might use them,
// but the primary way to get them should be the async function.
export { getFirebaseServices, auth, db, storage };
