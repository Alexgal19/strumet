
'use server';
/**
 * @fileOverview A flow to create a weekly snapshot of employee statistics.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { format, subDays } from 'date-fns';
import type { Employee, StatsSnapshot } from '@/lib/types';

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
    const yesterdayId = format(subDays(snapshotDate, 1), 'yyyy-MM-dd');
    
    // Get yesterday's snapshot to calculate diffs
    const yesterdaySnapshotRef = ref(db, `statisticsHistory/${yesterdayId}`);
    const yesterdaySnapshotData = (await get(yesterdaySnapshotRef)).val() as StatsSnapshot | null;

    let newHires = 0;
    let terminations = 0;

    if (yesterdaySnapshotData) {
        const totalActiveToday = activeEmployees.length;
        const totalActiveYesterday = yesterdaySnapshotData.totalActive;
        
        const diff = totalActiveToday - totalActiveYesterday;

        if (diff > 0) {
            newHires = diff;
        } else if (diff < 0) {
            terminations = -diff; // make it positive
        }
    }
    // If no snapshot yesterday, we can't calculate diff, so it remains 0.

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
      newHires: newHires,
      terminations: terminations,
    };

    const snapshotRef = ref(db, `statisticsHistory/${snapshotId}`);
    await set(snapshotRef, newSnapshot);

    console.log(`Successfully created statistics snapshot with ID: ${snapshotId}`);

    return {
      snapshotId,
      totalActive: activeEmployees.length,
      newHires: newHires,
      terminations: terminations,
    };
  }
);

