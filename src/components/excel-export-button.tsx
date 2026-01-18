'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { formatDate } from '@/lib/date';
import { format } from 'date-fns';

interface ExcelExportButtonProps {
  employees: Employee[];
  fileName?: string;
  columns: { key: keyof Employee, name: string }[];
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function ExcelExportButton({ employees, fileName = 'pracownicy', columns, className, variant = "outline" }: ExcelExportButtonProps) {
  const handleExport = async () => {
    const XLSX = await import('xlsx');
    const dataToExport = employees.map(emp => {
      const polishEmp: any = {};
      columns.forEach(col => {
        let value = emp[col.key] as string | undefined | null;
        // Use our centralized date formatter for date fields
        if ((col.key === 'hireDate' || col.key === 'terminationDate' || col.key === 'contractEndDate') && value) {
          value = formatDate(value, 'dd.MM.yyyy');
        }
        polishEmp[col.name] = value || '';
      });
      return polishEmp;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pracownicy');

    const cols = columns.map(col => ({
      wch: Math.max(20, ...dataToExport.map(row => (row[col.name] || '').toString().length))
    }));
    worksheet['!cols'] = cols;

    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
    XLSX.writeFile(workbook, `${fileName}_${timestamp}.xlsx`);
  };

  return (
    <Button variant={variant} className={className} onClick={handleExport} disabled={employees.length === 0}>
      <FileDown className="mr-2 h-4 w-4" />
      Eksportuj do Excel
    </Button>
  );
}
