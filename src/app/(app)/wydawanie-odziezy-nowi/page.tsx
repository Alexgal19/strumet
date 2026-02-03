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
import { Loader2, ChevronsUpDown, CheckIcon, Printer, User, Briefcase, Building2, CalendarIcon, Package, FileText } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Employee, ClothingIssuance } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ClothingIssuancePrintForm } from '@/components/clothing-issuance-print-form';
import { NewHireInfoPrintForm } from '@/components/new-hire-info-print-form';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { formatDate } from '@/lib/date';


export default function NewHireClothingIssuancePage() {
  const { isLoading: isContextLoading, config } = useAppContext();
  const { employees: activeEmployees, isLoading: isEmployeesLoading } = useEmployees('aktywny');
  const isLoading = isContextLoading || isEmployeesLoading;

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  
  const [printingIssuance, setPrintingIssuance] = useState<ClothingIssuance | null>(null);
  const [printingInfoCard, setPrintingInfoCard] = useState<Employee | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);
  
  const selectedEmployee = useMemo(() => {
    return activeEmployees.find(e => e.id === selectedEmployeeId) ?? null;
  }, [selectedEmployeeId, activeEmployees]);
  
  const clothingSetForEmployee = useMemo(() => {
    if (!selectedEmployee || !config.jobTitleClothingSets || !selectedEmployee.jobTitle) {
      return null;
    }
    const jobTitleObject = config.jobTitles.find(jt => jt.name === selectedEmployee.jobTitle);
    if (!jobTitleObject) return null;

    const jobTitleSet = config.jobTitleClothingSets.find(set => set.id === jobTitleObject.id);
    
    if (!jobTitleSet || !jobTitleSet.description) {
      return null;
    }

    return [{
      id: 'full-set',
      name: jobTitleSet.description,
      quantity: 1
    }];
  }, [selectedEmployee, config.jobTitleClothingSets, config.jobTitles]);


  const handlePrintIssuance = async () => {
    if (!selectedEmployee || !clothingSetForEmployee || clothingSetForEmployee.length === 0) return;
    
    const issuanceToPrint: ClothingIssuance = {
        id: `print-temp-${Date.now()}`,
        employeeId: selectedEmployee.id,
        employeeFullName: selectedEmployee.fullName,
        date: new Date().toISOString(),
        items: clothingSetForEmployee
    };
    
    setPrintingIssuance(issuanceToPrint);
    setPrintingInfoCard(null);
    document.body.classList.add('printing');
    setTimeout(() => {
        window.print();
        document.body.classList.remove('printing');
        setPrintingIssuance(null);
    }, 100);
  };
  
  const handlePrintInfoCard = async () => {
    if (!selectedEmployee) return;

    setPrintingInfoCard(selectedEmployee);
    setPrintingIssuance(null);
    document.body.classList.add('printing');
    setTimeout(() => {
        window.print();
        document.body.classList.remove('printing');
        setPrintingInfoCard(null);
    }, 100);
  };

  const selectedEmployeeForIssuancePrint = printingIssuance
    ? activeEmployees.find(e => e.id === printingIssuance.employeeId)
    : null;

  return (
    <>
      <div className="main-content-container h-full flex-col flex">
        {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
        <>
            <PageHeader
            title="Wydawanie odzieży / Info dla nowych"
            description="Wybierz pracownika, aby wygenerować potwierdzenie wydania odzieży lub kartę informacyjną."
            />

            <div className="flex justify-center">
                <div className="w-full max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Wybierz pracownika</CardTitle>
                            <CardDescription>Wybierz pracownika z listy, aby zobaczyć podgląd danych do druku.</CardDescription>
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
                                        <FileText className="mr-3 h-5 w-5 text-muted-foreground" />
                                        <span>Numer karty: <span className="font-medium">{selectedEmployee.cardNumber}</span></span>
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
                                        <CalendarIcon className="mr-3 h-5 w-5 text-muted-foreground" />
                                        <span>Data wydania: {formatDate(new Date(), 'dd.MM.yyyy')}</span>
                                    </div>
                                    
                                    {clothingSetForEmployee && clothingSetForEmployee.length > 0 ? (
                                        <div className="pt-4">
                                            <h5 className="font-semibold text-md mb-2 flex items-center"><Package className="mr-2 h-5 w-5 text-muted-foreground"/> Zestaw odzieży:</h5>
                                            <div className="whitespace-pre-wrap rounded-md border border-dashed p-3 bg-background text-sm">
                                                {clothingSetForEmployee[0].name}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-center text-orange-600 pt-4">Brak przypisanego zestawu odzieży dla tego stanowiska w konfiguracji.</p>
                                    )}
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <Button onClick={handlePrintIssuance} disabled={!selectedEmployee || !clothingSetForEmployee || clothingSetForEmployee.length === 0}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Drukuj wydanie odzieży
                                </Button>
                                <Button onClick={handlePrintInfoCard} disabled={!selectedEmployee} variant="secondary">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Drukuj kartę informacyjną
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
        )}
      </div>
      <div className="print-only">
        {printingIssuance && selectedEmployeeForIssuancePrint && (
            <ClothingIssuancePrintForm 
                ref={printComponentRef}
                employee={selectedEmployeeForIssuancePrint}
                issuance={printingIssuance}
            />
        )}
        {printingInfoCard && (
            <NewHireInfoPrintForm
                ref={printComponentRef}
                employee={printingInfoCard}
            />
        )}
      </div>
    </>
  );
}
