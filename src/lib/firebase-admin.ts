import admin from 'firebase-admin';

let adminApp: admin.app.App;

export const getAdminApp = () => {
    if (adminApp) {
        return adminApp;
    }

    if (admin.apps.length === 0) {
        try {
            // Sprawdzenie, czy kluczowe zmienne środowiskowe istnieją
            if (
                !process.env.FIREBASE_PROJECT_ID ||
                !process.env.FIREBASE_CLIENT_EMAIL ||
                !process.env.FIREBASE_PRIVATE_KEY
            ) {
                throw new Error('Firebase Admin SDK environment variables are not set.');
            }

            const serviceAccount: admin.ServiceAccount = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Kluczowe: Poprawne formatowanie klucza prywatnego
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            };

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            });

        } catch (error: any) {
            console.error('Firebase admin initialization error', error.stack);
            throw new Error(`Firebase admin initialization failed: ${error.message}`);
        }
    }
    
    adminApp = admin.apps[0]!;
    return adminApp;
};

export const adminDb = () => admin.database(getAdminApp());
export const adminStorage = () => admin.storage(getAdminApp());
