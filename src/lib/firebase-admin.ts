import admin from 'firebase-admin';

// Wzorzec Singleton: przechowujemy instancję w pamięci modułu.
let adminApp: admin.app.App;

export const getAdminApp = () => {
    // Jeśli instancja już istnieje, natychmiast ją zwróć.
    if (adminApp) {
        return adminApp;
    }

    // Jeśli nie ma istniejących aplikacji, zainicjalizuj nową.
    if (admin.apps.length === 0) {
        try {
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
            throw error; // Rzuć błędem, aby zatrzymać wadliwy proces.
        }
    }
    
    // Zapisz zainicjalizowaną aplikację do naszej zmiennej i zwróć ją.
    adminApp = admin.apps[0]!;
    return adminApp;
};

export const adminDb = () => admin.database(getAdminApp());
export const adminStorage = () => admin.storage(getAdminApp());
