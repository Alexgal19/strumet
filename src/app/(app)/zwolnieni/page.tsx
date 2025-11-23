
'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
import { MoreHorizontal, Search, Loader2, RotateCcw, Edit, CalendarIcon, Trash2, XCircle, Copy } from 'lucide-react';
import type { Employee, AllConfig } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { db } from '@/lib/firebase';
import { ref, update, remove } from "firebase/database";
import { format, parse, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TerminatedExcelImportButton } from '@/components/terminated-excel-import-button';
import { ExcelExportButton } from '@/components/excel-export-button';
import { useToast } from '@/hooks/use-toast';
import { EmployeeForm } from '@/components/employee-form';
import { MultiSelect, OptionType } from '@/components/ui/multi-select';
import { useIsMobile, useHasMounted } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table"
import { useVirtualizer } from '@tanstack/react-virtual';


const exportColumns = [
  { key: 'fullName' as keyof Employee, name: 'Nazwisko i imię' },
  { key: 'hireDate' as keyof Employee, name: 'Data zatrudnienia' },
  { key: 'terminationDate' as keyof Employee, name: 'Data zwolnienia' },
  { key: 'jobTitle' as keyof Employee, name: 'Stanowisko' },
  { key: 'department' as keyof Employee, name: 'Dział' },
  { key: 'manager' as keyof Employee, name: 'Kierownik' },
  { key: 'cardNumber' as keyof Employee, name: 'Nr karty' },
  { key: 'nationality' as keyof Employee, name: 'Narodowość' },
  { key: 'lockerNumber' as keyof Employee, name: 'Nr szafki' },
  { key: 'departmentLockerNumber' as keyof Employee, name: 'Nr szafki w dziale' },
  { key: 'sealNumber' as keyof Employee, name: 'Nr pieczęci' },
];


