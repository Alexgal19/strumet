'use server';
/**
 * @fileOverview A flow to create a weekly snapshot of employee statistics.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ref, get } from 'firebase/database';
import { adminDb } from '@/lib/firebase-admin';
import { format, parse } from 'date-fns';
import type { Employee, StatsSnapshot } from '@/lib/types';

const objectToArray = <T>(obj: Record<string, any> | undefined | null): (T & { id: string })[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

const sanitizeKey = (key: string) => key.replace(/[.#$/\[\]]/g, '-');

const CreateSnapshotInputSchema = z.object({
  startDate: z.string(),
  endDate: z.string().optional(),
});

const SnapshotDataSchema = z.object({
  total: z.number(),
  date: z.string(),
  deptChanges: z.array(z.object({ name: z.string(), from: z.number(), to: z.number(), diff: z.number() })),
  jobTitleChanges: z.array(z.object({ name: z.string(), from: z.number(), to: z.number(), diff: z.number() })),
  nationalityChanges: z.array(z.object({ name: z.string(), from: z.number(), to: z.number(), diff: z.number() })),
});

const CreateSnapshotOutputSchema = z.object({
  isRange: z.boolean(),
  start: SnapshotDataSchema.optional(),
  end: SnapshotDataSchema.optional(),
  diff: z.number().optional(),
  newHires: z.array(z.string()).optional(),
  terminated: z.array(z.string()).optional(),
  date: z.string().optional(),
  total: z.number().optional(),
  deptChanges: z.array(z.object({ name: z.string(), to: z.number() })).optional(),
  jobTitleChanges: z.array(z.object({ name: z.string(), to: z.number() })).optional(),
  nationalityChanges: z.array(z.object({ name: z.string(), to: z.number() })).optional(),
});

export async function createStatsSnapshot(input: z.infer<typeof CreateSnapshotInputSchema>): Promise<z.infer<typeof CreateSnapshotOutputSchema>> {
  return createStatsSnapshotFlow(input);
}

const getSnapshotForDate = async (date: string): Promise<{ data: any[], total: number }> => {
    const snapshotRef = adminDb().ref(`statisticsHistory/${date}`);
    const snapshot = await snapshotRef.once('value');
    if (!snapshot.exists()) {
        // If no snapshot, fetch live data as a fallback
        const employeesRef = adminDb().ref('employees');
        const empSnapshot = await employeesRef.once('value');
        const allEmployees = objectToArray<Employee>(empSnapshot.val());
        const activeEmployees = allEmployees.filter(e => {
            const hireDate = parse(e.hireDate, 'yyyy-MM-dd', new Date());
            const termDate = e.terminationDate ? parse(e.terminationDate, 'yyyy-MM-dd', new Date()) : null;
            const targetDate = parse(date, 'yyyy-MM-dd', new Date());
            
            return hireDate <= targetDate && (!termDate || termDate > targetDate);
        });
        return { data: activeEmployees, total: activeEmployees.length };
    }
    const snapData = snapshot.val();
    // This part is tricky because we don't store raw employee list in snapshot.
    // For now, let's just use the aggregated data. We will need to adjust the comparison logic.
    // A better approach would be to calculate stats from raw employee data for the given date.
    // Let's refactor to do that. See above.
    
    // For now, let's return what we have, this will require client-side adjustment
    return { data: [], total: snapData.totalActive };
};

const createStatsSnapshotFlow = ai.defineFlow(
  {
    name: 'createStatsSnapshotFlow',
    inputSchema: CreateSnapshotInputSchema,
    outputSchema: CreateSnapshotOutputSchema,
  },
  async ({ startDate, endDate }) => {
    console.log(`Generating report for ${startDate} to ${endDate}`);

    const employeesSnapshot = await adminDb().ref('employees').once('value');
    const allEmployees = objectToArray<Employee>(employeesSnapshot.val());

    const getActiveEmployeesOnDate = (date: Date) => {
        return allEmployees.filter(e => {
            if (!e.hireDate) return false;
            const hireDate = parse(e.hireDate, 'yyyy-MM-dd', new Date());
            if (hireDate > date) return false;
            if (e.status === 'zwolniony' && e.terminationDate) {
                const termDate = parse(e.terminationDate, 'yyyy-MM-dd', new Date());
                if (termDate <= date) return false;
            }
            return true;
        });
    };

    const getCounts = (employees: Employee[], key: keyof Employee) => {
      return employees.reduce((acc, item) => {
        const value = item[key] as string;
        if(value) acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    };

    if (endDate) {
        // --- RANGE MODE ---
        const start = parse(startDate, 'yyyy-MM-dd', new Date());
        const end = parse(endDate, 'yyyy-MM-dd', new Date());

        const startData = getActiveEmployeesOnDate(start);
        const endData = getActiveEmployeesOnDate(end);

        const startMap = new Map(startData.map(item => [item.id, item]));
        const endMap = new Map(endData.map(item => [item.id, item]));

        const newHires = Array.from(endMap.keys()).filter(key => !startMap.has(key)).map(key => endMap.get(key)!.fullName);
        const terminated = Array.from(startMap.keys()).filter(key => !endMap.has(key)).map(key => startMap.get(key)!.fullName);

        const compareGroups = (startCounts: Record<string, number>, endCounts: Record<string, number>) => {
            const allKeys = new Set([...Object.keys(startCounts), ...Object.keys(endCounts)]);
            const changes: any[] = [];
            allKeys.forEach(groupName => {
                const startCount = startCounts[groupName] || 0;
                const endCount = endCounts[groupName] || 0;
                if (startCount !== endCount) {
                    changes.push({ name: groupName, from: startCount, to: endCount, diff: endCount - startCount });
                }
            });
            return changes.sort((a,b) => b.to - a.to);
        }

        return {
            isRange: true,
            start: { total: startData.length, date: format(start, 'dd.MM.yyyy'), deptChanges: [], jobTitleChanges: [], nationalityChanges: [] },
            end: { total: endData.length, date: format(end, 'dd.MM.yyyy'), deptChanges: [], jobTitleChanges: [], nationalityChanges: [] },
            diff: endData.length - startData.length,
            newHires,
            terminated,
            deptChanges: compareGroups(getCounts(startData, 'department'), getCounts(endData, 'department')),
            jobTitleChanges: compareGroups(getCounts(startData, 'jobTitle'), getCounts(endData, 'jobTitle')),
            nationalityChanges: compareGroups(getCounts(startData, 'nationality'), getCounts(endData, 'nationality')),
        };

    } else {
        // --- SINGLE DAY MODE ---
        const singleDate = parse(startDate, 'yyyy-MM-dd', new Date());
        const data = getActiveEmployeesOnDate(singleDate);
        
        const formatForSingleDay = (counts: Record<string, number>) => {
            return Object.entries(counts).map(([name, count]) => ({ name, to: count })).sort((a,b)=>b.to - a.to);
        }

        return {
            isRange: false,
            date: format(singleDate, 'dd.MM.yyyy'),
            total: data.length,
            deptChanges: formatForSingleDay(getCounts(data, 'department')),
            jobTitleChanges: formatForSingleDay(getCounts(data, 'jobTitle')),
            nationalityChanges: formatForSingleDay(getCounts(data, 'nationality')),
        };
    }
  }
);
