import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

let app: FirebaseApp;
let auth: Auth;
let db: Database;
let storage: FirebaseStorage;
let isInitialized = false;

interface FirebaseServices {
    app: FirebaseApp;
    auth: Auth;
    db: Database;
    storage: FirebaseStorage;
}

async function initializeAppClient(): Promise<FirebaseServices> {
    if (isInitialized && app) {
        return { app, auth, db, storage };
    }

    try {
        const response = await fetch('/api/firebase-config');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch Firebase config');
        }
        const { config } = await response.json();

        if (!config || !config.apiKey || !config.authDomain || !config.projectId) {
            throw new Error("Invalid or incomplete Firebase config received from server.");
        }
        
        if (getApps().length === 0) {
            app = initializeApp(config);
        } else {
            app = getApp();
        }

        auth = getAuth(app);
        db = getDatabase(app);
        storage = getStorage(app);

        isInitialized = true;
        return { app, auth, db, storage };

    } catch (error) {
        console.error("Critical Firebase initialization error:", error);
        throw error;
    }
}

// Export a function that ensures initialization is complete
async function getFirebaseServices(): Promise<FirebaseServices> {
    if (!isInitialized) {
        return await initializeAppClient();
    }
    return { app, auth, db, storage };
}

// We still export the instances for legacy imports, but they might not be initialized
// immediately. The components should use getFirebaseServices.
let _auth: Auth, _db: Database, _storage: FirebaseStorage;
if(getApps().length > 0) {
    _auth = getAuth();
    _db = getDatabase();
    _storage = getStorage();
}

export { getFirebaseServices, _auth as auth, _db as db, _storage as storage };
