
'use client';

import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { format } from 'date-fns';
import type { Employee, Stats } from '@/lib/types';

interface StatData {
    name: string;
    value: number;
    percentage: number;
}

interface StatisticsExcelExportButtonProps {
    stats: Stats;
    departmentData: StatData[];
    nationalityData: StatData[];
    jobTitleData: StatData[];
    employees: Employee[];
}

export function StatisticsExcelExportButton({
    stats,
    departmentData,
    nationalityData,
    jobTitleData,
    employees,
}: StatisticsExcelExportButtonProps) {

    const handleExport = () => {
        const workbook = XLSX.utils.book_new();

        // 1. Summary Sheet
        const summaryData = [
            { Wskaźnik: 'Aktywni pracownicy', Wartość: stats.totalActiveEmployees },
            { Wskaźnik: 'Liczba działów', Wartość: stats.totalDepartments },
            { Wskaźnik: 'Liczba stanowisk', Wartość: stats.totalJobTitles },
        ];
        const summaryWs = XLSX.utils.json_to_sheet(summaryData);
        summaryWs['!cols'] = [{ wch: 40 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, summaryWs, 'Podsumowanie');

        // 2. Department Sheet
        const departmentExportData = departmentData.map(d => ({
            'Dział': d.name,
            'Liczba pracowników': d.value,
            'Udział procentowy': `${d.percentage.toFixed(2)}%`
        }));
        const departmentWs = XLSX.utils.json_to_sheet(departmentExportData);
        departmentWs['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, departmentWs, 'Wg Działów');

        // 3. Nationality Sheet
        const nationalityExportData = nationalityData.map(d => ({
            'Narodowość': d.name,
            'Liczba pracowników': d.value,
            'Udział procentowy': `${d.percentage.toFixed(2)}%`
        }));
        const nationalityWs = XLSX.utils.json_to_sheet(nationalityExportData);
        nationalityWs['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, nationalityWs, 'Wg Narodowości');
        
        // 4. Job Title Sheet
        const jobTitleExportData = jobTitleData.map(d => ({
            'Stanowisko': d.name,
            'Liczba pracowników': d.value,
            'Udział procentowy': `${d.percentage.toFixed(2)}%`
        }));
        const jobTitleWs = XLSX.utils.json_to_sheet(jobTitleExportData);
        jobTitleWs['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, jobTitleWs, 'Wg Stanowisk');
        
        // 5. Raw Data Sheet for Pivot Table
        const rawData = employees.map(emp => ({
            'Imię i nazwisko': emp.fullName,
            'Dział': emp.department,
            'Stanowisko': emp.jobTitle,
            'Kierownik': emp.manager,
            'Narodowość': emp.nationality,
        }));
        const rawDataWs = XLSX.utils.json_to_sheet(rawData);
        const range = XLSX.utils.decode_range(rawDataWs['!ref']!);
        rawDataWs['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
        rawDataWs['!cols'] = [
            { wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(workbook, rawDataWs, 'Dane Surowe (do Tabeli)');


        const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
        XLSX.writeFile(workbook, `raport_statystyk_${timestamp}.xlsx`);
    };

    const isDisabled = !stats.totalActiveEmployees || stats.totalActiveEmployees === 0;

    return (
        <Button variant="outline" onClick={handleExport} disabled={isDisabled}>
            <FileDown className="mr-2 h-4 w-4" />
            Eksportuj do Excel
        </Button>
    );
}
