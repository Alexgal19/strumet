'use client';

import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { format } from 'date-fns';

interface ExcelExportButtonProps {
  employees: Employee[];
  fileName?: string;
}

const columnOrder: (keyof Employee)[] = [
  'fullName',
  'hireDate',
  'terminationDate',
  'jobTitle',
  'department',
  'manager',
  'cardNumber',
  'nationality',
  'lockerNumber',
  'departmentLockerNumber',
  'sealNumber',
];

const englishToPolishMapping: Record<string, string> = {
  fullName: 'Nazwisko i imię',
  hireDate: 'Data zatrudnienia',
  terminationDate: 'Data zwolnienia',
  jobTitle: 'Stanowisko',
  department: 'Dział',
  manager: 'Kierownik',
  cardNumber: 'Nr karty',
  nationality: 'Narodowość',
  lockerNumber: 'Nr szafki',
  departmentLockerNumber: 'Nr szafki w dziale',
  sealNumber: 'Nr plomby',
};

export function TerminatedExcelExportButton({ employees, fileName = 'zwolnieni_pracownicy' }: ExcelExportButtonProps) {
  const handleExport = () => {
    const dataToExport = employees.map(emp => {
      const polishEmp: any = {};
      for (const key of columnOrder) {
        polishEmp[englishToPolishMapping[key]] = emp[key as keyof typeof emp] || '';
      }
      return polishEmp;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport, {
      header: columnOrder.map(key => englishToPolishMapping[key])
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pracownicy');
    
    // Auto-size columns
    const cols = Object.keys(dataToExport[0] || {}).map(key => ({
        wch: Math.max(20, ...dataToExport.map(row => (row[key] || '').toString().length))
    }));
    worksheet['!cols'] = cols;
    
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
    XLSX.writeFile(workbook, `${fileName}_${timestamp}.xlsx`);
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={employees.length === 0}>
        <FileDown className="mr-2 h-4 w-4" />
        Eksportuj do Excel
    </Button>
  );
}
