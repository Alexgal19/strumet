
'use server';

import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, get } from 'firebase/database';
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { Employee } from '@/lib/types';
import { ai } from '@/ai/genkit';

const objectToArray = <T>(obj: Record<string, any> | undefined | null): (T & { id: string })[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

const ArchiveOutputSchema = z.object({
  filePath: z.string(),
  activeCount: z.number(),
  terminatedCount: z.number(),
});
type ArchiveOutput = z.infer<typeof ArchiveOutputSchema>;

export async function archiveEmployees(): Promise<ArchiveOutput> {
  return archiveEmployeesFlow();
}

const archiveEmployeesFlow = ai.defineFlow(
  {
    name: 'archiveEmployeesFlow',
    outputSchema: ArchiveOutputSchema,
  },
  async () => {
    console.log('Starting daily employee archival to Excel...');
    
    const employeesRef = dbRef(db, 'employees');
    const snapshot = await get(employeesRef);
    const allEmployees = objectToArray<Employee>(snapshot.val());

    if (allEmployees.length === 0) {
        throw new Error('Brak pracowników do zarchiwizowania.');
    }

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
    const fileRef = storageRef(storage, filePath);
    
    const metadata = {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    await uploadBytes(fileRef, excelBuffer, metadata);

    console.log(`Successfully archived ${activeEmployees.length} active and ${terminatedEmployees.length} terminated employees to ${filePath}`);

    return {
      filePath,
      activeCount: activeEmployees.length,
      terminatedCount: terminatedEmployees.length,
    };
  }
);
