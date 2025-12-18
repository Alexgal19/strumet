
import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import * as XLSX from 'xlsx';
import { format, parse } from 'date-fns';

export const dynamic = 'force-dynamic';

const parseExcelData = (buffer: Buffer): any[] => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = 'Pracownicy aktywni';
    if (!workbook.Sheets[sheetName]) {
        return [];
    }
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

const compareGroups = (startData: any[], endData: any[], key: string) => {
    const startCounts = startData.reduce((acc, item) => { if(item[key]) acc[item[key]] = (acc[item[key]] || 0) + 1; return acc; }, {} as Record<string, number>);
    const endCounts = endData.reduce((acc, item) => { if(item[key]) acc[item[key]] = (acc[item[key]] || 0) + 1; return acc; }, {} as Record<string, number>);
    
    const allKeys = new Set([...Object.keys(startCounts), ...Object.keys(endCounts)]);
    const changes: any[] = [];
    
    allKeys.forEach(groupName => {
        const startCount = startCounts[groupName] || 0;
        const endCount = endCounts[groupName] || 0;
        if (startCount !== endCount || (endData.length > 0 && startData.length === 0)) {
            changes.push({ name: groupName, from: startCount, to: endCount, diff: endCount - startCount });
        }
    });
    return changes.sort((a,b) => b.to - a.to);
};

export async function POST(request: Request) {
    try {
        getAdminApp();
        const body = await request.json();
        const { startDate, endDate } = body;

        if (!startDate) {
            return NextResponse.json({ message: "Start date is required" }, { status: 400 });
        }

        const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
        if (!bucketName) {
            throw new Error("FIREBASE_STORAGE_BUCKET environment variable is not set.");
        }
        const bucket = admin.storage().bucket(bucketName);
        
        const isRange = !!endDate;

        if (isRange) {
            // --- RANGE MODE ---
            const startFile = bucket.file(`archives/employees_${startDate}.xlsx`);
            const endFile = bucket.file(`archives/employees_${endDate}.xlsx`);

            const [startExists] = await startFile.exists();
            const [endExists] = await endFile.exists();

            if (!startExists || !endExists) {
                return NextResponse.json({ message: "Brak plików archiwum dla wybranych dat." }, { status: 404 });
            }

            const [startBuffer] = await startFile.download();
            const [endBuffer] = await endFile.download();

            const startData = parseExcelData(startBuffer);
            const endData = parseExcelData(endBuffer);

            const startMap = new Map(startData.map(item => [item['Nazwisko i imię'], item]));
            const endMap = new Map(endData.map(item => [item['Nazwisko i imię'], item]));

            const newHires = Array.from(endMap.keys()).filter(key => !startMap.has(key));
            const terminated = Array.from(startMap.keys()).filter(key => !endMap.has(key));

            return NextResponse.json({
                isRange: true,
                start: { total: startData.length, date: format(parse(startDate, 'yyyy-MM-dd', new Date()), 'dd.MM.yyyy') },
                end: { total: endData.length, date: format(parse(endDate, 'yyyy-MM-dd', new Date()), 'dd.MM.yyyy') },
                diff: endData.length - startData.length,
                newHires,
                terminated,
                deptChanges: compareGroups(startData, endData, 'Dział'),
                jobTitleChanges: compareGroups(startData, endData, 'Stanowisko'),
                nationalityChanges: compareGroups(startData, endData, 'Narodowość'),
            });

        } else {
            // --- SINGLE DAY MODE ---
            const file = bucket.file(`archives/employees_${startDate}.xlsx`);
            const [exists] = await file.exists();
            if (!exists) {
                 return NextResponse.json({ message: "Brak pliku archiwum dla wybranej daty." }, { status: 404 });
            }

            const [buffer] = await file.download();
            const data = parseExcelData(buffer);

            return NextResponse.json({
                isRange: false,
                date: format(parse(startDate, 'yyyy-MM-dd', new Date()), 'dd.MM.yyyy'),
                total: data.length,
                deptChanges: compareGroups([], data, 'Dział'),
                jobTitleChanges: compareGroups([], data, 'Stanowisko'),
                nationalityChanges: compareGroups([], data, 'Narodowość'),
            });
        }

    } catch (error: any) {
        console.error('API Error (generate-report):', error);
        return NextResponse.json(
            { message: error.message || 'An unknown server error occurred.' },
            { status: 500 }
        );
    }
}
