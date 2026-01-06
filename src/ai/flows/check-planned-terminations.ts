
'use server';
/**
 * @fileOverview A flow to check for planned terminations and update employee status.
 *
 * - checkPlannedTerminations - A function that processes employees whose planned termination date has passed.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAdminApp, adminDb } from '@/lib/firebase-admin';
import { startOfDay, isBefore, isEqual } from 'date-fns';
import type { Employee, AppNotification } from '@/lib/types';
import { parseMaybeDate } from '@/lib/date';

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

const CheckTerminationsOutputSchema = z.object({
  processedCount: z.number(),
  notificationsCreated: z.number(),
});

export async function checkPlannedTerminations(): Promise<z.infer<typeof CheckTerminationsOutputSchema>> {
  return checkPlannedTerminationsFlow();
}

const checkPlannedTerminationsFlow = ai.defineFlow(
  {
    name: 'checkPlannedTerminationsFlow',
    outputSchema: CheckTerminationsOutputSchema,
  },
  async () => {
    console.log('Starting to check for planned terminations...');
    getAdminApp();
    const db = adminDb();
    
    const employeesSnapshot = await db.ref("employees").get();
    const allEmployees: Employee[] = objectToArray(employeesSnapshot.val());
    const activeEmployees = allEmployees.filter(e => e.status === 'aktywny');

    if (!activeEmployees || activeEmployees.length === 0) {
      console.log('No active employees found.');
      return { processedCount: 0, notificationsCreated: 0 };
    }
    
    const today = startOfDay(new Date());

    const employeesToProcess = activeEmployees.filter(emp => {
      if (!emp.plannedTerminationDate) return false;
      const terminationDate = parseMaybeDate(emp.plannedTerminationDate);
      if (!terminationDate) return false;
      
      const terminationDayStart = startOfDay(terminationDate);
      // Process if the termination date is today or in the past
      return isBefore(terminationDayStart, today) || isEqual(terminationDayStart, today);
    });

    console.log(`Found ${employeesToProcess.length} employees to terminate based on planned date.`);

    if (employeesToProcess.length === 0) {
        return { processedCount: 0, notificationsCreated: 0 };
    }
    
    const updates: Record<string, any> = {};
    employeesToProcess.forEach(emp => {
        updates[`/employees/${emp.id}/status`] = 'zwolniony';
        updates[`/employees/${emp.id}/terminationDate`] = emp.plannedTerminationDate;
    });

    await db.ref().update(updates);
    console.log(`Successfully processed ${employeesToProcess.length} terminations.`);

    // Create a single in-app notification for all processed terminations
    const employeeNames = employeesToProcess.map(e => e.fullName).join(', ');
    const title = `Automatyczne zwolnienie: ${employeesToProcess.length} pracownik(ów)`;
    const message = `Następujący pracownicy zostali automatycznie przeniesieni do zwolnionych na podstawie planowanej daty: ${employeeNames}.`;
    
    const newNotification: Omit<AppNotification, 'id'> = {
        title,
        message,
        createdAt: new Date().toISOString(),
        read: false,
    };
    await db.ref("notifications").push(newNotification);
    console.log(`Created in-app notification for ${employeesToProcess.length} processed terminations.`);

    return {
      processedCount: employeesToProcess.length,
      notificationsCreated: 1,
    };
  }
);
