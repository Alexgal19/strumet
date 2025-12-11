'use server';
/**
 * @fileOverview A master flow to run all daily checks and send notifications.
 *
 * - runManualChecks - A function that orchestrates daily checks for contracts and appointments.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { checkExpiringContractsAndNotify } from './check-expiring-contracts';
import { checkAppointmentsAndNotify } from './check-fingerprint-appointments';

const ManualCheckOutputSchema = z.object({
  contractsResult: z.object({
    notificationsCreated: z.number(),
    emailsSent: z.number(),
  }),
  appointmentsResult: z.object({
    notificationsCreated: z.number(),
    emailsSent: z.number(),
  }),
  totalNotifications: z.number(),
  totalEmails: z.number(),
});

export async function runManualChecks(): Promise<z.infer<typeof ManualCheckOutputSchema>> {
  return runManualChecksFlow();
}

const runManualChecksFlow = ai.defineFlow(
  {
    name: 'runManualChecksFlow',
    outputSchema: ManualCheckOutputSchema,
  },
  async () => {
    console.log('Starting all manual checks...');
    
    // Run checks in parallel
    const [contractsResult, appointmentsResult] = await Promise.all([
        checkExpiringContractsAndNotify(),
        checkAppointmentsAndNotify(),
    ]);
    
    const totalNotifications = contractsResult.notificationsCreated + appointmentsResult.notificationsCreated;
    const totalEmails = contractsResult.emailsSent + appointmentsResult.emailsSent;

    console.log('All manual checks finished.');
    console.log(`Contracts - Notifications: ${contractsResult.notificationsCreated}, Emails: ${contractsResult.emailsSent}`);
    console.log(`Appointments - Notifications: ${appointmentsResult.notificationsCreated}, Emails: ${appointmentsResult.emailsSent}`);
    console.log(`Total - Notifications: ${totalNotifications}, Emails: ${totalEmails}`);
    
    return {
      contractsResult,
      appointmentsResult,
      totalNotifications,
      totalEmails,
    };
  }
);
