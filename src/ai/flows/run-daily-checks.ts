'use server';
/**
 * @fileOverview A master flow to run all daily checks and send notifications.
 *
 * - runDailyChecks - A function that orchestrates daily checks for contracts and appointments.
 */

import { checkExpiringContractsAndNotify } from './check-expiring-contracts';
import { checkAppointmentsAndNotify } from './check-fingerprint-appointments';
import { checkPlannedTerminations } from './check-planned-terminations';

export async function runDailyChecks() {
  console.log('Starting all daily checks...');

  // Run critical checks in parallel
  const [contractsResult, appointmentsResult, terminationsResult] = await Promise.all([
    checkExpiringContractsAndNotify(),
    checkAppointmentsAndNotify(),
    checkPlannedTerminations(),
  ]);

  const totalNotifications = contractsResult.notificationsCreated + appointmentsResult.notificationsCreated + terminationsResult.notificationsCreated;
  const totalEmails = contractsResult.emailsSent + appointmentsResult.emailsSent;

  console.log('All daily checks finished.');
  console.log(`Contracts - Notifications: ${contractsResult.notificationsCreated}, Emails: ${contractsResult.emailsSent}`);
  console.log(`Appointments - Notifications: ${appointmentsResult.notificationsCreated}, Emails: ${appointmentsResult.emailsSent}`);
  console.log(`Terminations - Processed: ${terminationsResult.processedCount}, Notifications: ${terminationsResult.notificationsCreated}`);
  console.log(`Total - Notifications: ${totalNotifications}, Emails: ${totalEmails}`);

  return {
    contractsResult,
    appointmentsResult,
    terminationsResult,
    totalNotifications,
    totalEmails,
  };
}
