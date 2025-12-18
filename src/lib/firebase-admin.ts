
import admin from 'firebase-admin';

// This function ensures the Firebase Admin app is initialized only once.
export const getAdminApp = () => {
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            : undefined;
        
        const credential = serviceAccount 
            ? admin.credential.cert(serviceAccount)
            : admin.credential.applicationDefault();

        return admin.initializeApp({
            credential,
            databaseURL: process.env.FIREBASE_DATABASE_URL,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });

    } catch (error: any) {
        console.error('Firebase admin initialization error', error.stack);
        throw error; // Re-throw the error to be caught by the caller
    }
};
