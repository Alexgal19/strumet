
'use server';
/**
 * @fileOverview A flow to archive employee data to an Excel file in Firebase Storage.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { Employee } from '@/lib/types';

const objectToArray = <T>(obj: Record<string, any> | undefined | null): (T & { id: string })[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

const ArchiveOutputSchema = z.object({
  filePath: z.string(),
  activeCount: z.number(),
  terminatedCount: z.number(),
});
export type ArchiveOutput = z.infer<typeof ArchiveOutputSchema>;

const archiveEmployeesFlow = ai.defineFlow(
  {
    name: 'archiveEmployeesFlow',
    outputSchema: ArchiveOutputSchema,
  },
  async () => {
    console.log('Starting daily employee archival to Excel...');
    
    const db = adminDb();
    const storage = adminStorage();

    if (!db || !storage) {
        throw new Error('Firebase Admin SDK not initialized.');
    }

    const employeesRef = db.ref('employees');
    const snapshot = await employeesRef.once('value');
    const allEmployees = objectToArray<Employee>(snapshot.val());

    const activeEmployees = allEmployees.filter(e => e.status === 'aktywny');
    const terminatedEmployees = allEmployees.filter(e => e.status === 'zwolniony');
    
    const activeSheetData = activeEmployees.map(e => ({
        'Nazwisko i imię': e.fullName,
        'Data zatrudnienia': e.hireDate,
        'Umowa do': e.contractEndDate,
        'Stanowisko': e.jobTitle,
        'Dział': e.department,
        'Kierownik': e.manager,
        'Nr karty': e.cardNumber,
        'Narodowość': e.nationality,
        'Status legalizacyjny': e.legalizationStatus,
    }));
    
    const terminatedSheetData = terminatedEmployees.map(e => ({
        'Nazwisko i imię': e.fullName,
        'Data zatrudnienia': e.hireDate,
        'Data zwolnienia': e.terminationDate,
        'Stanowisko': e.jobTitle,
        'Dział': e.department,
        'Kierownik': e.manager,
        'Nr karty': e.cardNumber,
        'Narodowość': e.nationality,
    }));

    const wb = XLSX.utils.book_new();
    const wsActive = XLSX.utils.json_to_sheet(activeSheetData);
    const wsTerminated = XLSX.utils.json_to_sheet(terminatedSheetData);

    XLSX.utils.book_append_sheet(wb, wsActive, 'Pracownicy aktywni');
    XLSX.utils.book_append_sheet(wb, wsTerminated, 'Pracownicy zwolnieni');
    
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const today = format(new Date(), 'yyyy-MM-dd');
    const fileName = `employees_${today}.xlsx`;
    const filePath = `archives/${fileName}`;
    const file = storage.bucket().file(filePath);

    await file.save(excelBuffer, {
        metadata: {
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
    });

    console.log(`Successfully archived ${activeEmployees.length} active and ${terminatedEmployees.length} terminated employees to ${filePath}`);

    return {
      filePath,
      activeCount: activeEmployees.length,
      terminatedCount: terminatedEmployees.length,
    };
  }
);

export async function archiveEmployees(): Promise<ArchiveOutput> {
    return archiveEmployeesFlow();
}
