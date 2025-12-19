
'use server';
/**
 * @fileOverview A flow to manually archive all employee data to an Excel file in Firebase Storage.
 * - archiveEmployees - A Server Action that handles the archival process.
 * - ArchiveOutput - The return type for the archiveEmployees function.
 */

import { adminDb, adminStorage } from '@/lib/firebase-admin';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { Employee } from '@/lib/types';
import { z } from 'zod';

const objectToArray = <T>(obj: Record<string, any> | undefined | null): (T & { id: string })[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

const ArchiveOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  filePath: z.string().optional(),
});
export type ArchiveOutput = z.infer<typeof ArchiveOutputSchema>;

export async function archiveEmployees(): Promise<ArchiveOutput> {
  try {
    console.log('SERVER ACTION: Starting manual employee archival...');
    
    const employeesRef = adminDb().ref('employees');
    const snapshot = await employeesRef.once('value');
    const allEmployees = objectToArray<Employee>(snapshot.val());

    if (allEmployees.length === 0) {
        const msg = 'Brak pracowników do zarchiwizowania.';
        console.log(`SERVER ACTION: ${msg}`);
        return { success: false, message: msg };
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
    const file = adminStorage().bucket().file(filePath);
    
    await file.save(excelBuffer, {
        metadata: {
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }
    });

    const message = `Successfully archived ${activeEmployees.length} active and ${terminatedEmployees.length} terminated employees to ${filePath}`;
    console.log(`SERVER ACTION: ${message}`);

    return { success: true, message, filePath };

  } catch (error: any) {
    console.error('SERVER ACTION ERROR (archiveEmployees):', error);
    return {
      success: false,
      message: error.message || 'An unknown server error occurred during archival.',
    };
  }
}
