import admin from 'firebase-admin';

let adminApp: admin.app.App;

export const getAdminApp = () => {
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    // Sprawdzenie, czy kluczowe zmienne środowiskowe istnieją
    if (
        !process.env.FIREBASE_PROJECT_ID ||
        !process.env.FIREBASE_CLIENT_EMAIL ||
        !process.env.FIREBASE_PRIVATE_KEY
    ) {
        throw new Error('Firebase Admin SDK environment variables are not set. Please check your .env file.');
    }

    const serviceAccount: admin.ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Kluczowe: Poprawne formatowanie klucza prywatnego
        privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
    };

    try {
        adminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
    } catch (error: any) {
        console.error('Firebase admin initialization error', error.stack);
        throw new Error(`Firebase admin initialization failed: ${error.message}`);
    }
    
    return adminApp;
};

export const adminDb = () => admin.database(getAdminApp());
export const adminStorage = () => admin.storage(getAdminApp());
