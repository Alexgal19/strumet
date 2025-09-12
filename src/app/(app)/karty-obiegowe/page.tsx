'use client';

import React, { useState, useMemo, useEffect } from 'react';
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

const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

// Simplified preview component
const CirculationCardPreview = ({ employee }: { employee: Employee | null }) => {
    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center aspect-[1/1.414] text-center text-muted-foreground p-10 bg-gray-50 rounded-lg">
                <UserSquare className="h-16 w-16 mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold">Podgląd Karty Obiegowej</h3>
                <p className="text-sm">Wybierz pracownika, aby zobaczyć, jak będzie wyglądał dokument.</p>
            </div>
        );
    }

    return (
        <div className="p-8 border rounded-lg bg-white shadow-md text-black">
             <header className="text-center mb-6">
                <h1 className="text-xl font-bold">KARTA OBIEGOWA</h1>
                <p className="text-sm text-gray-500">Potwierdzenie rozliczenia pracownika</p>
            </header>
            <section className="border-t border-b border-black py-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs">Pracownik</p>
                        <p className="font-bold">{employee.fullName}</p>
                    </div>
                     <div>
                        <p className="text-xs">Data zwolnienia</p>
                        <p className="font-bold">{employee.terminationDate || ' '}</p>
                    </div>
                     <div>
                        <p className="text-xs">Stanowisko</p>
                        <p className="font-bold">{employee.jobTitle}</p>
                    </div>
                     <div>
                        <p className="text-xs">Dział</p>
                        <p className="font-bold">{employee.department}</p>
                    </div>
                </div>
            </section>
            <p className="font-bold mb-4">Rozliczenie z działami</p>
        </div>
    );
};


export default function CirculationCardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  

  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
      setEmployees(objectToArray(snapshot.val()));
      if (isLoading) setIsLoading(false);
    });

    return () => unsubscribeEmployees();
  }, [isLoading]);
  

  const allEmployees = useMemo(() => employees, [employees]);
  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return allEmployees.find(e => e.id === selectedEmployeeId) ?? null;
  }, [selectedEmployeeId, allEmployees]);

  const handlePrint = () => {
    if (selectedEmployee) {
      const url = `/karty-obiegowe/druk?employeeId=${selectedEmployee.id}`;
      window.open(url, '_blank');
    }
  };


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
                    <CardDescription>Wybierz pracownika, aby przygotować kartę do druku.</CardDescription>
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
                <div className="max-w-[210mm] mx-auto">
                    <CirculationCardPreview employee={selectedEmployee} />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
