'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';
import { firebaseConfig } from '@/lib/firebase';
import { getFirebaseServices } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

const VAPID_KEY_REF = 'config/vapidPublicKey';

/**
 * Rejestruje SW push, pobiera token FCM i zapisuje go w RTDB dla użytkownika.
 * Cicho kończy działanie, gdy przeglądarka nie wspiera push lub brak klucza VAPID.
 */
export async function setupPushNotifications(uid: string): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
    if (!(await isSupported())) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const services = getFirebaseServices();
    if (!services?.db) return;
    const { db } = services;

    // Klucz VAPID trzymany jest w RTDB (wzorzec jak resendApiKey)
    const { get: dbGet } = await import('firebase/database');
    const vapidSnap = await dbGet(ref(db, VAPID_KEY_REF));
    const vapidKey = vapidSnap.val() as string | null;
    if (!vapidKey) return;

    const params = new URLSearchParams({
      apiKey: firebaseConfig.apiKey ?? '',
      authDomain: firebaseConfig.authDomain ?? '',
      projectId: firebaseConfig.projectId ?? '',
      storageBucket: firebaseConfig.storageBucket ?? '',
      messagingSenderId: firebaseConfig.messagingSenderId ?? '',
      appId: firebaseConfig.appId ?? '',
    });

    const registration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${params.toString()}`
    );

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const messaging: Messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) return;

    await set(ref(db, `fcmTokens/${uid}/${token.replaceAll('.', '_')}`), {
      token,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[push] setup error:', error);
  }
}
