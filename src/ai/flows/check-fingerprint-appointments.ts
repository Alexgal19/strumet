
'use server';
/**
 * @fileOverview A flow to check for upcoming fingerprint appointments and send notifications.
 *
 * - checkAppointmentsAndNotify - A function that checks for appointments and sends notifications.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ref, get, push, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { startOfDay, differenceInDays, format } from 'date-fns';
import type { FingerprintAppointment, AppNotification } from '@/lib/types';
import { parseMaybeDate } from '@/lib/date';
import { sendEmail } from '@/lib/email-tool';

const objectToArray = <T>(obj: Record<string, any> | undefined | null): (T & { id: string })[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

const CheckAppointmentsOutputSchema = z.object({
  notificationsCreated: z.number(),
  emailsSent: z.number(),
});

export async function checkAppointmentsAndNotify(): Promise<z.infer<typeof CheckAppointmentsOutputSchema>> {
  return checkAppointmentsAndNotifyFlow();
}

const checkAppointmentsAndNotifyFlow = ai.defineFlow(
  {
    name: 'checkAppointmentsAndNotifyFlow',
    outputSchema: CheckAppointmentsOutputSchema,
  },
  async () => {
    console.log('Starting to check for fingerprint appointments...');
    
    const appointmentsRef = ref(db, 'fingerprintAppointments');
    const snapshot = await get(appointmentsRef);
    const appointments = objectToArray<FingerprintAppointment>(snapshot.val());

    if (!appointments || appointments.length === 0) {
      console.log('No fingerprint appointments found.');
      return { notificationsCreated: 0, emailsSent: 0 };
    }
    
    const today = startOfDay(new Date());

    const upcomingAppointments = appointments
        .map(apt => {
            const aptDate = parseMaybeDate(apt.appointmentDate);
            if (!aptDate) return null;
            
            const daysRemaining = differenceInDays(startOfDay(aptDate), today);
            
            if (daysRemaining >= 0 && daysRemaining <= 3) {
                return { ...apt, daysRemaining };
            }
            return null;
        })
        .filter((apt): apt is FingerprintAppointment & { daysRemaining: number } => apt !== null);


    console.log(`Found ${upcomingAppointments.length} upcoming appointments in the next 3 days.`);

    if (upcomingAppointments.length === 0) {
        return { notificationsCreated: 0, emailsSent: 0 };
    }
    
    const employeeNames = upcomingAppointments.map(apt => apt.employeeFullName).join(', ');
    const title = `Przypomnienie: Nadchodzące terminy na odciski palców (${upcomingAppointments.length})`;
    const message = `Pamiętaj o nadchodzących terminach na pobranie odcisków palców dla następujących pracowników: ${employeeNames}.`;
    
    // 1. Create in-app notification
    const newNotificationRef = push(ref(db, 'notifications'));
    const newNotification: Omit<AppNotification, 'id'> = {
        title,
        message,
        createdAt: new Date().toISOString(),
        read: false,
    };
    await set(newNotificationRef, newNotification);
    console.log(`Created notification for ${upcomingAppointments.length} appointments.`);

    // 2. Send email notification
    const emailSubject = `Przypomnienie: ${upcomingAppointments.length} terminów na odciski palców wkrótce`;
    const employeeDetails = upcomingAppointments
        .sort((a, b) => a.daysRemaining - b.daysRemaining)
        .map(apt => {
            let dayText = `za ${apt.daysRemaining} dni`;
            if (apt.daysRemaining === 1) dayText = 'jutro';
            if (apt.daysRemaining === 0) dayText = 'dzisiaj';
            return `<li><strong>${apt.employeeFullName}</strong> - ${format(parseMaybeDate(apt.appointmentDate)!, 'dd.MM.yyyy HH:mm')} (${dayText})</li>`
        })
        .join('');

    const emailBody = `
        <h1>Przypomnienie o terminach na odciski palców</h1>
        <p>Poniżej znajduje się lista nadchodzących wizyt:</p>
        <ul>${employeeDetails}</ul>
        <p>Proszę upewnić się, że pracownicy są poinformowani.</p>
    `;

    const emailResult = await sendEmail({ subject: emailSubject, body: emailBody });

    let emailsSentCount = 0;
    if(emailResult.success) {
        console.log(`Email sent successfully for ${upcomingAppointments.length} appointments.`);
        emailsSentCount = 1;
    } else {
        console.error(`Failed to send email: ${emailResult.message}`);
        // Create an error notification in-app
        const errorNotificationRef = push(ref(db, 'notifications'));
        const errorNotification: Omit<AppNotification, 'id'> = {
            title: 'Błąd wysyłania Email (Odciski)',
            message: `Nie udało się wysłać powiadomienia email o terminach. Błąd: ${emailResult.message}`,
            createdAt: new Date().toISOString(),
            read: false,
        };
        await set(errorNotificationRef, errorNotification);
    }

    return {
      notificationsCreated: 1,
      emailsSent: emailsSentCount,
    };
  }
);
