
import { runDailyChecks } from '@/ai/flows/run-daily-checks';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('CRON TRIGGERED: /api/cron/daily-checks endpoint was hit.');
  
  // IMPORTANT: This header is used to verify that the request is coming from Cloud Scheduler.
  if (process.env.NODE_ENV === 'production' && request.headers.get('X-Appengine-Cron') !== 'true') {
    console.log('CRON ABORTED: Unauthorized request.');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('CRON: Starting all daily checks...');
    const result = await runDailyChecks();
    console.log(`CRON: All daily checks finished. Total notifications: ${result.totalNotifications}, Total emails: ${result.totalEmails}`);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('CRON: Error during daily checks:', error);
    // We return a 200 status even on error to prevent Cloud Scheduler from retrying indefinitely.
    // The error is logged for debugging.
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 200 });
  }
}
