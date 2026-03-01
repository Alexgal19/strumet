'use server';
/**
 * Checks for upcoming fingerprint appointments (within 3 days) and sends notifications.
 */

import { z } from 'zod';
import { getAdminApp, adminDb } from '@/lib/firebase-admin';
import { startOfDay, differenceInDays, format } from 'date-fns';
import type { FingerprintAppointment, AppNotification } from '@/lib/types';
import { parseMaybeDate } from '@/lib/date';
import { sendEmail } from '@/ai/tools';

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export async function checkAppointmentsAndNotify(): Promise<{ notificationsCreated: number; emailsSent: number }> {
  console.log('Starting to check for fingerprint appointments...');
  getAdminApp();
  const db = adminDb();

  const appointmentsSnapshot = await db.ref('fingerprintAppointments').get();
  const appointments: FingerprintAppointment[] = objectToArray(appointmentsSnapshot.val());

  if (!appointments.length) {
    console.log('No appointments found.');
    return { notificationsCreated: 0, emailsSent: 0 };
  }

  const today = startOfDay(new Date());

  const upcomingAppointments = appointments
    .map(apt => {
      const aptDate = parseMaybeDate(apt.appointmentDate);
      if (!aptDate) return null;
      const daysRemaining = differenceInDays(startOfDay(aptDate), today);
      if (daysRemaining >= 0 && daysRemaining <= 3) return { ...apt, daysRemaining };
      return null;
    })
    .filter((apt): apt is FingerprintAppointment & { daysRemaining: number } => apt !== null);

  if (!upcomingAppointments.length) return { notificationsCreated: 0, emailsSent: 0 };

  // 1. In-app notification
  const employeeNames = upcomingAppointments.map(apt => apt.employeeFullName).join(', ');
  const newNotification: Omit<AppNotification, 'id'> = {
    title: `Przypomnienie: Nadchodzące terminy na odciski palców (${upcomingAppointments.length})`,
    message: `Pamiętaj o nadchodzących terminach dla: ${employeeNames}.`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  await db.ref('notifications').push(newNotification);

  // 2. Email notification
  const employeeDetails = upcomingAppointments
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .map(apt => {
      const d = apt.daysRemaining;
      const dayText = d === 0 ? 'dzisiaj' : d === 1 ? 'jutro' : `za ${d} dni`;
      const aptDateObj = parseMaybeDate(apt.appointmentDate);
      const dateStr = aptDateObj ? format(aptDateObj, 'dd.MM.yyyy HH:mm') : apt.appointmentDate;
      return `<li><strong>${apt.employeeFullName}</strong> - ${dateStr} (${dayText})</li>`;
    })
    .join('');

  const emailBody = `<h1>Przypomnienie o terminach na odciski palców</h1><p>Poniżej znajduje się lista nadchodzących wizyt:</p><ul>${employeeDetails}</ul><p>Proszę upewnić się, że pracownicy są poinformowani.</p>`;
  const emailResult = await sendEmail({
    subject: `Przypomnienie: ${upcomingAppointments.length} terminów na odciski palców wkrótce`,
    body: emailBody,
  });

  let emailsSentCount = 0;
  if (emailResult.success) {
    emailsSentCount = 1;
  } else {
    const errorNotification: Omit<AppNotification, 'id'> = {
      title: 'Błąd wysyłania Email (Odciski)',
      message: `Nie udało się wysłać powiadomienia email. Błąd: ${emailResult.message}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    await db.ref('notifications').push(errorNotification);
  }

  return { notificationsCreated: 1, emailsSent: emailsSentCount };
}
