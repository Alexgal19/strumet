'use client';

import React, { useRef, useState } from 'react';
import readXlsxFile from 'read-excel-file';
import { Button } from '@/components/ui/button';
import { FileUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { parseMaybeDate } from '@/lib/date';
import { format } from 'date-fns';

interface DateUpdatePayload {
  fullName: string;
  hireDate: string;
}

interface Props {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function HireDateImportButton({ className, variant = "outline" }: Props) {
  const { handleUpdateHireDates } = useAppContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const rows = await readXlsxFile(file);
      const headers: string[] = rows[0] as string[];
      const jsonData = rows.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((header: string, i: number) => obj[header] = row[i]);
        return obj;
      });

      const updates: DateUpdatePayload[] = [];
      const errors: string[] = [];

      for (const [index, row] of jsonData.entries()) {
        const fullName = row['Nazwisko i imię']?.trim();
        const hireDateInput = row['Data zatrudnienia'];

        if (!fullName || !hireDateInput) {
          errors.push(`Wiersz ${index + 2}: Brak imienia i nazwiska lub daty zatrudnienia.`);
          continue;
        }

        const hireDate = parseMaybeDate(hireDateInput);

        if (!hireDate) {
          errors.push(`Wiersz ${index + 2}: Nieprawidłowy format daty dla "${fullName}".`);
          continue;
        }

        updates.push({ fullName, hireDate: format(hireDate, 'yyyy-MM-dd') });
      }

      if (errors.length > 0) {
        toast({
          variant: 'destructive',
          title: `Błędy walidacji w pliku (${errors.length})`,
          description: (
            <div className="max-h-40 overflow-y-auto">
              {errors.slice(0, 5).map((e, i) => <p key={i}>{e}</p>)}
              {errors.length > 5 && <p>I więcej...</p>}
            </div>
          )
        });
        setIsImporting(false);
        return;
      }

      if (updates.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Brak danych do importu',
          description: 'Nie znaleziono prawidłowych wierszy do zaktualizowania.',
        });
        setIsImporting(false);
        return;
      }

      await handleUpdateHireDates(updates);

    } catch (error) {
      console.error("Error importing hire dates from Excel: ", error);
      toast({
        variant: 'destructive',
        title: 'Błąd podczas importu',
        description: 'Nie udało się przetworzyć pliku. Upewnij się, że ma poprawny format.',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      <Button variant={variant} className={className} onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
        {isImporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileUp className="mr-2 h-4 w-4" />
        )}
        Aktualizuj daty
      </Button>
    </>
  );
}
