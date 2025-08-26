'use client';

import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { FileUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, set, push } from "firebase/database";
import type { Employee } from '@/lib/types';

const polishToEnglishMapping: Record<string, keyof Omit<Employee, 'id' | 'status' | 'terminationDate'>> = {
  'imię': 'firstName',
  'nazwisko': 'lastName',
  'dataZatrudnienia': 'hireDate',
  'stanowisko': 'jobTitle',
  'dział': 'department',
  'kierownik': 'manager',
  'numerKarty': 'cardNumber',
  'narodowość': 'nationality',
  'numerSzafki': 'lockerNumber',
  'numerSzafkiDział': 'departmentLockerNumber',
  'numerPlomby': 'sealNumber',
};

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

          const englishItem: any = {};
          for (const polishKey in item) {
            if (polishToEnglishMapping[polishKey]) {
              const englishKey = polishToEnglishMapping[polishKey];
              englishItem[englishKey] = item[polishKey];
            } else {
              englishItem[polishKey] = item[polishKey]; // Keep unmapped columns as is
            }
          }
            
          const hireDate = englishItem.hireDate instanceof Date 
            ? englishItem.hireDate.toISOString().split('T')[0]
            : (typeof englishItem.hireDate === 'string' ? englishItem.hireDate : new Date().toISOString().split('T')[0]);

          const employee: Omit<Employee, 'id'> = {
            firstName: String(englishItem.firstName || ''),
            lastName: String(englishItem.lastName || ''),
            hireDate: hireDate,
            jobTitle: String(englishItem.jobTitle || ''),
            department: String(englishItem.department || ''),
            manager: String(englishItem.manager || ''),
            cardNumber: String(englishItem.cardNumber || ''),
            nationality: String(englishItem.nationality || ''),
            lockerNumber: String(englishItem.lockerNumber || ''),
            departmentLockerNumber: String(englishItem.departmentLockerNumber || ''),
            sealNumber: String(englishItem.sealNumber || ''),
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
                description: 'Nie znaleziono prawidłowych danych do importu. Sprawdź strukturę pliku i nazwy kolumn.',
            });
            setIsImporting(false);
            return;
        }

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
