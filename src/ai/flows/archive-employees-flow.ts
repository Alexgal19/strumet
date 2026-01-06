
'use server';
/**
 * @fileOverview A flow to manually archive all employee data to an Excel file in Firebase Storage.
 * - archiveEmployees - A Server Action that handles the archival process.
 * - ArchiveOutput - The return type for the archiveEmployees function.
 */
import { getAdminApp, adminStorage } from '@/lib/firebase-admin';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { Employee } from '@/lib/types';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { collection, getDocs } from 'firebase/firestore';


const ArchiveOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  filePath: z.string().optional(),
});
export type ArchiveOutput = z.infer<typeof ArchiveOutputSchema>;

export async function archiveEmployees(): Promise<ArchiveOutput> {
  try {
    console.log('SERVER ACTION: Starting manual employee archival...');
    getAdminApp();
    const db = getFirestore();
    
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    const allEmployees = employeesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Employee[];

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
