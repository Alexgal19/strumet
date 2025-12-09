// src/app/api/cron/check-contracts/route.ts

import { checkExpiringContractsAndNotify } from '@/ai/flows/check-expiring-contracts';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // IMPORTANT: This header is used to verify that the request is coming from Cloud Scheduler.
  if (process.env.NODE_ENV === 'production' && request.headers.get('X-Appengine-Cron') !== 'true') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('CRON: Starting daily contract check...');
    const result = await checkExpiringContractsAndNotify();
    console.log(`CRON: Daily contract check finished. Notifications: ${result.notificationsCreated}, Emails: ${result.emailsSent}`);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('CRON: Error during daily contract check:', error);
    // We return a 200 status even on error to prevent Cloud Scheduler from retrying indefinitely.
    // The error is logged for debugging.
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 200 });
  }
}
