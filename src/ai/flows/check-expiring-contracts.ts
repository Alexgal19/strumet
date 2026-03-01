'use server';
/**
 * Checks for expiring contracts (within 7 days) and sends in-app + email notifications.
 */

import { z } from 'zod';
import { getAdminApp, adminDb } from '@/lib/firebase-admin';
import { startOfDay, differenceInDays } from 'date-fns';
import type { Employee, AppNotification } from '@/lib/types';
import { parseMaybeDate } from '@/lib/date';
import { sendEmail } from '@/ai/tools';

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export async function checkExpiringContractsAndNotify(): Promise<{ notificationsCreated: number; emailsSent: number }> {
  console.log('Starting to check for expiring contracts...');
  getAdminApp();
  const db = adminDb();

  const employeesSnapshot = await db.ref('employees').get();
  const allEmployees: Employee[] = objectToArray(employeesSnapshot.val());
  const activeEmployees = allEmployees.filter(e => e.status === 'aktywny');

  if (!activeEmployees.length) {
    console.log('No active employees found.');
    return { notificationsCreated: 0, emailsSent: 0 };
  }

  const today = startOfDay(new Date());

  const expiringContractsEmployees = activeEmployees
    .map(emp => {
      const contractEndDate = parseMaybeDate(emp.contractEndDate);
      if (!contractEndDate) return null;
      const daysRemaining = differenceInDays(startOfDay(contractEndDate), today);
      if (daysRemaining >= 0 && daysRemaining <= 7) return { ...emp, daysRemaining };
      return null;
    })
    .filter((emp): emp is Employee & { daysRemaining: number } => emp !== null);

  console.log(`Found ${expiringContractsEmployees.length} contracts expiring within 7 days.`);
  if (!expiringContractsEmployees.length) return { notificationsCreated: 0, emailsSent: 0 };

  const groupedByDays = expiringContractsEmployees.reduce((acc, emp) => {
    const key = emp.daysRemaining;
    if (!acc[key]) acc[key] = [];
    acc[key].push(emp.fullName);
    return acc;
  }, {} as Record<number, string[]>);

  // 1. In-app notification
  const totalExpiring = expiringContractsEmployees.length;
  const title = `Uwaga: ${totalExpiring} umow${totalExpiring > 1 ? 'y' : 'a'} wkrótce wygasają!`;
  const messageParts = Object.entries(groupedByDays)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([days, names]) => {
      const d = Number(days);
      const dayText = d === 0 ? 'dzisiaj' : d === 1 ? 'jutro' : `za ${d} dni`;
      return `Wygasające ${dayText} (${names.length}): ${names.join(', ')}.`;
    });

  const newNotification: Omit<AppNotification, 'id'> = {
    title,
    message: messageParts.join(' '),
    createdAt: new Date().toISOString(),
    read: false,
  };
  await db.ref('notifications').push(newNotification);

  // 2. Email notification
  const emailSubject = `Codzienne przypomnienie: ${totalExpiring} umów wkrótce wygasa`;
  const emailBodyParts = Object.entries(groupedByDays)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([days, names]) => {
      const d = Number(days);
      const dayText = d === 0 ? 'dzisiaj' : d === 1 ? 'jutro' : `za ${d} dni`;
      const details = expiringContractsEmployees
        .filter(emp => emp.daysRemaining === d)
        .map(emp => `<li><strong>${emp.fullName}</strong> (Dział: ${emp.department})</li>`)
        .join('');
      return `<h3>Umowy wygasające ${dayText}:</h3><ul>${details}</ul>`;
    });

  const emailBody = `<h1>Codzienne przypomnienie o wygasających umowach</h1><p>Poniżej znajduje się lista umów, które wkrótce wygasną:</p>${emailBodyParts.join('')}<p>Proszę podjąć odpowiednie działania.</p>`;
  const emailResult = await sendEmail({ subject: emailSubject, body: emailBody });

  let emailsSentCount = 0;
  if (emailResult.success) {
    emailsSentCount = 1;
  } else {
    const errorNotification: Omit<AppNotification, 'id'> = {
      title: 'Błąd wysyłania Email',
      message: `Nie udało się wysłać powiadomienia email. Błąd: ${emailResult.message}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    await db.ref('notifications').push(errorNotification);
  }

  return { notificationsCreated: 1, emailsSent: emailsSentCount };
}
