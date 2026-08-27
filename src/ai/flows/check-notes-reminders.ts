'use server';
/**
 * Checks for overdue notes that haven't been read and sends email reminders.
 * Reminder is sent when:
 *   1. note.dueDate + dueTime <= now
 *   2. note.read === false
 *   3. lastReminderSentAt is absent OR (now - lastReminderSentAt) >= 2 hours
 */

import { getAdminApp, adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/ai/tools';
import type { Note } from '@/lib/types';

const REMINDER_RECIPIENT = 'o.holiadynets@swl.com.pl';
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const objectToArray = (obj: Record<string, unknown> | undefined | null): Note[] => {
  if (!obj) return [];
  return Object.keys(obj).map((key) => ({ id: key, ...(obj[key] as object) } as Note));
};

export async function checkNotesReminders(): Promise<{ emailsSent: number; skipped: number }> {
  console.log('[check-notes] Starting notes reminder check...');
  getAdminApp();
  const db = adminDb();

  const snapshot = await db.ref('notes').get();
  const allNotes: Note[] = objectToArray(snapshot.val());

  const now = new Date();
  let emailsSent = 0;
  let skipped = 0;

  for (const note of allNotes) {
    // Skip already read notes
    if (note.read) {
      skipped++;
      continue;
    }

    // Parse due datetime
    const dueDateTime = new Date(note.dueDate + 'T' + note.dueTime + ':00');

    // Skip notes not yet due
    if (dueDateTime > now) {
      skipped++;
      continue;
    }

    // Check 2-hour cooldown
    if (note.lastReminderSentAt) {
      const lastSent = new Date(note.lastReminderSentAt);
      const msSinceLast = now.getTime() - lastSent.getTime();
      if (msSinceLast < TWO_HOURS_MS) {
        console.log('[check-notes] Note "' + note.title + '" cooldown active, skipping.');
        skipped++;
        continue;
      }
    }

    // Build email
    const dueDateFormatted = dueDateTime.toLocaleDateString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const subject = '\u23F0 Przypomnienie: ' + note.title;
    const body = [
      '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">',
      '<h2 style="color: #e11d48; margin-bottom: 4px;">\u23F0 Przypomnienie o zadaniu</h2>',
      '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />',
      '<h3 style="margin-bottom: 8px;">' + note.title + '</h3>',
      note.content
        ? '<p style="color: #6b7280; white-space: pre-wrap;">' + note.content + '</p>'
        : '',
      '<p style="margin-top: 16px;">',
      '<strong>Termin:</strong> ' + dueDateFormatted,
      '</p>',
      '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />',
      '<p style="color: #9ca3af; font-size: 12px;">',
      'To przypomnienie jest wysylane co 2 godziny dopoki nie oznaczysz notatki jako przeczytanej w systemie Strumet HR.',
      '</p>',
      '</div>',
    ].join('');

    const result = await sendEmail({
      subject,
      body,
      recipientEmails: [REMINDER_RECIPIENT],
    });

    if (result.success) {
      // Update lastReminderSentAt in RTDB
      await db.ref('notes/' + note.id + '/lastReminderSentAt').set(now.toISOString());
      console.log('[check-notes] Reminder sent for note: ' + note.title);
      emailsSent++;
    } else {
      console.error('[check-notes] Failed to send reminder for note "' + note.title + '":', result.message);
    }
  }

  console.log('[check-notes] Done. Sent: ' + emailsSent + ', Skipped: ' + skipped);
  return { emailsSent, skipped };
}
