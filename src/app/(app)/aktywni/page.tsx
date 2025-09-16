
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MoreHorizontal, PlusCircle, Search, UserX, Edit, Bot, Loader2, Copy, CalendarIcon, Trash2, XCircle } from 'lucide-react';
import type { Employee, AllConfig } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { db } from '@/lib/firebase';
import { ref, set, push, update, remove } from "firebase/database";
import { format, parse, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ExcelImportButton } from '@/components/excel-import-button';
import { ExcelExportButton } from '@/components/excel-export-button';
import { MultiSelect, OptionType } from '@/components/ui/multi-select';
import { useIsMobile, useHasMounted } from '@/hooks/use-mobile';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { EmployeeForm } from '@/components/employee-form';
import { DataTable } from '@/components/data-table';
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table"

const EmployeeSummary = dynamic(() => import('@/components/employee-summary').then(mod => mod.EmployeeSummary), {
  ssr: false
});


export default function AktywniPage({ employees, config, isLoading }: { employees: Employee[], config: AllConfig, isLoading: boolean }) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({ from: undefined, to: undefined });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const selectedEmployeeIds = useMemo(() => Object.keys(rowSelection), [rowSelection]);
  
  const activeEmployees = useMemo(() => employees.filter(e => e.status === 'aktywny'), [employees]);

  const departmentOptions: OptionType[] = useMemo(() => config.departments.map(d => ({ value: d.name, label: d.name })), [config.departments]);
  const jobTitleOptions: OptionType[] = useMemo(() => config.jobTitles.map(j => ({ value: j.name, label: j.name })), [config.jobTitles]);
  const managerOptions: OptionType[] = useMemo(() => config.managers.map(m => ({ value: m.name, label: m.name })), [config.managers]);
  const nationalityOptions: OptionType[] = useMemo(() => config.nationalities.map(n => ({ value: n.name, label: n.name })), [config.nationalities]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDepartments([]);
    setSelectedJobTitles([]);
    setSelectedManagers([]);
    setSelectedNationalities([]);
    setDateRange({ from: undefined, to: undefined });
    setRowSelection({});
  };

  const filteredEmployees = useMemo(() => {
    return activeEmployees.filter(employee => {
      const isSelected = selectedEmployeeIds.includes(employee.id);
      if (isSelected) return true;

      const searchLower = searchTerm.toLowerCase();
      
      const searchMatch = !searchTerm || (employee.fullName && employee.fullName.toLowerCase().includes(searchLower)) ||
        (employee.cardNumber && employee.cardNumber.toLowerCase().includes(searchLower));

      const isInDateRange = () => {
        if (!dateRange.from && !dateRange.to) return true;
        if (!employee.hireDate || typeof employee.hireDate !== 'string') return false;
        
        try {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(employee.hireDate)) return false;

          const hireDate = parse(employee.hireDate, 'yyyy-MM-dd', new Date());
          if (isNaN(hireDate.getTime())) return false; 

          const from = dateRange.from ? startOfDay(dateRange.from) : undefined;
          const to = dateRange.to ? endOfDay(dateRange.to) : undefined;
          
          if (from && to) return isWithinInterval(hireDate, { start: from, end: to });
          if (from) return hireDate >= from;
          if (to) return hireDate <= to;
          return true;
        } catch (e) {
          console.error("Error parsing hire date:", e);
          return false;
        }
      };

      const noFiltersApplied = !searchTerm && selectedDepartments.length === 0 && selectedManagers.length === 0 && selectedJobTitles.length === 0 && selectedNationalities.length === 0 && !dateRange.from && !dateRange.to;
      if (noFiltersApplied) return true;


      return (
        searchMatch &&
        (selectedDepartments.length === 0 || selectedDepartments.includes(employee.department)) &&
        (selectedManagers.length === 0 || selectedManagers.includes(employee.manager)) &&
        (selectedJobTitles.length === 0 || selectedJobTitles.includes(employee.jobTitle)) &&
        (selectedNationalities.length === 0 || selectedNationalities.includes(employee.nationality)) &&
        isInDateRange()
      );
    });
  }, [activeEmployees, searchTerm, selectedDepartments, selectedManagers, selectedJobTitles, selectedNationalities, dateRange, selectedEmployeeIds]);
  
  const handleDateChange = (type: 'from' | 'to') => (date: Date | undefined) => {
    setDateRange(prev => ({ ...prev, [type]: date }));
  };

  const handleSaveEmployee = async (employeeData: Employee) => {
    try {
        const { id, ...dataToSave } = employeeData;
        
        // Convert undefined to null for Firebase compatibility
        Object.keys(dataToSave).forEach(key => {
            if ((dataToSave as any)[key] === undefined) {
                (dataToSave as any)[key] = null;
            }
        });

        if (id) {
            const employeeRef = ref(db, `employees/${id}`);
            await update(employeeRef, dataToSave);
             toast({ title: 'Sukces', description: 'Dane pracownika zostały zaktualizowane.' });
        } else {
            const newEmployeeRef = push(ref(db, 'employees'));
            await set(newEmployeeRef, { ...dataToSave, status: 'aktywny', id: newEmployeeRef.key });
            toast({ title: 'Sukces', description: 'Nowy pracownik został dodany.' });
        }
        setEditingEmployee(null);
        setIsFormOpen(false);
    } catch (error) {
        console.error("Error saving employee: ", error);
        toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać danych pracownika.' });
    }
  };
  
  const handleTerminateEmployee = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz zwolnić tego pracownika?')) {
        try {
            const employeeRef = ref(db, `employees/${id}`);
            await update(employeeRef, {
                status: 'zwolniony',
                terminationDate: format(new Date(), 'yyyy-MM-dd')
            });
            toast({ title: 'Pracownik zwolniony', description: 'Status pracownika został zmieniony na "zwolniony".' });
        } catch (error) {
            console.error("Error terminating employee: ", error);
             toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zwolnić pracownika.' });
        }
    }
  };

  const handleDeleteAllHireDates = async () => {
    try {
      const updates: Record<string, any> = {};
      employees.forEach(employee => {
        updates[`/employees/${employee.id}/hireDate`] = null;
      });
      await update(ref(db), updates);
      toast({
        title: 'Sukces',
        description: 'Wszystkie daty zatrudnienia zostały usunięte.',
      });
    } catch (error) {
      console.error("Error deleting all hire dates: ", error);
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie udało się usunąć dat zatrudnienia.',
      });
    }
  };

  const handleDeleteAllEmployees = async () => {
    try {
      await remove(ref(db, 'employees'));
      toast({
        title: 'Sukces',
        description: 'Wszyscy pracownicy zostali usunięci.',
      });
    } catch (error) {
      console.error("Error deleting all employees: ", error);
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie udało się usunąć pracowników.',
      });
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  }

  const handleCopy = (employee: Employee) => {
    const textToCopy = employee.fullName;
    navigator.clipboard.writeText(textToCopy).then(() => {
        toast({
            title: 'Skopiowano!',
            description: 'Imię i nazwisko pracownika zostało skopiowane.',
        });
    });
  };

  const columns = useMemo<ColumnDef<Employee>[]>(() => [
    { accessorKey: "fullName", header: "Nazwisko i imię" },
    { accessorKey: "hireDate", header: "Data zatrudnienia" },
    { accessorKey: "jobTitle", header: "Stanowisko" },
    { accessorKey: "department", header: "Dział" },
    { accessorKey: "manager", header: "Kierownik" },
    { accessorKey: "cardNumber", header: "Nr karty" },
    { accessorKey: "nationality", header: "Narodowość" },
    { accessorKey: "lockerNumber", header: "Nr szafki" },
    { accessorKey: "departmentLockerNumber", header: "Nr szafki w dziale" },
    { accessorKey: "sealNumber", header: "Nr pieczęci" },
    {
      id: "actions",
      cell: ({ row }) => {
        const employee = row.original;
        return (
           <EmployeeSummary employee={employee}>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Otwórz menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                  <DropdownMenuItem onSelect={() => handleEditEmployee(employee)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edytuj
                  </DropdownMenuItem>
                   <DropdownMenuItem onSelect={() => handleCopy(employee)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Kopiuj imię
                  </DropdownMenuItem>
                   <DropdownMenuItem>
                      <Bot className="mr-2 h-4 w-4" />
                       Generuj podsumowanie
                   </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onSelect={() => handleTerminateEmployee(employee.id)}>
                    <UserX className="mr-2 h-4 w-4" />
                    Zwolnij
                  </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </EmployeeSummary>
        );
      },
    },
  ], []);

  const renderMobileView = () => (
    <div className="w-full space-y-4">
        {filteredEmployees.slice(0, 50).map(employee => ( // Simple pagination for mobile
            <Card key={employee.id} onClick={() => handleEditEmployee(employee)} className="cursor-pointer">
                <CardHeader>
                    <CardTitle>{employee.fullName}</CardTitle>
                    <CardDescription>{employee.jobTitle}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    <p>Dział: {employee.department}</p>
                    <p>Kierownik: {employee.manager}</p>
                    <p>Nr karty: {employee.cardNumber}</p>
                </CardContent>
                <CardFooter className="flex justify-end">
                     <EmployeeSummary employee={employee}>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                <span className="sr-only">Otwórz menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={() => handleEditEmployee(employee)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edytuj
                              </DropdownMenuItem>
                               <DropdownMenuItem onSelect={() => handleCopy(employee)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Kopiuj imię
                              </DropdownMenuItem>
                               <DropdownMenuItem>
                                  <Bot className="mr-2 h-4 w-4" />
                                   Generuj podsumowanie
                               </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onSelect={() => handleTerminateEmployee(employee.id)}>
                                <UserX className="mr-2 h-4 w-4" />
                                Zwolnij
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </EmployeeSummary>
                </CardFooter>
            </Card>
        ))}
    </div>
  );

  if (isLoading || !hasMounted) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <PageHeader
        title="Pracownicy aktywni"
        description="Przeglądaj, filtruj i zarządzaj aktywnymi pracownikami."
      >
        <div className="hidden md:flex shrink-0 items-center space-x-2">
            <ExcelExportButton employees={filteredEmployees} fileName="aktywni_pracownicy" />
            <ExcelImportButton />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Usuń daty
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Czy jesteś absolutnie pewien?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie wszystkich
                    dat zatrudnienia dla wszystkich pracowników (aktywnych i zwolnionych).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllHireDates}>Kontynuuj</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Usuń wszystkich
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Czy jesteś absolutnie pewien?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tej akcji nie można cofnąć. Spowoduje to trwałe usunięcie wszystkich
                    pracowników (aktywnych i zwolnionych) z bazy danych.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllEmployees}>Kontynuuj</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Dodaj pracownika
            </Button>
        </div>
        <div className="md:hidden">
             <Button onClick={handleAddNew} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Dodaj
            </Button>
        </div>
      </PageHeader>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent 
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="sm:max-w-3xl max-h-[90vh] flex flex-col"
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingEmployee ? 'Edytuj pracownika' : 'Dodaj nowego pracownika'}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto -mr-6 pr-6">
            <EmployeeForm
              employee={editingEmployee}
              onSave={handleSaveEmployee}
              onCancel={() => setIsFormOpen(false)}
              config={config}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="mb-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Szukaj po nazwisku, imieniu, karcie..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
           <Button variant="outline" onClick={handleClearFilters}>
              <XCircle className="mr-2 h-4 w-4" />
              Wyczyść filtry
            </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <MultiSelect
              title="Dział"
              options={departmentOptions}
              selected={selectedDepartments}
              onChange={setSelectedDepartments}
            />
            <MultiSelect
              title="Stanowisko"
              options={jobTitleOptions}
              selected={selectedJobTitles}
              onChange={setSelectedJobTitles}
            />
            <MultiSelect
              title="Kierownik"
              options={managerOptions}
              selected={selectedManagers}
              onChange={setSelectedManagers}
            />
             <MultiSelect
              title="Narodowość"
              options={nationalityOptions}
              selected={selectedNationalities}
              onChange={setSelectedNationalities}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "PPP", { locale: pl }) : <span>Zatrudniony od</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateRange.from} onSelect={handleDateChange('from')} locale={pl} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, "PPP", { locale: pl }) : <span>Zatrudniony do</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateRange.to} onSelect={handleDateChange('to')} locale={pl} />
              </PopoverContent>
            </Popover>
        </div>
      </div>

       <div className="flex flex-col flex-grow">
        {hasMounted && isMobile 
          ? renderMobileView() 
          : <DataTable 
              columns={columns} 
              data={filteredEmployees} 
              onRowClick={handleEditEmployee}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
            />
        }
      </div>
    </div>
  );
}

    