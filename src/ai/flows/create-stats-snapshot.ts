
'use server';
/**
 * @fileOverview A flow to create a weekly snapshot of employee statistics.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import type { Employee, StatsSnapshot } from '@/lib/types';

const objectToArray = <T>(obj: Record<string, any> | undefined | null): (T & { id: string })[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

const CreateSnapshotOutputSchema = z.object({
  snapshotId: z.string(),
  totalActive: z.number(),
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

    if (!activeEmployees || activeEmployees.length === 0) {
      console.log('No active employees found. Skipping snapshot.');
      throw new Error('No active employees to create a snapshot from.');
    }
    
    const departmentCounts: Record<string, number> = {};
    const jobTitleCounts: Record<string, number> = {};
    const nationalityCounts: Record<string, number> = {};

    activeEmployees.forEach(emp => {
      if (emp.department) {
        departmentCounts[emp.department] = (departmentCounts[emp.department] || 0) + 1;
      }
      if (emp.jobTitle) {
        jobTitleCounts[emp.jobTitle] = (jobTitleCounts[emp.jobTitle] || 0) + 1;
      }
      if (emp.nationality) {
        nationalityCounts[emp.nationality] = (nationalityCounts[emp.nationality] || 0) + 1;
      }
    });

    const snapshotDate = new Date();
    const snapshotId = format(snapshotDate, 'yyyy-MM-dd');

    const newSnapshot: Omit<StatsSnapshot, 'id'> = {
      totalActive: activeEmployees.length,
      departments: departmentCounts,
      jobTitles: jobTitleCounts,
      nationalities: nationalityCounts,
    };

    const snapshotRef = ref(db, `statisticsHistory/${snapshotId}`);
    await set(snapshotRef, newSnapshot);

    console.log(`Successfully created statistics snapshot with ID: ${snapshotId}`);

    return {
      snapshotId,
      totalActive: activeEmployees.length,
    };
  }
);
