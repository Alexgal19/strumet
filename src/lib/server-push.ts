import * as admin from 'firebase-admin';
import { getAdminApp, adminDb } from '@/lib/firebase-admin';

/**
 * Wysyła powiadomienie push (FCM) do wszystkich zapisanych tokenów
 * (admin + koledzy). Cicho kończy, gdy brak tokenów lub błąd.
 */
export async function sendPushToStaff(title: string, body: string): Promise<number> {
  try {
    const app = getAdminApp();
    const messaging = admin.messaging(app);
    const snapshot = await adminDb().ref('fcmTokens').get();
    const allUsers = (snapshot.val() ?? {}) as Record<string, Record<string, { token?: string }>>;

    const tokens: string[] = [];
    Object.values(allUsers).forEach((userTokens) => {
      Object.values(userTokens ?? {}).forEach((entry) => {
        if (entry?.token) tokens.push(entry.token);
      });
    });

    if (tokens.length === 0) return 0;

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: { fcmOptions: { link: '/pulpit' } },
    });
    return response.successCount;
  } catch (error) {
    console.error('[server-push] Error:', error);
    return 0;
  }
}
