
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
import { isSameDay, addDays, startOfDay, format } from 'date-fns';
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
    const notificationDate = addDays(today, 3); // Check for 3 days in advance

    const upcomingAppointments = appointments.filter(apt => {
        const aptDate = parseMaybeDate(apt.appointmentDate);
        if (!aptDate) return false;
        return isSameDay(startOfDay(aptDate), notificationDate);
    });

    console.log(`Found ${upcomingAppointments.length} appointments for ${notificationDate.toDateString()}.`);

    if (upcomingAppointments.length === 0) {
        return { notificationsCreated: 0, emailsSent: 0 };
    }
    
    const employeeNames = upcomingAppointments.map(apt => apt.employeeFullName).join(', ');
    const title = `Przypomnienie: Odciski palców za 3 dni (${upcomingAppointments.length})`;
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
    const emailSubject = `Przypomnienie: ${upcomingAppointments.length} terminów na odciski palców za 3 dni`;
    const employeeDetails = upcomingAppointments
        .map(apt => `<li><strong>${apt.employeeFullName}</strong> - ${format(parseMaybeDate(apt.appointmentDate)!, 'dd.MM.yyyy HH:mm')}</li>`)
        .join('');

    const emailBody = `
        <h1>Przypomnienie o terminach na odciski palców</h1>
        <p>Za 3 dni, dnia ${format(notificationDate, 'dd.MM.yyyy')}, następujący pracownicy mają umówione wizyty:</p>
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
