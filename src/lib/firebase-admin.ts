
import admin from 'firebase-admin';

let adminApp: admin.app.App;

export const getAdminApp = () => {
    // This check prevents initialization on the client side.
    if (typeof window !== 'undefined') {
        // Return a mock or empty object on the client to avoid errors,
        // though this code path should ideally not be hit in the browser.
        if (admin.apps.length > 0) return admin.apps[0]!;
        // A minimal mock to prevent client-side crashes if accidentally imported.
        return {
           name: "mock-app",
           options: {},
           database: () => ({}),
           storage: () => ({}),
        } as unknown as admin.app.App;
    }


    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    if (
        !process.env.FIREBASE_PROJECT_ID ||
        !process.env.FIREBASE_CLIENT_EMAIL ||
        !process.env.FIREBASE_PRIVATE_KEY
    ) {
        console.error('Firebase Admin SDK environment variables are not set.');
        throw new Error('Firebase Admin SDK environment variables are not set. Please check your .env file.');
    }

    const serviceAccount: admin.ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
    };

    try {
        adminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
    } catch (error: any) {
        if (!/already exists/i.test(error.message)) {
            console.error('Firebase admin initialization error', error.stack);
            throw new Error(`Firebase admin initialization failed: ${error.message}`);
        }
    }
    
    return adminApp;
};

// These functions should only be called from server-side code.
export const adminDb = () => {
    if (typeof window !== 'undefined') throw new Error("adminDb cannot be called on the client.");
    return admin.database(getAdminApp());
}
export const adminStorage = () => {
    if (typeof window !== 'undefined') throw new Error("adminStorage cannot be called on the client.");
    return admin.storage(getAdminApp());
}
