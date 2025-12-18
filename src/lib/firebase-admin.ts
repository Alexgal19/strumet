import admin from 'firebase-admin';

const initializeAdminApp = () => {
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                databaseURL: "https://kadry-online-4h3x9-default-rtdb.europe-west1.firebasedatabase.app",
                storageBucket: "kadry-online-4h3x9.appspot.com",
            });
        } catch (error) {
            console.error('Firebase admin initialization error', error);
        }
    }
};

initializeAdminApp();

export const adminDb = () => admin.database();
export const adminStorage = () => admin.storage();
