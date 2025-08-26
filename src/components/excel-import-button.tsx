'use client';

import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { FileUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, set, push } from "firebase/database";
import type { Employee } from '@/lib/types';

export function ExcelImportButton() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        const employeesToImport: Record<string, Omit<Employee, 'id'>> = {};

        for (const item of jsonData) {
          const employeeId = push(ref(db, 'employees')).key;
          if (!employeeId) continue;
            
          // Basic validation and type conversion
          const hireDate = item.hireDate instanceof Date 
            ? item.hireDate.toISOString().split('T')[0]
            : (typeof item.hireDate === 'string' ? item.hireDate : new Date().toISOString().split('T')[0]);

          const employee: Omit<Employee, 'id'> = {
            firstName: String(item.firstName || ''),
            lastName: String(item.lastName || ''),
            hireDate: hireDate,
            jobTitle: String(item.jobTitle || ''),
            department: String(item.department || ''),
            manager: String(item.manager || ''),
            cardNumber: String(item.cardNumber || ''),
            nationality: String(item.nationality || ''),
            lockerNumber: String(item.lockerNumber || ''),
            departmentLockerNumber: String(item.departmentLockerNumber || ''),
            sealNumber: String(item.sealNumber || ''),
            status: 'aktywny',
          };
          
          if(!employee.firstName || !employee.lastName) {
            console.warn("Skipping row due to missing first or last name:", item);
            continue;
          }

          employeesToImport[employeeId] = employee;
        }
        
        if (Object.keys(employeesToImport).length === 0) {
            toast({
                variant: 'destructive',
                title: 'Błąd importu',
                description: 'Nie znaleziono prawidłowych danych do importu. Sprawdź strukturę pliku.',
            });
            return;
        }

        // Replace all employees with the new data
        await set(ref(db, 'employees'), employeesToImport);

        toast({
          title: 'Import zakończony sukcesem',
          description: `Zaimportowano ${Object.keys(employeesToImport).length} pracowników.`,
        });
      } catch (error) {
        console.error("Error importing from Excel: ", error);
        toast({
          variant: 'destructive',
          title: 'Błąd podczas importu',
          description: 'Nie udało się przetworzyć pliku. Upewnij się, że ma poprawny format i strukturę.',
        });
      } finally {
        setIsImporting(false);
        // Reset file input
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = (error) => {
        setIsImporting(false);
        toast({
            variant: 'destructive',
            title: 'Błąd odczytu pliku',
            description: 'Nie udało się odczytać pliku.',
        });
        console.error("FileReader error: ", error);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls"
      />
      <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
        {isImporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
            <FileUp className="mr-2 h-4 w-4" />
        )}
        Importuj z Excel
      </Button>
    </>
  );
}
