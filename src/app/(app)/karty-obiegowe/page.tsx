'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Loader2, Printer, CheckIcon, ChevronsUpDown, UserSquare } from 'lucide-react';
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 flex-grow">
        <div className="lg:col-span-1">
            <Card className="sticky top-6">
                <CardHeader>
                    <CardTitle>Generator Karty</CardTitle>
                    <CardDescription>Wybierz pracownika, aby wypełnić i wydrukować kartę obiegową.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">1. Wybierz pracownika</label>
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
                                        : "Wybierz z listy..."}
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
                    </div>

                     {selectedEmployee && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">2. Drukuj</label>
                            <Button onClick={handlePrint} className="w-full">
                                <Printer className="mr-2 h-4 w-4" />
                                Drukuj kartę
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        
        <div className="lg:col-span-2">
            <div className="bg-muted/30 p-4 sm:p-8 rounded-2xl">
                <Card className="max-w-[210mm] mx-auto shadow-2xl">
                    <CardContent className="p-0">
                        {selectedEmployee ? (
                            <CirculationCardPrintForm employee={selectedEmployee} />
                        ) : (
                            <div className="flex flex-col items-center justify-center aspect-[1/1.414] text-center text-muted-foreground p-10">
                                <UserSquare className="h-16 w-16 mb-4 text-gray-400" />
                                <h3 className="text-lg font-semibold">Podgląd Karty Obiegowej</h3>
                                <p className="text-sm">Wybierz pracownika, aby zobaczyć, jak będzie wyglądał dokument.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
