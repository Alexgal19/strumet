
'use server';
/**
 * @fileOverview A flow to check for expiring contracts and send notifications.
 *
 * - checkExpiringContractsAndNotify - A function that checks for contracts expiring in the next 7 days and sends daily notifications.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAdminApp, adminDb } from '@/lib/firebase-admin';
import { startOfDay, differenceInDays } from 'date-fns';
import type { Employee, AppNotification } from '@/lib/types';
import { parseMaybeDate } from '@/lib/date';
import { sendEmail } from '@/lib/email-tool';

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
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
    getAdminApp();
    const db = adminDb();
    
    const employeesSnapshot = await db.ref("employees").get();
    const allEmployees: Employee[] = objectToArray(employeesSnapshot.val());
    const activeEmployees = allEmployees.filter(e => e.status === 'aktywny');

    if (!activeEmployees || activeEmployees.length === 0) {
      console.log('No active employees found.');
      return { notificationsCreated: 0, emailsSent: 0 };
    }
    
    const today = startOfDay(new Date());

    const expiringContractsEmployees = activeEmployees
      .map(emp => {
        const contractEndDate = parseMaybeDate(emp.contractEndDate);
        if (!contractEndDate) return null;
        
        const daysRemaining = differenceInDays(startOfDay(contractEndDate), today);
        
        if (daysRemaining >= 0 && daysRemaining <= 7) {
          return { ...emp, daysRemaining };
        }
        return null;
      })
      .filter((emp): emp is Employee & { daysRemaining: number } => emp !== null);

    console.log(`Found ${expiringContractsEmployees.length} contracts expiring within the next 7 days.`);

    if (expiringContractsEmployees.length === 0) {
        return { notificationsCreated: 0, emailsSent: 0 };
    }
    
    // Group employees by days remaining
    const groupedByDays = expiringContractsEmployees.reduce((acc, emp) => {
        const key = emp.daysRemaining;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(emp.fullName);
        return acc;
    }, {} as Record<number, string[]>);
    
    // 1. Create in-app notification for expiring contracts
    const totalExpiring = expiringContractsEmployees.length;
    const title = `Uwaga: ${totalExpiring} umow${totalExpiring > 1 ? 'y' : 'a'} wkrótce wygasają!`;
    const messageParts = Object.entries(groupedByDays)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([days, names]) => {
        const daysNum = Number(days);
        let dayText = `za ${daysNum} dni`;
        if (daysNum === 1) dayText = 'jutro';
        if (daysNum === 0) dayText = 'dzisiaj';
        return `Wygasające ${dayText} (${names.length}): ${names.join(', ')}.`;
      });
    
    const message = messageParts.join(' ');
    
    const newNotification: Omit<AppNotification, 'id'> = {
        title,
        message,
        createdAt: new Date().toISOString(),
        read: false,
    };
    await db.ref("notifications").push(newNotification);
    console.log(`Created in-app notification for ${totalExpiring} employees.`);
    
    // 2. Send email notification
    const emailSubject = `Codzienne przypomnienie: ${totalExpiring} umów wkrótce wygasa`;
    const emailBodyParts = Object.entries(groupedByDays)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([days, names]) => {
        const daysNum = Number(days);
        let dayText = `za ${daysNum} dni`;
        if (daysNum === 1) dayText = 'jutro';
        if (daysNum === 0) dayText = 'dzisiaj';

        const employeeDetails = expiringContractsEmployees
          .filter(emp => emp.daysRemaining === daysNum)
          .map(emp => `<li><strong>${emp.fullName}</strong> (Dział: ${emp.department})</li>`)
          .join('');

        return `
          <h3>Umowy wygasające ${dayText}:</h3>
          <ul>${employeeDetails}</ul>
        `;
      });

    const emailBody = `
        <h1>Codzienne przypomnienie o wygasających umowach</h1>
        <p>Poniżej znajduje się lista umów, które wkrótce wygasną:</p>
        ${emailBodyParts.join('')}
        <p>Proszę podjąć odpowiednie działania.</p>
    `;

    const emailResult = await sendEmail({ subject: emailSubject, body: emailBody });
    
    let emailsSentCount = 0;
    if(emailResult.success) {
        console.log(`Email sent successfully for ${totalExpiring} employees.`);
        emailsSentCount = 1;
    } else {
        console.error(`Failed to send email: ${emailResult.message}`);
        // Create an error notification
        const errorNotification: Omit<AppNotification, 'id'> = {
            title: 'Błąd wysyłania Email',
            message: `Nie udało się wysłać powiadomienia email. Szczegóły błędu: ${emailResult.message}`,
            createdAt: new Date().toISOString(),
            read: false,
        };
        await db.ref("notifications").push(errorNotification);
    }

    return {
      notificationsCreated: 1, // We always create at least one main notification
      emailsSent: emailsSentCount,
    };
  }
);
