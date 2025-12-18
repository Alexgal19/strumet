import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import type { Employee } from '@/lib/types';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

const objectToArray = <T>(obj: Record<string, any> | undefined | null): (T & { id: string })[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

async function handleArchive() {
    console.log('Starting manual employee archival to Excel...');
    
    const db = adminDb();
    const storage = adminStorage();

    if (!db || !storage) {
        throw new Error('Firebase Admin SDK not initialized.');
    }

    const employeesRef = db.ref('employees');
    const snapshot = await employeesRef.once('value');
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


export async function POST(request: Request) {
    try {
        // Here we could check for an admin role if needed, but for now we trust the client-side isAdmin check
        const result = await handleArchive();
        return NextResponse.json(result);
    } catch (error) {
        console.error('API /api/archive POST Error:', error);
        return NextResponse.json({ error: (error as Error).message || 'An internal server error occurred.' }, { status: 500 });
    }
}