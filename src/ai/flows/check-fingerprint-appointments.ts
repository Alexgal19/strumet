
'use server';
/**
 * @fileOverview A flow to check for upcoming fingerprint appointments and send notifications.
 *
 * - checkAppointmentsAndNotify - A function that checks for appointments and sends notifications.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { startOfDay, differenceInDays, format } from 'date-fns';
import type { FingerprintAppointment, AppNotification } from '@/lib/types';
import { parseMaybeDate } from '@/lib/date';
import { sendEmail } from '@/lib/email-tool';


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
    console.log('DEBUG: [checkAppointmentsAndNotifyFlow] Starting flow.');
    getAdminApp();
    const db = getFirestore();
    
    const appointmentsSnapshot = await getDocs(collection(db, "fingerprintAppointments"));
    const appointments = appointmentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as FingerprintAppointment[];


    console.log(`DEBUG: Found ${appointments.length} total appointments in Firebase.`);

    if (!appointments || appointments.length === 0) {
      console.log('DEBUG: No appointments found. Exiting flow.');
      return { notificationsCreated: 0, emailsSent: 0 };
    }
    
    const today = startOfDay(new Date());
    console.log(`DEBUG: Today's date (start of day) is: ${today.toISOString()}`);

    const upcomingAppointments = appointments
        .map(apt => {
            const aptDate = parseMaybeDate(apt.appointmentDate);
            if (!aptDate) {
                console.log(`DEBUG: Skipping appointment ID ${apt.id} due to invalid date:`, apt.appointmentDate);
                return null;
            }
            
            const daysRemaining = differenceInDays(startOfDay(aptDate), today);
            
            console.log(`DEBUG: Checking appointment for ${apt.employeeFullName} on ${apt.appointmentDate}. Days remaining: ${daysRemaining}`);

            if (daysRemaining >= 0 && daysRemaining <= 3) {
                console.log(`DEBUG: MATCH FOUND for ${apt.employeeFullName}. Days remaining: ${daysRemaining}.`);
                return { ...apt, daysRemaining };
            }
            return null;
        })
        .filter((apt): apt is FingerprintAppointment & { daysRemaining: number } => apt !== null);


    console.log(`DEBUG: Found ${upcomingAppointments.length} upcoming appointments in the next 3 days.`);

    if (upcomingAppointments.length === 0) {
        console.log('DEBUG: No upcoming appointments match the criteria. Exiting flow.');
        return { notificationsCreated: 0, emailsSent: 0 };
    }
    
    const employeeNames = upcomingAppointments.map(apt => apt.employeeFullName).join(', ');
    const title = `Przypomnienie: Nadchodzące terminy na odciski palców (${upcomingAppointments.length})`;
    const message = `Pamiętaj o nadchodzących terminach na pobranie odcisków palców dla następujących pracowników: ${employeeNames}.`;
    
    // 1. Create in-app notification
    console.log('DEBUG: Creating in-app notification...');
    const newNotification: Omit<AppNotification, 'id'> = {
        title,
        message,
        createdAt: new Date().toISOString(),
        read: false,
    };
    await addDoc(collection(db, "notifications"), newNotification);
    console.log(`DEBUG: Created notification for ${upcomingAppointments.length} appointments.`);

    // 2. Send email notification
    console.log('DEBUG: Preparing email notification...');
    const emailSubject = `Przypomnienie: ${upcomingAppointments.length} terminów na odciski palców wkrótce`;
    const employeeDetails = upcomingAppointments
        .sort((a, b) => a.daysRemaining - b.daysRemaining)
        .map(apt => {
            let dayText = `za ${apt.daysRemaining} dni`;
            if (apt.daysRemaining === 1) dayText = 'jutro';
            if (apt.daysRemaining === 0) dayText = 'dzisiaj';
            const aptDate = parseMaybeDate(apt.appointmentDate);
            if (!aptDate) return '';
            return `<li><strong>${apt.employeeFullName}</strong> - ${format(aptDate, 'dd.MM.yyyy HH:mm')} (${dayText})</li>`
        })
        .join('');

    const emailBody = `
        <h1>Przypomnienie o terminach na odciski palców</h1>
        <p>Poniżej znajduje się lista nadchodzących wizyt:</p>
        <ul>${employeeDetails}</ul>
        <p>Proszę upewnić się, że pracownicy są poinformowani.</p>
    `;
    
    console.log('DEBUG: Sending email...');
    const emailResult = await sendEmail({ subject: emailSubject, body: emailBody });

    let emailsSentCount = 0;
    if(emailResult.success) {
        console.log(`DEBUG: Email sent successfully for ${upcomingAppointments.length} appointments.`);
        emailsSentCount = 1;
    } else {
        console.error(`DEBUG: Failed to send email: ${emailResult.message}`);
        // Create an error notification in-app
        const errorNotification: Omit<AppNotification, 'id'> = {
            title: 'Błąd wysyłania Email (Odciski)',
            message: `Nie udało się wysłać powiadomienia email o terminach. Błąd: ${emailResult.message}`,
            createdAt: new Date().toISOString(),
            read: false,
        };
        await addDoc(collection(db, "notifications"), errorNotification);
    }

    return {
      notificationsCreated: 1,
      emailsSent: emailsSentCount,
    };
  }
);
