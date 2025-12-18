
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
import { archiveEmployees } from './archive-employees-flow';

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
  archiveResult: z.object({
    filePath: z.string().optional(),
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
    
    const checksToRun: Promise<any>[] = [
        checkExpiringContractsAndNotify(),
        checkAppointmentsAndNotify(),
        checkPlannedTerminations(),
        createStatsSnapshot(), // Snapshot is now created every day
        archiveEmployees(),
    ];

    const results = await Promise.allSettled(checksToRun);

    const getResultValue = <T>(result: PromiseSettledResult<T> | undefined, defaultValue: T): T => {
        if (!result) return defaultValue;
        return result.status === 'fulfilled' ? result.value : defaultValue;
    };

    const contractsRes = getResultValue(results[0], { notificationsCreated: 0, emailsSent: 0 });
    const appointmentsRes = getResultValue(results[1], { notificationsCreated: 0, emailsSent: 0 });
    const terminationsRes = getResultValue(results[2], { processedCount: 0, notificationsCreated: 0 });
    
    let snapshotRes: { snapshotId?: string, error?: string } | undefined = undefined;
    const snapshotResult = results[3];
    if (snapshotResult && snapshotResult.status === 'fulfilled') {
        snapshotRes = { snapshotId: (snapshotResult.value as any).snapshotId };
    } else {
        const reason = snapshotResult ? (snapshotResult as PromiseRejectedResult).reason : new Error("Unknown snapshot failure");
        console.error("Failed to create statistics snapshot:", reason);
        snapshotRes = { error: (reason as Error).message };
    }

    let archiveRes: { filePath?: string, error?: string } | undefined = undefined;
    const archiveResult = results[4];
    if (archiveResult && archiveResult.status === 'fulfilled') {
        archiveRes = { filePath: (archiveResult.value as any).filePath };
    } else {
        const reason = archiveResult ? (archiveResult as PromiseRejectedResult).reason : new Error("Unknown archive failure");
        console.error("Failed to create Excel archive:", reason);
        archiveRes = { error: (reason as Error).message };
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
    if (archiveRes) {
      console.log(`Archive - ${archiveRes.filePath ? `Path: ${archiveRes.filePath}` : `Error: ${archiveRes.error}`}`);
    }
    console.log(`Total - Notifications: ${totalNotifications}, Emails: ${totalEmails}`);
    
    return {
      contractsResult: contractsRes,
      appointmentsResult: appointmentsRes,
      terminationsResult: terminationsRes,
      snapshotResult: snapshotRes,
      archiveResult: archiveRes,
      totalNotifications,
      totalEmails,
    };
  }
);
