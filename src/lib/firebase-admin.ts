
import admin from 'firebase-admin';

const initializeAdminApp = () => {
    if (!admin.apps.length) {
        try {
            // Check if environment variables are set, otherwise fall back to application default credentials
            const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
                ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
                : undefined;
            
            const credential = serviceAccount 
                ? admin.credential.cert(serviceAccount)
                : admin.credential.applicationDefault();

            admin.initializeApp({
                credential,
                databaseURL: process.env.FIREBASE_DATABASE_URL,
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            });

        } catch (error: any) {
            console.error('Firebase admin initialization error', error.stack);
        }
    }
};

initializeAdminApp();

export const adminDb = () => admin.database();
export const adminStorage = () => admin.storage();