export default function ZwolnieniPage({ employees, config, isLoading }: { employees: Employee[], config: AllConfig, isLoading: boolean }) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({ from: undefined, to: undefined });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const selectedEmployeeIds = useMemo(() => Object.keys(rowSelection), [rowSelection]);

  const departmentOptions: OptionType[] = useMemo(() => config.departments.map(d => ({ value: d.name, label: d.name })), [config.departments]);
  const jobTitleOptions: OptionType[] = useMemo(() => config.jobTitles.map(j => ({ value: j.name, label: j.name })), [config.jobTitles]);

  const terminatedEmployees = useMemo(() => employees.filter(e => e.status === 'zwolniony'), [employees]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDepartments([]);
    setSelectedJobTitles([]);
    setSelectedManagers([]);
    setDateRange({ from: undefined, to: undefined });
    setRowSelection({});
  };

  const filteredEmployees = useMemo(() => {
    let filtered = terminatedEmployees;

    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(employee =>
            (employee.fullName && employee.fullName.toLowerCase().includes(searchLower)) ||
            (employee.cardNumber && employee.cardNumber.toLowerCase().includes(searchLower))
        );
    }
    
    if (selectedDepartments.length > 0) {
        filtered = filtered.filter(employee => selectedDepartments.includes(employee.department));
    }
    if (selectedManagers.length > 0) {
        filtered = filtered.filter(employee => selectedManagers.includes(employee.manager));
    }
    if (selectedJobTitles.length > 0) {
        filtered = filtered.filter(employee => selectedJobTitles.includes(employee.jobTitle));
    }

    if (dateRange.from || dateRange.to) {
        filtered = filtered.filter(employee => {
            if (!employee.terminationDate || typeof employee.terminationDate !== 'string') return false;
            
            try {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(employee.terminationDate)) return false;

                const terminationDate = parse(employee.terminationDate, 'yyyy-MM-dd', new Date());
                if (isNaN(terminationDate.getTime())) return false;

                const from = dateRange.from ? startOfDay(dateRange.from) : undefined;
                const to = dateRange.to ? endOfDay(dateRange.to) : undefined;
                
                if (from && to) return isWithinInterval(terminationDate, { start: from, end: to });
                if (from) return terminationDate >= from;
                if (to) return terminationDate <= to;
                return true;
            } catch (e) {
                console.error("Error parsing termination date:", e);
                return false;
            }
        });
    }

    if (selectedEmployeeIds.length > 0) {
        const selectedSet = new Set(selectedEmployeeIds);
        return filtered.filter(employee => selectedSet.has(employee.id));
    }

    return filtered;
  }, [terminatedEmployees, searchTerm, selectedDepartments, selectedManagers, selectedJobTitles, dateRange, selectedEmployeeIds]);

  const handleDateChange = (type: 'from' | 'to') => (date: Date | undefined) => {
    setDateRange(prev => ({ ...prev, [type]: date }));
  };

  const handleRestoreEmployee = async (employeeId: string) => {
    if (window.confirm('Czy na pewno chcesz przywrócić tego pracownika?')) {
        try {
            const employeeRef = ref(db, `employees/${employeeId}`);
            await update(employeeRef, {
                status: 'aktywny',
                terminationDate: null 
            });
            toast({ title: 'Sukces', description: 'Pracownik został przywrócony.' });
        } catch (error) {
            console.error("Error restoring employee: ", error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się przywrócić pracownika.' });
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
  
  const handleSaveEmployee = async (employeeData: Employee) => {
    if (!editingEmployee) return;
    try {
        const { id, ...dataToSave } = employeeData;
        
        // Convert undefined to null for Firebase compatibility
        Object.keys(dataToSave).forEach(key => {
            if ((dataToSave as any)[key] === undefined) {
                (dataToSave as any)[key] = null;
            }
        });

        const employeeRef = ref(db, `employees/${id}`);
        await update(employeeRef, dataToSave);
        setEditingEmployee(null);
        setIsFormOpen(false);
        toast({ title: 'Sukces', description: 'Dane pracownika zostały zaktualizowane.' });
    } catch (error) {
        console.error("Error saving employee: ", error);
        toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zapisać danych.' });
    }
  };

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
      { accessorKey: "terminationDate", header: "Data zwolnienia" },
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleRestoreEmployee(employee.id)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Przywróć
                    </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
          );
        },
      },
  ], []);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredEmployees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140, // Approximate height of a card
    overscan: 5,
  });

  const MobileCard = useCallback(({ employee, style }: { employee: Employee, style: React.CSSProperties }) => (
    <div style={style} className="px-1 py-1.5">
      <Card onClick={() => handleEditEmployee(employee)} className="cursor-pointer animate-fade-in-up">
          <CardHeader>
            <CardTitle>{employee.fullName}</CardTitle>
            <CardDescription>{employee.jobTitle}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Data zwolnienia: {employee.terminationDate}</p>
            <p>Dział: {employee.department}</p>
          </CardContent>
          <CardFooter className="flex justify-end">
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
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => handleRestoreEmployee(employee.id)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Przywróć
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      </div>
  ), [handleEditEmployee, handleCopy, handleRestoreEmployee]);

  const renderMobileView = () => {
    if (filteredEmployees.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-10">
          <UserX className="h-12 w-12 mb-4" />
          <h3 className="text-lg font-semibold">Brak pracowników</h3>
          <p className="text-sm">Nie znaleziono pracowników pasujących do wybranych kryteriów filtrowania.</p>
        </div>
      )
    }
    return (
      <div ref={parentRef} className="w-full h-full overflow-y-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem.tsx) => {
            const employee = filteredEmployees[virtualItem.tsx.index];
            return (
              <MobileCard
                key={employee.id}
                employee={employee}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.tsx.size}px`,
                  transform: `translateY(${virtualItem.tsx.start}px)`,
                }}
              />
            );
          })}
        </div>
      </div>
    );
  };
  
  if (isLoading || !hasMounted) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Pracownicy zwolnieni"
        description="Przeglądaj historię zwolnionych pracowników."
      >
        <div className="hidden md:flex shrink-0 items-center space-x-2">
            <ExcelExportButton employees={filteredEmployees} fileName="zwolnieni_pracownicy" columns={exportColumns} />
            <TerminatedExcelImportButton />
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
        </div>
      </PageHeader>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent 
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-3xl max-h-[90vh] flex flex-col"
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edytuj pracownika</DialogTitle>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "PPP", { locale: pl }) : <span>Zwolniony od</span>}
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
                  {dateRange.to ? format(dateRange.to, "PPP", { locale: pl }) : <span>Zwolniony do</span>}
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
