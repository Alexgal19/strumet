
'use server';
/**
 * @fileOverview A master flow to run all daily checks and send notifications.
 *
 * - runDailyChecks - A function that orchestrates daily checks for contracts and appointments.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getDay } from 'date-fns';
import { checkExpiringContractsAndNotify } from './check-expiring-contracts';
import { checkAppointmentsAndNotify } from './check-fingerprint-appointments';
import { checkPlannedTerminations } from './check-planned-terminations';
import { createStatsSnapshot } from './create-stats-snapshot';

const DailyCheckOutputSchema = z.object({
  contractsResult: z.object({
    notificationsCreated: z.number(),
    emailsSent: z.number(),
  }),
  appointmentsResult: z.object({
    notificationsCreated: z.number(),
    emailsSent: z.number(),
  }),
  terminationsResult: z.object({
    processedCount: z.number(),
    notificationsCreated: z.number(),
  }),
  snapshotResult: z.object({
    snapshotId: z.string().optional(),
    error: z.string().optional(),
  }).optional(),
  totalNotifications: z.number(),
  totalEmails: z.number(),
});

export async function runDailyChecks(): Promise<z.infer<typeof DailyCheckOutputSchema>> {
  return runDailyChecksFlow();
}

const runDailyChecksFlow = ai.defineFlow(
  {
    name: 'runDailyChecksFlow',
    outputSchema: DailyCheckOutputSchema,
  },
  async () => {
    console.log('Starting all daily checks...');
    
    // Run all checks in parallel, including snapshot creation
    const [contractsResult, appointmentsResult, terminationsResult, snapshotResult] = await Promise.allSettled([
        checkExpiringContractsAndNotify(),
        checkAppointmentsAndNotify(),
        checkPlannedTerminations(),
        createStatsSnapshot(),
    ]);

    const getResultValue = <T>(result: PromiseSettledResult<T>, defaultValue: T): T => {
        return result.status === 'fulfilled' ? result.value : defaultValue;
    };

    const contractsRes = getResultValue(contractsResult, { notificationsCreated: 0, emailsSent: 0 });
    const appointmentsRes = getResultValue(appointmentsResult, { notificationsCreated: 0, emailsSent: 0 });
    const terminationsRes = getResultValue(terminationsResult, { processedCount: 0, notificationsCreated: 0 });
    
    let snapshotRes: { snapshotId?: string, error?: string } | undefined = undefined;
    if (snapshotResult.status === 'fulfilled') {
        snapshotRes = { snapshotId: snapshotResult.value.snapshotId };
    } else {
        console.error("Failed to create statistics snapshot:", snapshotResult.reason);
        snapshotRes = { error: (snapshotResult.reason as Error).message };
    }
    
    const totalNotifications = contractsRes.notificationsCreated + appointmentsRes.notificationsCreated + terminationsRes.notificationsCreated;
    const totalEmails = contractsRes.emailsSent + appointmentsRes.emailsSent;

    console.log('All daily checks finished.');
    console.log(`Contracts - Notifications: ${contractsRes.notificationsCreated}, Emails: ${contractsRes.emailsSent}`);
    console.log(`Appointments - Notifications: ${appointmentsRes.notificationsCreated}, Emails: ${appointmentsRes.emailsSent}`);
    console.log(`Terminations - Processed: ${terminationsRes.processedCount}, Notifications: ${terminationsRes.notificationsCreated}`);
    if (snapshotRes) {
        console.log(`Snapshot - ${snapshotRes.snapshotId ? `ID: ${snapshotRes.snapshotId}` : `Error: ${snapshotRes.error}`}`);
    }
    console.log(`Total - Notifications: ${totalNotifications}, Emails: ${totalEmails}`);
    
    return {
      contractsResult: contractsRes,
      appointmentsResult: appointmentsRes,
      terminationsResult: terminationsRes,
      snapshotResult: snapshotRes,
      totalNotifications,
      totalEmails,
    };
  }
);
