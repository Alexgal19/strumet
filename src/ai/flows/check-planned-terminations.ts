
'use server';
/**
 * @fileOverview A flow to check for planned terminations and update employee status.
 *
 * - checkPlannedTerminations - A function that processes employees whose planned termination date has passed.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { collection, getDocs, writeBatch, addDoc } from 'firebase/firestore';
import { startOfDay, isBefore, isEqual, format } from 'date-fns';
import type { Employee, AppNotification } from '@/lib/types';
import { parseMaybeDate } from '@/lib/date';


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
    const db = getFirestore();
    
    const employeesSnapshot = await getDocs(collection(db, "employees"));
    const allEmployees = employeesSnapshot.docs.map(d => ({id: d.id, ...d.data()})) as Employee[];
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
    
    const batch = writeBatch(db);
    employeesToProcess.forEach(emp => {
        const empRef = doc(db, "employees", emp.id);
        batch.update(empRef, {
            status: 'zwolniony',
            terminationDate: emp.plannedTerminationDate
        });
    });

    await batch.commit();
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
    await addDoc(collection(db, "notifications"), newNotification);
    console.log(`Created in-app notification for ${employeesToProcess.length} processed terminations.`);

    return {
      processedCount: employeesToProcess.length,
      notificationsCreated: 1,
    };
  }
);
