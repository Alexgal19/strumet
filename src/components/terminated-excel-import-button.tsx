'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, update } from "firebase/database";
import type { Employee } from '@/lib/types';
import { push } from 'firebase/database';
import { format } from 'date-fns';
import { parseMaybeDate } from '@/lib/date';

const polishToEnglishMapping: Record<string, keyof Omit<Employee, 'id' | 'status'>> = {
  'Nazwisko i imię': 'fullName',
  'Data zatrudnienia': 'hireDate',
  'Data zwolnienia': 'terminationDate',
  'Stanowisko': 'jobTitle',
  'Dział': 'department',
  'Kierownik': 'manager',
  'Nr karty': 'cardNumber',
  'Narodowość': 'nationality',
  'Nr szafki': 'lockerNumber',
  'Nr szafki w dziale': 'departmentLockerNumber',
  'Nr plomby': 'sealNumber',
};

export function TerminatedExcelImportButton() {
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
        const XLSX = await import('xlsx');
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        const updates: Record<string, any> = {};

        for (const item of jsonData) {
          const employeeId = push(ref(db, 'employees')).key;
          if (!employeeId) continue;

          const englishItem: any = {};
          for (const polishKey in item) {
            if (polishToEnglishMapping[polishKey]) {
              const englishKey = polishToEnglishMapping[polishKey];
              englishItem[englishKey] = item[polishKey];
            } else {
              englishItem[polishKey] = item[polishKey];
            }
          }
            
          const getFormattedDate = (dateInput: any): string | null => {
            const parsedDate = parseMaybeDate(dateInput);
            return parsedDate ? format(parsedDate, 'yyyy-MM-dd') : null;
          };

          const employee: Omit<Employee, 'id'> = {
            fullName: String(englishItem.fullName || '').trim(),
            hireDate: getFormattedDate(englishItem.hireDate) || '',
            terminationDate: getFormattedDate(englishItem.terminationDate) || undefined,
            jobTitle: String(englishItem.jobTitle || '').trim(),
            department: String(englishItem.department || '').trim(),
            manager: String(englishItem.manager || '').trim(),
            cardNumber: String(englishItem.cardNumber || '').trim(),
            nationality: String(englishItem.nationality || '').trim(),
            lockerNumber: String(englishItem.lockerNumber || '').trim(),
            departmentLockerNumber: String(englishItem.departmentLockerNumber || '').trim(),
            sealNumber: String(englishItem.sealNumber || '').trim(),
            status: 'zwolniony',
          };
          
          if(!employee.fullName) {
            console.warn("Skipping row due to missing full name:", item);
            continue;
          }

          // Convert undefined to null for Firebase compatibility
          const finalEmployee: any = {};
          for (const key in employee) {
              const typedKey = key as keyof typeof employee;
              if (employee[typedKey] !== undefined) {
                  finalEmployee[typedKey] = employee[typedKey];
              } else {
                  finalEmployee[typedKey] = null;
              }
          }

          updates[`/employees/${employeeId}`] = finalEmployee;
        }
        
        if (Object.keys(updates).length === 0) {
            toast({
                variant: 'destructive',
                title: 'Błąd importu',
                description: 'Nie znaleziono prawidłowych danych do importu. Sprawdź strukturę pliku i nazwy kolumn.',
            });
            setIsImporting(false);
            return;
        }

        await update(ref(db), updates);

        toast({
          title: 'Import zakończony sukcesem',
          description: `Zaimportowano ${Object.keys(updates).length} zwolnionych pracowników.`,
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
