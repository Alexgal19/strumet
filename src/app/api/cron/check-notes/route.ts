import { checkNotesReminders } from '@/ai/flows/check-notes-reminders';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('CRON TRIGGERED: /api/cron/check-notes endpoint was hit.');

  if (process.env.NODE_ENV === 'production' && request.headers.get('X-Appengine-Cron') !== 'true') {
    console.log('CRON ABORTED: Unauthorized request.');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('CRON: Starting notes reminder check...');
    const result = await checkNotesReminders();
    console.log('CRON: Notes check finished. Emails sent: ' + result.emailsSent + ', Skipped: ' + result.skipped);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('CRON: Error during notes check:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 200 });
  }
}
