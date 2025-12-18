
'use server';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { Employee } from '@/lib/types';
import { getAdminApp } from '@/lib/firebase-admin';

const objectToArray = <T>(obj: Record<string, any> | undefined | null): (T & { id: string })[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export async function POST() {
  try {
    // Ensure the admin app is initialized
    getAdminApp();

    const employeesRef = admin.database().ref('employees');
    const snapshot = await employeesRef.once('value');
    const allEmployees = objectToArray<Employee>(snapshot.val());

    if (allEmployees.length === 0) {
      return NextResponse.json({ success: false, message: 'Brak pracowników do zarchiwizowania.' }, { status: 404 });
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
    
    // Explicitly specify the bucket name on every call
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
        throw new Error("FIREBASE_STORAGE_BUCKET environment variable is not set.");
    }
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(filePath);
    
    await file.save(excelBuffer, {
        metadata: {
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }
    });

    const message = `Successfully archived ${activeEmployees.length} active and ${terminatedEmployees.length} terminated employees to ${filePath}`;
    
    return NextResponse.json({ success: true, message, filePath });

  } catch (error: any) {
    console.error('API ROUTE ERROR (archive):', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'An unknown server error occurred during archival.',
      error: {
        message: error.message,
        code: error.code,
        errors: error.errors
      }
    }, { status: 500 });
  }
}
