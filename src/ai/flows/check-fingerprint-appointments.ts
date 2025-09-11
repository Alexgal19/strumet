
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
import { isSameDay, addDays, startOfDay } from 'date-fns';
import type { FingerprintAppointment, AppNotification } from '@/lib/types';

const objectToArray = <T>(obj: Record<string, any> | undefined | null): (T & { id: string })[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

const CheckAppointmentsOutputSchema = z.object({
  notificationsCreated: z.number(),
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
      return { notificationsCreated: 0 };
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
        return { notificationsCreated: 0 };
    }
    
    const employeeNames = upcomingAppointments.map(apt => apt.employeeFullName).join(', ');
    const title = `Przypomnienie: Odciski palców za 2 dni (${upcomingAppointments.length})`;
    const message = `Pamiętaj o nadchodzących terminach na pobranie odcisków palców dla następujących pracowników: ${employeeNames}.`;
    
    const newNotificationRef = push(ref(db, 'notifications'));
    const newNotification: Omit<AppNotification, 'id'> = {
        title,
        message,
        createdAt: new Date().toISOString(),
        read: false,
    };

    await set(newNotificationRef, newNotification);
    
    console.log(`Created notification for ${upcomingAppointments.length} appointments.`);

    return {
      notificationsCreated: 1
    };
  }
);
