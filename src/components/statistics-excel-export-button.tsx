
'use client';

import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { format } from 'date-fns';

interface StatData {
    name: string;
    value: number;
    percentage: number;
}

interface Stats {
    totalActiveEmployees: number;
    totalDepartments: number;
    averageEmployeesPerManager: string;
}

interface StatisticsExcelExportButtonProps {
    stats: Stats;
    departmentData: StatData[];
    nationalityData: StatData[];
    jobTitleData: StatData[];
}

export function StatisticsExcelExportButton({
    stats,
    departmentData,
    nationalityData,
    jobTitleData
}: StatisticsExcelExportButtonProps) {

    const handleExport = () => {
        const workbook = XLSX.utils.book_new();

        // 1. Summary Sheet
        const summaryData = [
            { Wskaźnik: 'Aktywni pracownicy', Wartość: stats.totalActiveEmployees },
            { Wskaźnik: 'Liczba działów', Wartość: stats.totalDepartments },
            { Wskaźnik: 'Średnia liczba pracowników na kierownika', Wartość: stats.averageEmployeesPerManager },
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
