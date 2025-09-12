'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Loader2, Printer, CheckIcon, ChevronsUpDown } from 'lucide-react';
import { Employee } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { cn } from '@/lib/utils';
import { CirculationCardPrintForm } from '@/components/circulation-card-print-form';

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export default function CirculationCardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  
  const printComponentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      setEmployees(objectToArray(snapshot.val()));
      if (isLoading) setIsLoading(false);
    });

    return () => unsubscribeEmployees();
  }, [isLoading]);
  
  useEffect(() => {
      if (isPrinting) {
          const timer = setTimeout(() => {
              window.print();
              setIsPrinting(false);
          }, 100);
        return () => clearTimeout(timer);
      }
  }, [isPrinting]);

  const allEmployees = useMemo(() => employees, [employees]);
  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return allEmployees.find(e => e.id === selectedEmployeeId) ?? null;
  }, [selectedEmployeeId, allEmployees]);

  const handlePrint = () => {
    if (selectedEmployee) {
      setIsPrinting(true);
    }
  };

  if (isPrinting && selectedEmployee) {
      return <CirculationCardPrintForm ref={printComponentRef} employee={selectedEmployee} />;
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Karty obiegowe"
        description="Generuj i drukuj karty obiegowe dla pracowników."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>1. Wybierz pracownika</CardTitle>
                    <CardDescription>Wyszukaj i wybierz pracownika z listy (aktywni i zwolnieni).</CardDescription>
                </CardHeader>
                <CardContent>
                    <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isComboboxOpen}
                                className="w-full justify-between"
                            >
                                {selectedEmployee
                                    ? selectedEmployee.fullName
                                    : "Wybierz pracownika..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Szukaj pracownika..." />
                                <CommandList>
                                    <CommandEmpty>Nie znaleziono pracownika.</CommandEmpty>
                                    <CommandGroup>
                                        {allEmployees.map((employee) => (
                                            <CommandItem
                                                key={employee.id}
                                                value={employee.fullName}
                                                onSelect={() => {
                                                    setSelectedEmployeeId(employee.id);
                                                    setIsComboboxOpen(false);
                                                }}
                                            >
                                                <CheckIcon
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedEmployeeId === employee.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {employee.fullName}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </CardContent>
            </Card>
            
            {selectedEmployee && (
                 <Card>
                    <CardHeader>
                        <CardTitle>2. Drukuj kartę</CardTitle>
                        <CardDescription>Wygeneruj i wydrukuj kartę obiegową dla wybranego pracownika.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handlePrint} className="w-full">
                            <Printer className="mr-2 h-4 w-4" />
                            Drukuj kartę obiegową
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
        
        <div className="lg:col-span-2">
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Podgląd Karty Obiegowej</CardTitle>
                    <CardDescription>Tutaj zobaczysz podgląd dokumentu, który zostanie wydrukowany.</CardDescription>
                </CardHeader>
                <CardContent>
                   {selectedEmployee ? (
                        <div className="border rounded-lg p-4">
                            <CirculationCardPrintForm
                                employee={selectedEmployee}
                            />
                        </div>
                   ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Wybierz pracownika, aby zobaczyć podgląd karty.
                        </div>
                   )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
