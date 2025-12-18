import admin from 'firebase-admin';

const initializeAdminApp = () => {
    if (!admin.apps.length) {
        try {
            // Check if environment variables are set, otherwise fall back to application default credentials
            const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
                ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
                : undefined;

            if (serviceAccount) {
                 admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: "https://kadry-online-4h3x9-default-rtdb.europe-west1.firebasedatabase.app",
                    storageBucket: "kadry-online-4h3x9.appspot.com",
                });
            } else {
                 admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                    databaseURL: "https://kadry-online-4h3x9-default-rtdb.europe-west1.firebasedatabase.app",
                    storageBucket: "kadry-online-4h3x9.appspot.com",
                });
            }
        } catch (error: any) {
            console.error('Firebase admin initialization error', error.stack);
        }
    }
};

initializeAdminApp();

export const adminDb = () => admin.database();
export const adminStorage = () => admin.storage();
