'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { format } from 'date-fns';

interface ColumnDef {
  key: string;
  name: string;
}

interface GenericExcelExportButtonProps {
  data: Record<string, any>[];
  columns: ColumnDef[];
  fileName?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  disabled?: boolean;
}

export function GenericExcelExportButton({
  data,
  columns,
  fileName = 'export',
  variant = 'outline',
  className,
  disabled,
}: GenericExcelExportButtonProps) {
  const handleExport = async () => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    const exportData = data.map((row) => {
      const obj: Record<string, any> = {};
      columns.forEach((col) => {
        let value = row[col.key];
        // Handle date strings
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
          const parsed = new Date(value);
          if (!isNaN(parsed.getTime())) {
            value = parsed;
          }
        }
        obj[col.name] = value ?? '';
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = columns.map((col) => ({
      wch: Math.max(col.name.length, 15),
    }));

    XLSX.utils.book_append_sheet(workbook, ws, 'Dane');

    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
    XLSX.writeFile(workbook, `${fileName}_${timestamp}.xlsx`);
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleExport}
      disabled={disabled || data.length === 0}
    >
      <FileDown className="mr-2 h-4 w-4" />
      Eksportuj do Excel
    </Button>
  );
}
