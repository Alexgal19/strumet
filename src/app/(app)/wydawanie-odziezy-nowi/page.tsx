
'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Loader2, ChevronsUpDown, CheckIcon, Printer, User, Briefcase, Building2, CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Employee } from '@/lib/types';
import { cn } from '@/lib/utils';
import { NewHireInfoPrintForm } from '@/components/new-hire-info-print-form';
import { useAppContext } from '@/context/app-context';


export default function NewHireClothingIssuancePage() {
  const { employees, isLoading } = useAppContext();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  
  const [printingEmployee, setPrintingEmployee] = useState<Employee | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);
  
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);
  
  const selectedEmployee = useMemo(() => {
    return activeEmployees.find(e => e.id === selectedEmployeeId) ?? null;
  }, [selectedEmployeeId, activeEmployees]);
  
  const handlePrint = async () => {
    if (!selectedEmployee) return;
    
    setPrintingEmployee(selectedEmployee);
    document.body.classList.add('printing');
    setTimeout(() => {
        window.print();
        document.body.classList.remove('printing');
        setPrintingEmployee(null);
    }, 100);
  };

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <div className="main-content-container h-full flex-col flex">
        <PageHeader
          title="Wydruk danych dla nowych"
          description="Wybierz pracownika, aby wygenerować kartę informacyjną."
        />

        <div className="flex justify-center">
            <div className="w-full max-w-2xl">
                 <Card>
                    <CardHeader>
                        <CardTitle>Wybierz pracownika</CardTitle>
                        <CardDescription>Wybierz nowego pracownika, aby przygotować dla niego kartę informacyjną.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Pracownik</label>
                            <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                                <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isComboboxOpen}
                                    className="w-full justify-between"
                                >
                                    {selectedEmployee ? selectedEmployee.fullName : "Wybierz pracownika..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Szukaj pracownika..." />
                                    <CommandList>
                                    <CommandEmpty>Nie znaleziono pracownika.</CommandEmpty>
                                    <CommandGroup>
                                        {activeEmployees.map((employee) => (
                                        <CommandItem
                                            key={employee.id}
                                            value={employee.fullName}
                                            onSelect={() => {
                                            setSelectedEmployeeId(employee.id);
                                            setIsComboboxOpen(false);
                                            }}
                                        >
                                            <CheckIcon className={cn("mr-2 h-4 w-4", selectedEmployeeId === employee.id ? "opacity-100" : "opacity-0")} />
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
                            <div className="space-y-3 rounded-md border p-4 bg-muted/50">
                                <h4 className="font-semibold text-lg text-center mb-4">Podgląd danych do druku</h4>
                                <div className="flex items-center text-base">
                                    <User className="mr-3 h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium">{selectedEmployee.fullName}</span>
                                </div>
                                 <div className="flex items-center text-base">
                                    <Building2 className="mr-3 h-5 w-5 text-muted-foreground" />
                                    <span>{selectedEmployee.department}</span>
                                </div>
                                <div className="flex items-center text-base">
                                    <Briefcase className="mr-3 h-5 w-5 text-muted-foreground" />
                                    <span>{selectedEmployee.jobTitle}</span>
                                </div>
                                <div className="flex items-center text-base">
                                    <CreditCard className="mr-3 h-5 w-5 text-muted-foreground" />
                                    <span>{selectedEmployee.cardNumber}</span>
                                </div>
                            </div>
                        )}

                        <Button onClick={handlePrint} disabled={!selectedEmployee} className="w-full">
                            <Printer className="mr-2 h-4 w-4" />
                            Drukuj
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
      <div className="print-only">
        {printingEmployee && (
            <NewHireInfoPrintForm 
                ref={printComponentRef}
                employee={printingEmployee}
            />
        )}
      </div>
    </>
  );
}
