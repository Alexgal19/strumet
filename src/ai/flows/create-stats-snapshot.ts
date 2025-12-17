
'use server';
/**
 * @fileOverview A flow to create a weekly snapshot of employee statistics.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { format, isSameDay, parseISO } from 'date-fns';
import type { Employee, StatsSnapshot } from '@/lib/types';
import { parseMaybeDate } from '@/lib/date';

const objectToArray = <T>(obj: Record<string, any> | undefined | null): (T & { id: string })[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

// Function to sanitize keys for Firebase
const sanitizeKey = (key: string) => key.replace(/[.#$/\[\]]/g, '-');


const CreateSnapshotOutputSchema = z.object({
  snapshotId: z.string(),
  totalActive: z.number(),
  newHires: z.number(),
  terminations: z.number(),
});

export async function createStatsSnapshot(): Promise<z.infer<typeof CreateSnapshotOutputSchema>> {
  return createStatsSnapshotFlow();
}

const createStatsSnapshotFlow = ai.defineFlow(
  {
    name: 'createStatsSnapshotFlow',
    outputSchema: CreateSnapshotOutputSchema,
  },
  async () => {
    console.log('Starting to create statistics snapshot...');
    
    const employeesRef = ref(db, 'employees');
    const snapshot = await get(employeesRef);
    const allEmployees = objectToArray<Employee>(snapshot.val());
    const activeEmployees = allEmployees.filter(e => e.status === 'aktywny');
    
    const snapshotDate = new Date();
    const snapshotId = format(snapshotDate, 'yyyy-MM-dd');

    const newHiresToday = allEmployees.filter(e => {
        const hireDate = parseMaybeDate(e.hireDate);
        return hireDate && isSameDay(hireDate, snapshotDate);
    }).length;

    const terminationsToday = allEmployees.filter(e => {
        const termDate = parseMaybeDate(e.terminationDate);
        return termDate && isSameDay(termDate, snapshotDate);
    }).length;

    const departmentCounts: Record<string, number> = {};
    const jobTitleCounts: Record<string, number> = {};
    const nationalityCounts: Record<string, number> = {};

    activeEmployees.forEach(emp => {
      if (emp.department) {
        const key = sanitizeKey(emp.department);
        departmentCounts[key] = (departmentCounts[key] || 0) + 1;
      }
      if (emp.jobTitle) {
        const key = sanitizeKey(emp.jobTitle);
        jobTitleCounts[key] = (jobTitleCounts[key] || 0) + 1;
      }
      if (emp.nationality) {
        const key = sanitizeKey(emp.nationality);
        nationalityCounts[key] = (nationalityCounts[key] || 0) + 1;
      }
    });


    const newSnapshot: StatsSnapshot = {
      id: snapshotId,
      totalActive: activeEmployees.length,
      departments: departmentCounts,
      jobTitles: jobTitleCounts,
      nationalities: nationalityCounts,
      newHires: newHiresToday,
      terminations: terminationsToday,
    };

    const snapshotRef = ref(db, `statisticsHistory/${snapshotId}`);
    await set(snapshotRef, newSnapshot);

    console.log(`Successfully created statistics snapshot with ID: ${snapshotId}`);

    return {
      snapshotId,
      totalActive: activeEmployees.length,
      newHires: newHiresToday,
      terminations: terminationsToday,
    };
  }
);
