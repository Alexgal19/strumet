
'use server';
/**
 * @fileOverview A flow to create a weekly snapshot of employee statistics.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { collection, getDocs } from 'firebase/firestore';
import { format, parse, isEqual } from 'date-fns';
import type { Employee, StatsSnapshot } from '@/lib/types';


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

const EmployeeChangeSchema = z.object({
    fullName: z.string(),
    jobTitle: z.string(),
    department: z.string(),
    date: z.string(),
    avatarDataUri: z.string().optional(),
});

const FieldChangeSchema = z.object({
    fullName: z.string(),
    avatarDataUri: z.string().optional(),
    date: z.string(),
    type: z.literal('department'),
    from: z.string(),
    to: z.string(),
});


const CreateSnapshotOutputSchema = z.object({
  isRange: z.boolean(),
  start: SnapshotDataSchema.optional(),
  end: SnapshotDataSchema.optional(),
  diff: z.number().optional(),
  newHires: z.array(EmployeeChangeSchema).optional(),
  terminated: z.array(EmployeeChangeSchema).optional(),
  fieldChanges: z.array(FieldChangeSchema).optional(),
  date: z.string().optional(),
  total: z.number().optional(),
  deptChanges: z.array(z.object({ name: z.string(), to: z.number() })).optional(),
  jobTitleChanges: z.array(z.object({ name: z.string(), to: z.number() })).optional(),
  nationalityChanges: z.array(z.object({ name: z.string(), to: z.number() })).optional(),
});

export async function createStatsSnapshot(input: z.infer<typeof CreateSnapshotInputSchema>): Promise<z.infer<typeof CreateSnapshotOutputSchema>> {
  return createStatsSnapshotFlow(input);
}

const createStatsSnapshotFlow = ai.defineFlow(
  {
    name: 'createStatsSnapshotFlow',
    inputSchema: CreateSnapshotInputSchema,
    outputSchema: CreateSnapshotOutputSchema,
  },
  async ({ startDate, endDate }) => {
    console.log(`Generating report for ${startDate} to ${endDate}`);
    getAdminApp();
    const db = getFirestore();

    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    const allEmployees = employeesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Employee[];

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
    
    const employeeToChangeSchema = (emp: Employee, date: string) => ({
        fullName: emp.fullName,
        jobTitle: emp.jobTitle,
        department: emp.department,
        date: date,
        avatarDataUri: emp.avatarDataUri,
    });

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

        const newHires = Array.from(endMap.values())
            .filter(emp => !startMap.has(emp.id))
            .map(emp => employeeToChangeSchema(emp, emp.hireDate));

        const terminated = Array.from(startMap.values())
             .filter(emp => !endMap.has(emp.id))
             .map(emp => employeeToChangeSchema(emp, emp.terminationDate || format(end, 'yyyy-MM-dd')));
             
        const continuingEmployeesIds = Array.from(startMap.keys()).filter(id => endMap.has(id));
        
        const fieldChanges: z.infer<typeof FieldChangeSchema>[] = [];
        continuingEmployeesIds.forEach(id => {
            const startEmp = startMap.get(id)!;
            const endEmp = endMap.get(id)!;

            if (startEmp.department !== endEmp.department) {
                fieldChanges.push({
                    fullName: endEmp.fullName,
                    avatarDataUri: endEmp.avatarDataUri,
                    date: format(end, 'yyyy-MM-dd'),
                    type: 'department',
                    from: startEmp.department || 'Brak',
                    to: endEmp.department || 'Brak',
                });
            }
            // Add other fields to track here in the future
        });

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
            fieldChanges,
            deptChanges: compareGroups(getCounts(startData, 'department'), getCounts(endData, 'department')),
            jobTitleChanges: compareGroups(getCounts(startData, 'jobTitle'), getCounts(endData, 'jobTitle')),
            nationalityChanges: compareGroups(getCounts(startData, 'nationality'), getCounts(endData, 'nationality')),
        };

    } else {
        // --- SINGLE DAY MODE ---
        const singleDate = parse(startDate, 'yyyy-MM-dd', new Date());
        const data = getActiveEmployeesOnDate(singleDate);
        
        const newHires = allEmployees
            .filter(e => e.hireDate && isEqual(parse(e.hireDate, 'yyyy-MM-dd', new Date()), singleDate))
            .map(emp => employeeToChangeSchema(emp, emp.hireDate));
            
        const terminated = allEmployees
            .filter(e => e.terminationDate && isEqual(parse(e.terminationDate, 'yyyy-MM-dd', new Date()), singleDate))
            .map(emp => employeeToChangeSchema(emp, emp.terminationDate!));
        
        const formatForSingleDay = (counts: Record<string, number>) => {
            return Object.entries(counts).map(([name, count]) => ({ name, to: count })).sort((a,b)=>b.to - a.to);
        }

        return {
            isRange: false,
            date: format(singleDate, 'dd.MM.yyyy'),
            total: data.length,
            newHires,
            terminated,
            fieldChanges: [], // No field change detection in single day mode
            deptChanges: formatForSingleDay(getCounts(data, 'department')),
            jobTitleChanges: formatForSingleDay(getCounts(data, 'jobTitle')),
            nationalityChanges: formatForSingleDay(getCounts(data, 'nationality')),
        };
    }
  }
);
