
'use server';
/**
 * @fileOverview A flow to check for expiring contracts and send notifications.
 *
 * - checkExpiringContractsAndNotify - A function that checks for contracts expiring in 7 days and sends notifications.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ref, get, push, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { isSameDay, addDays, startOfDay } from 'date-fns';
import type { Employee, AppNotification } from '@/lib/types';
import { parseMaybeDate } from '@/lib/date';
import { sendEmail } from '@/lib/email-tool';

const objectToArray = <T>(obj: Record<string, any> | undefined | null): (T & { id: string })[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

const CheckContractsOutputSchema = z.object({
  notificationsCreated: z.number(),
  emailsSent: z.number(),
});

export async function checkExpiringContractsAndNotify(): Promise<z.infer<typeof CheckContractsOutputSchema>> {
  return checkExpiringContractsFlow();
}

const checkExpiringContractsFlow = ai.defineFlow(
  {
    name: 'checkExpiringContractsFlow',
    outputSchema: CheckContractsOutputSchema,
  },
  async () => {
    console.log('Starting to check for expiring contracts...');
    
    const employeesRef = ref(db, 'employees');
    const snapshot = await get(employeesRef);
    const allEmployees = objectToArray<Employee>(snapshot.val());
    const activeEmployees = allEmployees.filter(e => e.status === 'aktywny');

    if (!activeEmployees || activeEmployees.length === 0) {
      console.log('No active employees found.');
      return { notificationsCreated: 0, emailsSent: 0 };
    }
    
    const today = startOfDay(new Date());
    const notificationDate = addDays(today, 7);

    const expiringContractsEmployees = activeEmployees.filter(emp => {
        if (!emp.contractEndDate) return false;
        const contractEndDate = parseMaybeDate(emp.contractEndDate);
        if (!contractEndDate) return false;
        return isSameDay(startOfDay(contractEndDate), notificationDate);
    });

    console.log(`Found ${expiringContractsEmployees.length} contracts expiring on ${notificationDate.toDateString()}.`);

    if (expiringContractsEmployees.length === 0) {
        return { notificationsCreated: 0, emailsSent: 0 };
    }
    
    // Create one notification and one email for all expiring contracts for that day.
    const employeeNames = expiringContractsEmployees.map(emp => emp.fullName).join(', ');
    
    // 1. Create in-app notification
    const title = `Uwaga: Umowy wygasają za 7 dni (${expiringContractsEmployees.length})`;
    const message = `Pamiętaj o kończących się umowach dla następujących pracowników: ${employeeNames}.`;
    
    const newNotificationRef = push(ref(db, 'notifications'));
    const newNotification: Omit<AppNotification, 'id'> = {
        title,
        message,
        createdAt: new Date().toISOString(),
        read: false,
    };
    await set(newNotificationRef, newNotification);
    console.log(`Created in-app notification for ${expiringContractsEmployees.length} employees.`);
    
    // 2. Send email notification
    const emailSubject = `Przypomnienie: Wygasające umowy (${expiringContractsEmployees.length})`;
    const emailBody = `
        <h1>Przypomnienie o wygasających umowach</h1>
        <p>Za 7 dni (${notificationDate.toLocaleDateString('pl-PL')}) wygasają umowy następującym pracownikom:</p>
        <ul>
            ${expiringContractsEmployees.map(emp => `<li><strong>${emp.fullName}</strong> (Dział: ${emp.department}, Stanowisko: ${emp.jobTitle})</li>`).join('')}
        </ul>
        <p>Proszę podjąć odpowiednie działania.</p>
    `;

    const emailResult = await sendEmail({ subject: emailSubject, body: emailBody });
    if(emailResult.success) {
        console.log(`Email sent successfully for ${expiringContractsEmployees.length} employees.`);
    } else {
        console.error(`Failed to send email: ${emailResult.message}`);
    }

    return {
      notificationsCreated: 1,
      emailsSent: emailResult.success ? 1 : 0,
    };
  }
);
