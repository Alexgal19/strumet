'use server';
/**
 * @fileOverview A flow to check for upcoming fingerprint appointments and send notifications.
 *
 * - checkAppointmentsAndNotify - A function that checks for appointments and sends notifications.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { isAfter, isSameDay, addDays, startOfDay } from 'date-fns';
import type { FingerprintAppointment } from '@/lib/types';
import { sendEmail } from '@/lib/email-tool';

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

const NOTIFICATION_EMAIL = 'o.holiadynets@smartwork.pl';

const CheckAppointmentsOutputSchema = z.object({
  sentNotifications: z.array(z.object({
    employeeName: z.string(),
    appointmentDate: z.string(),
  })),
  notificationCount: z.number(),
});

export async function checkAppointmentsAndNotify(): Promise<z.infer<typeof CheckAppointmentsOutputSchema>> {
  return checkAppointmentsAndNotifyFlow();
}

const checkAppointmentsAndNotifyFlow = ai.defineFlow(
  {
    name: 'checkAppointmentsAndNotifyFlow',
    outputSchema: CheckAppointmentsOutputSchema,
    tools: [sendEmail]
  },
  async () => {
    console.log('Starting to check for fingerprint appointments...');
    
    const appointmentsRef = ref(db, 'fingerprintAppointments');
    const snapshot = await get(appointmentsRef);
    const appointments = objectToArray<FingerprintAppointment>(snapshot.val());

    if (!appointments || appointments.length === 0) {
      console.log('No fingerprint appointments found.');
      return { sentNotifications: [], notificationCount: 0 };
    }
    
    const today = startOfDay(new Date());
    const notificationDate = addDays(today, 2);

    const upcomingAppointments = appointments.filter(apt => {
        try {
            const aptDate = startOfDay(new Date(apt.appointmentDate));
            return isSameDay(aptDate, notificationDate);
        } catch (e) {
            return false;
        }
    });

    console.log(`Found ${upcomingAppointments.length} appointments for ${notificationDate.toDateString()}.`);

    if (upcomingAppointments.length === 0) {
        return { sentNotifications: [], notificationCount: 0 };
    }
    
    const employeeNames = upcomingAppointments.map(apt => apt.employeeFullName).join(', ');
    const subject = `Nadchodzące terminy na odciski palców (${upcomingAppointments.length})`;
    const body = `
        Witaj,
        
        To jest automatyczne przypomnienie o nadchodzących terminach na pobranie odcisków palców za 2 dni.
        
        Pracownicy:
        - ${upcomingAppointments.map(apt => `${apt.employeeFullName} (data: ${new Date(apt.appointmentDate).toLocaleString('pl-PL')})`).join('\n- ')}
        
        Pozdrawiamy,
        HOL Manager System
    `;

    await ai.generate({
        prompt: `Wyślij email z przypomnieniem o terminach na odciski palców. Treść emaila: ${body}`,
        tools: [sendEmail],
        toolChoice: 'required'
    });
    
    const sentNotifications = upcomingAppointments.map(apt => ({
        employeeName: apt.employeeFullName,
        appointmentDate: apt.appointmentDate,
    }));
    
    console.log(`Sent notification for ${upcomingAppointments.length} appointments.`);

    return {
      sentNotifications,
      notificationCount: sentNotifications.length
    };
  }
);
