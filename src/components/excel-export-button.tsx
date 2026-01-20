'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { formatDate, parseMaybeDate } from '@/lib/date';
import { format } from 'date-fns';
import writeXlsxFile from 'write-excel-file';

interface ExcelExportButtonProps {
  employees: Employee[];
  fileName?: string;
  columns: { key: keyof Employee, name: string }[];
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function ExcelExportButton({ employees, fileName = 'pracownicy', columns, className, variant = "outline" }: ExcelExportButtonProps) {
  const handleExport = async () => {
    const dataToExport = employees.map(emp => {
      const row: any = {};
      columns.forEach(col => {
        let value: any = emp[col.key];
        // For date fields, parse back to Date objects for proper Excel export
        if ((col.key === 'hireDate' || col.key === 'terminationDate' || col.key === 'contractEndDate') && value) {
          const parsedDate = parseMaybeDate(value);
          value = parsedDate || value; // Keep original if parsing fails
        }
        row[col.name] = value || '';
      });
      return row;
    });

    const schema = columns.map(col => ({
      column: col.name,
      type: (col.key === 'hireDate' || col.key === 'terminationDate' || col.key === 'contractEndDate') ? Date : String,
      width: Math.max(20, ...dataToExport.map(row => (row[col.name] || '').toString().length))
    }));

    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
    await writeXlsxFile(dataToExport, {
      fileName: `${fileName}_${timestamp}.xlsx`,
      schema
    });
  };

  return (
    <Button variant={variant} className={className} onClick={handleExport} disabled={employees.length === 0}>
      <FileDown className="mr-2 h-4 w-4" />
      Eksportuj do Excel
    </Button>
  );
}
